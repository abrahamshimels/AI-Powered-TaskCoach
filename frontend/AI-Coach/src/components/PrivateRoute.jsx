// src/components/PrivateRoute.jsx
import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    // Not logged in → redirect to home or login page
    return <Navigate to="/login" />;
  }

  // Logged in → render the child component
  return children;
};

export default PrivateRoute;
