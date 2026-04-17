import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./Header.css";

export default function Header() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="app-header">
      <div className="logo">
        <Link to="/">AI Coach</Link>
      </div>
      <nav className="nav-links">
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <button onClick={logout} className="logout-btn">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
