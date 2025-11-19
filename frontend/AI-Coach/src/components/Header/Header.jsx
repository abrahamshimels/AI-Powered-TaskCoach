import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";

export default function Header() {
  return (
    <header className="app-header">
      <div className="logo">
        <Link to="/">AI Coach</Link>
      </div>
      <nav className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
      </nav>
    </header>
  );
}
