// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

const AUTH_INVALID_EVENT = "auth:invalid-token";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    const handleInvalidToken = (event) => {
      logout();
      setAuthMessage(event?.detail?.message || "Invalid token");
      window.localStorage.setItem(
        "auth-message",
        event?.detail?.message || "Invalid token"
      );
    };

    window.addEventListener(AUTH_INVALID_EVENT, handleInvalidToken);

    return () => {
      window.removeEventListener(AUTH_INVALID_EVENT, handleInvalidToken);
    };
  }, []);

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    setAuthMessage("");
    localStorage.removeItem("auth-message");
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", tokenData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthMessage("");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("auth-message");
  };

  return (
    <AuthContext.Provider value={{ user, token, authMessage, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
