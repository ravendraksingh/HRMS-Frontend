/**
 * Internal API Client
 * For calling Next.js API routes (e.g., /api/employees, /api/auth/login)
 * - No baseURL (uses relative paths)
 * - No authentication tokens (handled by Next.js API routes via Authorization header)
 * - Uses withCredentials for CORS
 */

import axios from "axios";
import logger from "@/lib/logger";

export const internalApiClient = axios.create({
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add request interceptor for internal API client
internalApiClient.interceptors.request.use(
  (config) => {
    // No token needed - Next.js API routes handle auth via Authorization header
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
internalApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle errors for internal API routes
    // Backend returns errors in format: { "error": "error message", "status": 404, "path": "/employees/123", "method": "GET" }
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.error || data?.message || error.message || "An error occurred";
      
      // Create child logger with request context
      const requestLogger = logger.child({
        type: 'internal_api_error',
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        statusCode: status,
      });

      // Log based on severity
      if (status === 401) {
        requestLogger.warn({
          err: error,
          errorMessage,
          responseData: data,
          action: 'authentication_failed',
        }, 'Internal API authentication failed');
      } else if (status === 403) {
        requestLogger.warn({
          err: error,
          errorMessage,
          responseData: data,
          action: 'authorization_failed',
        }, 'Internal API authorization failed');
      } else if (status >= 500) {
        requestLogger.error({
          err: error,
          errorMessage,
          responseData: data,
          action: 'server_error',
        }, `Internal API server error (${status})`);
      } else {
        requestLogger.warn({
          err: error,
          errorMessage,
          responseData: data,
          action: 'client_error',
        }, `Internal API client error (${status})`);
      }
    } else if (error.request) {
      // Network Error - no response received
      const networkLogger = logger.child({
        type: 'internal_network_error',
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
      });

      networkLogger.error({
        err: error,
        code: error.code,
        message: error.message,
        timeout: error.config?.timeout,
        action: 'network_failure',
      }, 'Internal API network request failed - no response received');
    } else {
      // Request Setup Error
      logger.error({
        err: error,
        type: 'internal_request_setup_error',
        message: error.message,
        action: 'request_configuration_failed',
      }, 'Error setting up internal API request');
    }
    return Promise.reject(error);
  }
);

export default internalApiClient;

