/**
 * Token Storage - sessionStorage only
 * Simple token storage using browser sessionStorage
 */

// In-memory storage for access token (for performance)
let accessTokenMemory = null;

/**
 * Server-side token storage interface (for API routes)
 * For sessionStorage mode, tokens are client-side only
 * This is kept for compatibility but won't be used
 */
export const serverTokenStorage = {
  getAccessToken: async function () {
    return null; // sessionStorage is client-side only
  },
  getRefreshToken: async function () {
    return null; // sessionStorage is client-side only
  },
  setAccessToken: async function () {
    // No-op for sessionStorage
  },
  setRefreshToken: async function () {
    // No-op for sessionStorage
  },
  clearTokens: async function () {
    // No-op for sessionStorage
  },
};

/**
 * Client-side token storage interface
 * Only supports sessionStorage
 */
export const clientTokenStorage = {
  // Get access token from sessionStorage
  getAccessToken: async function () {
    if (typeof window === "undefined") return null;

    // Check memory first
    if (accessTokenMemory) return accessTokenMemory;

    // Get from sessionStorage
    const token = sessionStorage.getItem("accessToken");
    if (token) accessTokenMemory = token;
    return token;
  },

  // Set access token in sessionStorage
  setAccessToken: async function (token) {
    if (typeof window === "undefined") return;

    // Store in memory
    accessTokenMemory = token;

    // Store in sessionStorage
    if (token) {
      sessionStorage.setItem("accessToken", token);
    } else {
      sessionStorage.removeItem("accessToken");
    }
  },

  // Get refresh token from sessionStorage
  getRefreshToken: async function () {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("refreshToken");
  },

  // Set refresh token in sessionStorage
  setRefreshToken: async function (token) {
    if (typeof window === "undefined") return;

    if (token) {
      sessionStorage.setItem("refreshToken", token);
    } else {
      sessionStorage.removeItem("refreshToken");
    }
  },

  // Clear all tokens from sessionStorage
  clearTokens: async function () {
    if (typeof window === "undefined") return;

    // Clear memory
    accessTokenMemory = null;

    // Clear from sessionStorage
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
  },
};
