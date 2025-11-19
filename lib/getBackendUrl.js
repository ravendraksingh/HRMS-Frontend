/**
 * Get the backend API base URL from environment variables
 * @returns {string} The backend API base URL
 */
export function getBackendUrl() {
  // Server-side: use BACKEND_API_BASE_URL
  if (typeof window === "undefined") {
    return process.env.BACKEND_API_BASE_URL || "http://localhost:8080";
  }
  // Client-side: use NEXT_PUBLIC_BACKEND_API_BASE_URL
  return process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL || "http://localhost:8080";
}

