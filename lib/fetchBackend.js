/**
 * Server-side Backend API Client
 *
 * This module provides a server-side function to call external backend APIs
 * using axios. It handles authentication tokens automatically.
 * Organization ID is extracted from the JWT token by the backend.
 *
 * @module lib/fetchBackend
 */

import axios from "axios";
import { cookies } from "next/headers";
import { getBackendUrl } from "./getBackendUrl";
import logger from "./logger";

// Create axios instance for server-side API calls
const serverAxios = axios.create({
  baseURL: getBackendUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add response interceptor for error handling
serverAxios.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    // Handle common errors
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (typeof data === "object") {
        // Extract error message from backend error format
        const errorMessage = data.error || data.message || error.message;
        error.message = errorMessage;
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Get token from Authorization header or cookie based on storage type
 * @param {Request} req - The request object
 * @returns {Promise} Promise that resolves to an object with token property
 */
async function getAuthHeaders(req) {
  // Determine storage type from environment variable
  const storageType = (
    process.env.NEXT_PUBLIC_TOKEN_STORAGE_TYPE || "localStorage"
  ).toLowerCase();

  let token = null;

  // Get token based on storage type
  if (storageType === "cookie") {
    // Get token from httpOnly cookie (server-side only)
    try {
      const cookieStore = await cookies();
      const tokenCookie = cookieStore.get("accessToken");
      token = tokenCookie ? tokenCookie.value : null;
    } catch (error) {
      logger.error({
        err: error,
        type: 'token_read_error',
        action: 'read_access_token_from_cookie',
      }, 'Error reading access token from cookies');
      token = null;
    }
  } else {
    // Get token from Authorization header (localStorage/sessionStorage mode)
    const authHeader = req.headers.get("Authorization");
    token = authHeader ? authHeader.replace("Bearer ", "") : null;
  }

  if (!token) {
    const errorMessage =
      storageType === "cookie"
        ? "No token found in accessToken cookie"
        : "No token found in Authorization header";
    throw new Error(errorMessage);
  }

  return {
    token: token,
  };
}

/**
 * Fetch from backend API with authentication
 * This is a server-side only function that uses the centralized axios instance
 *
 * @param {string} url - The API endpoint (relative or absolute)
 * @param {object} options - Request options (method, body, headers, params, etc.)
 * @param {object} req - The request object (required)
 * @returns {Promise} Promise that resolves to axios response object
 *
 * @example
 * // GET request
 * const res = await fetchBackend('/employees', {}, req);
 * const data = res.data;
 *
 * @example
 * // POST request
 * const res = await fetchBackend('/employees', {
 *   method: 'POST',
 *   body: { name: 'John Doe' }
 * }, req);
 */
export async function fetchBackend(url, options = {}, req = null) {
  try {
    // Get authentication headers from request
    if (!req) {
      throw new Error("Request object is required for fetchBackend");
    }
    const { token } = await getAuthHeaders(req);

    // Prepare axios config using the server-side axios instance
    const config = {
      method: options.method || "GET",
      url: url, // Axios handles baseURL automatically for relative URLs
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    // Handle request body
    if (options.body) {
      config.data =
        typeof options.body === "string"
          ? JSON.parse(options.body)
          : options.body;
    } else if (options.data) {
      config.data = options.data;
    }

    // Handle query parameters
    if (options.params) {
      config.params = options.params;
    }

    // Make request using server-side axios instance
    const response = await serverAxios(config);
    // Just return the Axios response directly
    return response;
  } catch (error) {
    // Backend returns errors in format: { "error": "error message", "status": 404, "path": "/employees/123", "method": "GET" }
    // Enhance error object with error message from backend if available
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (typeof data === "object") {
        // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
        // Ensure error message is accessible (prefer "error" field, fallback to "message" for backward compatibility)
        error.message = data.error || data.message || error.message;
      }
    }
    
    // Log server-side backend API errors
    const requestLogger = logger.child({
      type: 'server_backend_api_error',
      method: options.method || 'GET',
      url: url,
      baseURL: getBackendUrl(),
    });

    if (error.response) {
      // API Error - response received
      const { status, data } = error.response;
      const errorMessage = data?.error || data?.message || error.message || "An error occurred";
      
      if (status >= 500) {
        requestLogger.error({
          err: error,
          statusCode: status,
          errorMessage,
          responseData: data,
          action: 'server_backend_api_failure',
        }, `Server-side backend API error (${status})`);
      } else {
        requestLogger.warn({
          err: error,
          statusCode: status,
          errorMessage,
          responseData: data,
          action: 'server_backend_api_client_error',
        }, `Server-side backend API client error (${status})`);
      }
    } else if (error.request) {
      // Network Error
      requestLogger.error({
        err: error,
        code: error.code,
        message: error.message,
        action: 'server_backend_network_failure',
      }, 'Server-side backend API network error - no response received');
    } else {
      // Request Setup Error
      requestLogger.error({
        err: error,
        message: error.message,
        action: 'server_backend_request_setup_failed',
      }, 'Error setting up server-side backend API request');
    }
    
    // Just re-throw axios errors; caller should handle them
    throw error;
  }
}
