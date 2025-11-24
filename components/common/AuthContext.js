"use client";
import React, { createContext, useState } from "react";

const AuthContext = createContext({
  user: {},
  setUser: () => {},
  clearUser: () => {},
});

export const AuthProvider = ({ children }) => {
  const [authLoading, setAuthLoading] = useState(false);
  const [user, setUser] = useState({});

  const clearUser = () => {
    setUser(null);
    setAuthLoading(false);
  };

  const handleSetUser = (user) => {
    console.log("setContextUser called in AuthContext")
    setUser(user);
    setAuthLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, setContextUser: handleSetUser}}
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
