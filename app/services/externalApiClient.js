/**
 * External API Client
 * For calling external backend APIs directly
 * - Uses backend baseURL from environment variables
 * - Includes authentication tokens in headers
 * - Uses withCredentials for CORS
 */

import axios from "axios";
import { clientTokenStorage } from "@/lib/tokenStorage";

/**
 * Get access token from sessionStorage
 */
const getToken = async () => {
  try {
    return await clientTokenStorage.getAccessToken();
  } catch (error) {
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
    const refreshToken = await clientTokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const refreshOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ refresh_token: refreshToken }),
    };

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

    return (
      refreshData.accessToken || (await clientTokenStorage.getAccessToken())
    );
  } catch (error) {
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
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";

    // Handle 401 errors - attempt token refresh
    if (error.response?.status === 401) {
      // Don't try refresh if already on login page
      if (currentPath === "/login" || currentPath.startsWith("/login")) {
        return Promise.reject(error);
      }

      // Check if this request has already been retried
      if (originalRequest._retry) {
        // Already retried, refresh must have failed - redirect to login
        await clientTokenStorage.clearTokens();

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(error);
      }

      // Check if we have a token (if not, user is not authenticated)
      const token = await getToken();
      if (!token) {
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
    // Backend returns errors in format:
    // - Simple: { "error": "error message", "status": 404, "path": "/employees/123", "method": "GET" }
    // - Nested: { "error": { "message": "...", "code": "NOT_FOUND", "status": 404 } }
    if (error.response) {
      // API Error - response received
      const { status, data } = error.response;

      // Extract error message from nested error object if present
      let message = "An error occurred";
      let code = null;

      if (data?.error) {
        if (typeof data.error === "object" && data.error.message) {
          // Nested error format: { error: { message: "...", code: "...", status: ... } }
          message = data.error.message;
          code = data.error.code || null;
        } else if (typeof data.error === "string") {
          // Simple error format: { error: "..." }
          message = data.error;
        }
      } else if (data?.message) {
        message = data.message;
        code = data.code || null;
      } else if (error.message) {
        message = error.message;
      }

      // Simplify error response for quick browser-level processing
      // Provides flat structure: { message, code, status }
      error.response.data = {
        message,
        code,
        status,
      };
    }
    return Promise.reject(error);
  }
);

export default externalApiClient;
