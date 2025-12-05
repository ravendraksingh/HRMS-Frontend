"use client";
import React, { createContext, useState, useEffect } from "react";
import { clientTokenStorage } from "@/lib/tokenStorage";

const AuthContext = createContext({
  user: null,
  setUser: () => {},
  clearUser: () => {},
  authLoading: false,
});

export const AuthProvider = ({ children }) => {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Restore user data on mount if token exists in sessionStorage
  useEffect(() => {
    const restoreUser = async () => {
      try {
        // Get token from sessionStorage
        const token = await clientTokenStorage.getAccessToken();

        if (!token) {
          setAuthLoading(false);
          return;
        }

        // Fetch user data from external API using the token
        try {
          const { externalApiClient } = await import(
            "@/app/services/externalApiClient"
          );

          // Get username from token payload (decode JWT)
          let username = null;
          try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map(
                  (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                )
                .join("")
            );
            const payload = JSON.parse(jsonPayload);
            username = payload.username;
          } catch (error) {
            console.error("Error decoding token:", error);
          }

          if (username) {
            // Fetch user profile from external API
            const res = await externalApiClient.get(`/users/${username}`);
            const userData = res.data?.user || res.data;

            if (userData) {
              //   console.log("User restored from external API:", userData);
              setUser(userData);
            }
          } else {
            // If no username in token, try to get user from token payload
            console.warn("No username in token, cannot fetch user profile");
          }
        } catch (error) {
          console.error("Error fetching user from external API:", error);

          // If API call fails with 401, token is invalid - clear and redirect
          if (error?.response?.status === 401) {
            console.log(
              "Token invalid or expired, clearing tokens and redirecting to login"
            );
            setUser(null);
            await clientTokenStorage.clearTokens();

            if (
              typeof window !== "undefined" &&
              !window.location.pathname.startsWith("/login")
            ) {
              window.location.href = "/login";
            }
          }
          // For other errors, don't clear tokens - might be temporary
        }
      } catch (error) {
        console.error("Error restoring user:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreUser();
  }, []);

  const clearUser = () => {
    setUser(null);
    setAuthLoading(false);
  };

  const handleSetUser = (user) => {
    console.log("setContextUser called in AuthContext");
    setUser(user);
    setAuthLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setContextUser: handleSetUser,
        clearUser: clearUser,
        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
