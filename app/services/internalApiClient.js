/**
 * Internal API Client
 * For calling Next.js API routes (e.g., /api/employees, /api/auth/login)
 * - No baseURL (uses relative paths)
 * - No authentication tokens (handled by Next.js API routes via Authorization header)
 * - Uses withCredentials for CORS
 */

import axios from "axios";

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

      // Extract error message from backend error format
      let errorMessage = error.message || "An error occurred";
      if (data) {
        if (typeof data === "object") {
          // New format: { "error": "...", "status": 404, "path": "...", "method": "..." }
          errorMessage = data.error || data.message || errorMessage;
        } else if (typeof data === "string") {
          errorMessage = data;
        }
      }

      //   if (status === 401) {
      //     console.error("Unauthorized - please login:", errorMessage);
      //   } else if (status === 403) {
      //     console.error("Forbidden - insufficient permissions:", errorMessage);
      //   } else if (status >= 500) {
      //     console.error("Internal server error:", errorMessage);
      //   } else {
      //     console.error(`API error (${status}):`, errorMessage);
      //   }
    } else if (error.request) {
      console.error("Network error - no response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    return Promise.reject(error);
  }
);

export default internalApiClient;

