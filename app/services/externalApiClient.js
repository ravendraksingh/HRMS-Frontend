/**
 * External API Client
 * For calling external backend APIs directly
 * - Uses backend baseURL from environment variables
 * - Includes authentication tokens in headers
 * - Uses withCredentials for CORS
 */

import axios from "axios";
import { clientTokenStorage } from "@/lib/tokenStorage";
import logger from "@/lib/logger";

/**
 * Get access token using token storage abstraction
 * Now supports async operations for cookie-based storage
 */
const getToken = async () => {
  try {
    return await clientTokenStorage.getAccessToken();
  } catch (error) {
    logger.error({
      err: error,
      type: 'token_storage_error',
      action: 'get_access_token',
    }, 'Error getting access token from storage');
    return null;
  }
};

// Track ongoing refresh to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers = [];

/**
 * Subscribe to token refresh - queues requests while refresh is in progress
 */
const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

/**
 * Notify all queued requests that token refresh is complete
 */
const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

/**
 * Attempt to refresh the access token using refresh token
 */
const refreshAccessToken = async () => {
  try {
    const storageType = clientTokenStorage.getStorageType();
    
    // Prepare refresh request
    const refreshOptions = {
      method: "POST",
      headers: {},
      credentials: "include",
    };

    // For localStorage/sessionStorage, include refresh token in body
    if (storageType !== "cookie") {
      const refreshToken = await clientTokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }
      refreshOptions.headers["Content-Type"] = "application/json";
      refreshOptions.body = JSON.stringify({ refresh_token: refreshToken });
    }
    // For cookie mode, refresh token is in httpOnly cookie, no body needed

    const refreshResponse = await fetch("/api/auth/refresh", refreshOptions);

    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.json().catch(() => ({}));
      throw new Error(errorData.error || "Token refresh failed");
    }

    const refreshData = await refreshResponse.json();

    // Update tokens in storage
    if (refreshData.accessToken) {
      await clientTokenStorage.setAccessToken(refreshData.accessToken);
    }
    if (refreshData.refreshToken) {
      await clientTokenStorage.setRefreshToken(refreshData.refreshToken);
    }

    return refreshData.accessToken || await clientTokenStorage.getAccessToken();
  } catch (error) {
    logger.error({
      err: error,
      type: 'token_refresh_error',
      action: 'refresh_access_token',
    }, 'Error refreshing access token');
    throw error;
  }
};

export const externalApiClient = axios.create({
  baseURL:
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL || "http://localhost:8080"
      : "http://localhost:8080",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add request interceptor to include auth token for external API
externalApiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
externalApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

    // Handle 401 errors - attempt token refresh
    if (error.response?.status === 401) {
      // Don't try refresh if already on login page
      if (currentPath === "/login" || currentPath.startsWith("/login")) {
        return Promise.reject(error);
      }

      // Check if this request has already been retried
      if (originalRequest._retry) {
        // Already retried, refresh must have failed - redirect to login
        logger.warn({
          err: error,
          type: 'authentication_error',
          action: 'token_refresh_failed_after_retry',
          path: currentPath,
          url: originalRequest?.url,
        }, 'Token refresh failed after retry, redirecting to login');
        await clientTokenStorage.clearTokens();
        
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        
        return Promise.reject(error);
      }

      // Check if we have a token (if not, user is not authenticated)
      const token = await getToken();
      if (!token) {
        logger.warn({
          err: error,
          type: 'authentication_error',
          action: 'no_token_found',
          path: currentPath,
          url: originalRequest?.url,
        }, 'Unauthorized - no token found, redirecting to login');
        
        await clientTokenStorage.clearTokens();
        
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        
        return Promise.reject(error);
      }

      // Check if refresh is already in progress
      if (isRefreshing) {
        // Wait for the ongoing refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(externalApiClient(originalRequest));
            } else {
              resolve(Promise.reject(error));
            }
          });
        });
      }

      // Mark that we're attempting refresh
      isRefreshing = true;
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const newToken = await refreshAccessToken();

        if (newToken) {
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Notify all queued requests
          onRefreshed(newToken);

          // Retry the original request
          return externalApiClient(originalRequest);
        } else {
          throw new Error("No token received from refresh");
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        logger.error({
          err: refreshError,
          type: 'token_refresh_error',
          action: 'refresh_failed',
          path: currentPath,
          url: originalRequest?.url,
        }, 'Token refresh failed, redirecting to login');
        isRefreshing = false;
        refreshSubscribers = [];
        
        await clientTokenStorage.clearTokens();
        
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Handle errors for external API calls
    // Backend returns errors in format: { "error": "error message", "status": 404, "path": "/employees/123", "method": "GET" }
    if (error.response) {
      // API Error - response received
      const { status, data, headers } = error.response;
      const errorMessage = data?.error || data?.message || error.message || "An error occurred";
      
      // Create child logger with request context
      const requestLogger = logger.child({
        type: 'api_error',
        method: originalRequest?.method?.toUpperCase(),
        url: originalRequest?.url,
        baseURL: originalRequest?.baseURL,
        path: data?.path || originalRequest?.url,
        statusCode: status,
        statusText: error.response.statusText,
      });

      // Log based on severity
      if (status === 401) {
        requestLogger.warn({
          err: error,
          errorMessage,
          responseData: data,
          action: 'authentication_failed',
        }, 'Authentication failed - unauthorized request');
      } else if (status === 403) {
        requestLogger.warn({
          err: error,
          errorMessage,
          responseData: data,
          action: 'authorization_failed',
        }, 'Authorization failed - insufficient permissions');
      } else if (status >= 500) {
        requestLogger.error({
          err: error,
          errorMessage,
          responseData: data,
          requestData: originalRequest?.data,
          action: 'server_error',
        }, `Server error (${status}) - backend API failure`);
      } else {
        requestLogger.warn({
          err: error,
          errorMessage,
          responseData: data,
          action: 'client_error',
        }, `Client error (${status}) - invalid request`);
      }

      // Enhance error object with error message from backend
      if (data && typeof data === "object") {
        error.response.data = { ...data, errorMessage: errorMessage };
      }
    } else if (error.request) {
      // Network Error - no response received
      const networkLogger = logger.child({
        type: 'network_error',
        method: originalRequest?.method?.toUpperCase(),
        url: originalRequest?.url,
        baseURL: originalRequest?.baseURL,
      });

      networkLogger.error({
        err: error,
        code: error.code, // ECONNREFUSED, ETIMEDOUT, ENOTFOUND, etc.
        message: error.message,
        timeout: originalRequest?.timeout,
        action: 'network_failure',
      }, 'Network request failed - no response from server');
    } else {
      // Request Setup Error
      logger.error({
        err: error,
        type: 'request_setup_error',
        message: error.message,
        action: 'request_configuration_failed',
      }, 'Error setting up API request');
    }
    return Promise.reject(error);
  }
);

export default externalApiClient;

