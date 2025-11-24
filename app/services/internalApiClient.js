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
    return Promise.reject(error);
  }
);

export default internalApiClient;

