"use client";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { externalApiClient } from "@/app/services/externalApiClient";
import { internalApiClient } from "@/app/services/internalApiClient";
import { clientTokenStorage } from "@/lib/tokenStorage";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const userSetExternallyRef = useRef(false); // Track if user was set from login

  // Initialize: fetch user if token exists (only on mount/page refresh)
  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window === "undefined") return;

      // Get token based on storage type (supports async for cookie mode)
      const storedToken = await clientTokenStorage.getAccessToken();
      console.log("storedToken", storedToken);

      if (!storedToken) {
        // No token = not authenticated
        setLoading(false);
        return;
      }

      // Set token in storage (for localStorage/sessionStorage modes)
      await clientTokenStorage.setAccessToken(storedToken);

      // Only fetch if user was NOT set externally (e.g., from login)
      // This prevents overwriting user set from login
      if (userSetExternallyRef.current) {
        setLoading(false);
        return;
      }

      // User not set externally, fetch from API (page refresh scenario)
      try {
        setLoading(true);
        const userRes = await externalApiClient.get(`/users/profile`);
        const userData = userRes.data;
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        if (error.response?.status === 401) {
          await clientTokenStorage.clearTokens();
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // Only run once on mount

  // Custom setUser that marks user as set externally (from login)
  const setUserExternally = (userData) => {
    userSetExternallyRef.current = true;
    setUser(userData);
  };

  // Fetch/refresh user details if needed (e.g., missing employee_code or organization details)
  const fetchUserDetails = async () => {
    if (!user?.user_id) {
      return; // Don't fetch if no user ID
    }

    // Only fetch if critical data is missing
    const needsRefresh = !user.employee_code || !user.organization_code;

    if (!needsRefresh) {
      return; // User already has all necessary data
    }

    try {
      setLoading(true);
      const userRes = await externalApiClient.get(`/user/profile`);
      const userData = userRes.data.user || userRes.data;

      // Merge with existing user data, preserving all fields
      const updatedUser = {
        ...user,
        ...userData,
        // Preserve existing fields that might not be in userData
        org_id: userData.organization_id,
        employee_id: user.employee_id,
        employee_code: userData.employee_code || user.employee_code,
        organization_code: userData.organization_code || user.organization_code,
        organization_name: userData.organization_name || user.organization_name,
      };
      console.log("updatedUser", updatedUser);
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Clear all auth state (for logout) - kept for backward compatibility
  const clearAuth = async () => {
    await clientTokenStorage.clearTokens();
    setUser(null);
    setLoading(false);
    userSetExternallyRef.current = false; // Reset for next login
  };

  // Centralized logout method that handles everything
  const logout = async () => {
    if (typeof window === "undefined") return;

    try {
      // Clear tokens based on storage type
      const storageType = clientTokenStorage.getStorageType();
      console.log(`Logging out - clearing tokens from ${storageType}`);
      await clientTokenStorage.clearTokens();

      // Clear AuthContext state
      setUser(null);
      setLoading(false);
      userSetExternallyRef.current = false; // Reset for next login

      // Clear sessionStorage if not using it for tokens
      if (storageType !== "sessionstorage") {
        sessionStorage.clear();
      }

      // Call logout API endpoint
      try {
        const res = await internalApiClient.post("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        console.log("Logout API response:", res.status, res.data);
      } catch (error) {
        console.error("Logout API error:", error);
        // Continue with redirect even if API call fails
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Still clear state and redirect even if there's an error
      await clearAuth();
    } finally {
      // Always redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: setUserExternally, // Use the flagged version
        fetchUserDetails,
        clearAuth, // Kept for backward compatibility
        logout, // Centralized logout method
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
