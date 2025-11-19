/**
 * Token Storage - Supports multiple storage mechanisms
 * Storage type is controlled by NEXT_PUBLIC_TOKEN_STORAGE_TYPE environment variable:
 * - "cookie" - httpOnly cookies (most secure, server-side only)
 * - "sessionStorage" - sessionStorage (client-side, cleared on tab close)
 * - "localStorage" - localStorage (client-side, persistent)
 *
 * Default: "localStorage" if not specified
 */

// In-memory storage for access token (client-side only, for cookie mode)
let accessTokenMemory = null;

// Get storage type from environment variable
const getStorageType = () => {
  if (typeof window === "undefined") {
    // Server-side: always use cookies
    return "cookie";
  }
  return (
    process.env.NEXT_PUBLIC_TOKEN_STORAGE_TYPE || "localStorage"
  ).toLowerCase();
};

/**
 * Server-side token storage interface (for API routes)
 * Reads from httpOnly cookies
 */
export const serverTokenStorage = {
  // Get access token from cookies (server-side only)
  getAccessToken: async function () {
    if (typeof window !== "undefined") return null;

    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const tokenCookie = cookieStore.get("accessToken");
      return tokenCookie ? tokenCookie.value : null;
    } catch (error) {
      console.error("Error reading access token from cookies:", error);
      return null;
    }
  },

  // Get refresh token from cookies (server-side only)
  getRefreshToken: async function () {
    if (typeof window !== "undefined") return null;

    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const refreshCookie = cookieStore.get("refreshToken");
      return refreshCookie ? refreshCookie.value : null;
    } catch (error) {
      console.error("Error reading refresh token from cookies:", error);
      return null;
    }
  },

  // Set access token in httpOnly cookie
  setAccessToken: async function (token, response) {
    if (typeof window !== "undefined") return;

    if (response && token) {
      response.cookies.set("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60, // 15 minutes
      });
    }
  },

  // Set refresh token in httpOnly cookie
  setRefreshToken: async function (token, response) {
    if (typeof window !== "undefined") return;

    if (response && token) {
      response.cookies.set("refreshToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth/refresh", // Only send to refresh endpoint
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }
  },

  // Clear all tokens from cookies
  clearTokens: async function (response) {
    if (typeof window !== "undefined") return;

    if (response) {
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
    }
  },
};

/**
 * Client-side token storage interface
 * Supports localStorage, sessionStorage, and cookie-based storage
 */
export const clientTokenStorage = {
  // Get storage type
  getStorageType: function () {
    return getStorageType();
  },

  // Get access token (client-side)
  getAccessToken: async function () {
    if (typeof window === "undefined") return null;

    const storageType = getStorageType();

    // Cookie mode: fetch from API endpoint
    if (storageType === "cookie") {
      // Check memory first
      if (accessTokenMemory) return accessTokenMemory;

      try {
        const response = await fetch("/api/auth/token", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.accessToken) {
            accessTokenMemory = data.accessToken;
            return data.accessToken;
          }
        }
      } catch (error) {
        console.debug("Could not fetch token from cookies:", error);
      }
      return null;
    }

    // sessionStorage mode
    if (storageType === "sessionstorage") {
      // Check memory first
      if (accessTokenMemory) return accessTokenMemory;
      const token = sessionStorage.getItem("accessToken");
      if (token) accessTokenMemory = token;
      return token;
    }

    // localStorage mode (default)
    if (accessTokenMemory) return accessTokenMemory;
    return localStorage.getItem("accessToken");
  },

  // Set access token (client-side)
  setAccessToken: async function (token) {
    if (typeof window === "undefined") return;

    const storageType = getStorageType();

    // Store in memory
    accessTokenMemory = token;

    // Cookie mode: tokens are set server-side, just update memory
    if (storageType === "cookie") {
      // Memory already updated above
      return;
    }

    // sessionStorage mode
    if (storageType === "sessionstorage") {
      if (token) {
        sessionStorage.setItem("accessToken", token);
      } else {
        sessionStorage.removeItem("accessToken");
      }
      return;
    }

    // localStorage mode (default)
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
  },

  // Get refresh token (client-side)
  getRefreshToken: async function () {
    if (typeof window === "undefined") return null;

    const storageType = getStorageType();

    // Cookie mode: refresh token should be httpOnly, not accessible client-side
    if (storageType === "cookie") {
      return null; // Refresh token is httpOnly, not accessible from client
    }

    // sessionStorage mode
    if (storageType === "sessionstorage") {
      return sessionStorage.getItem("refreshToken");
    }

    // localStorage mode (default)
    return localStorage.getItem("refreshToken");
  },

  // Set refresh token (client-side)
  setRefreshToken: async function (token) {
    if (typeof window === "undefined") return;

    const storageType = getStorageType();

    // Cookie mode: refresh token is set server-side
    if (storageType === "cookie") {
      return; // Refresh token is httpOnly, set server-side
    }

    // sessionStorage mode
    if (storageType === "sessionstorage") {
      if (token) {
        sessionStorage.setItem("refreshToken", token);
      } else {
        sessionStorage.removeItem("refreshToken");
      }
      return;
    }

    // localStorage mode (default)
    if (token) {
      localStorage.setItem("refreshToken", token);
    } else {
      localStorage.removeItem("refreshToken");
    }
  },

  // Clear all tokens (client-side)
  clearTokens: async function () {
    if (typeof window === "undefined") return;

    const storageType = getStorageType();

    // Clear memory
    accessTokenMemory = null;

    // Cookie mode: clear via API endpoint
    if (storageType === "cookie") {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.debug("Error clearing cookies:", error);
      }
      return;
    }

    // sessionStorage mode
    if (storageType === "sessionstorage") {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      return;
    }

    // localStorage mode (default)
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};
