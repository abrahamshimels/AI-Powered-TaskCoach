// pages/Signup.jsx
import React, { useState, useContext } from "react";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";

const passwordRules = [
  { label: "At least 6 characters", test: (password) => password.length >= 6 },
  { label: "One uppercase letter", test: (password) => /[A-Z]/.test(password) },
  { label: "One lowercase letter", test: (password) => /[a-z]/.test(password) },
  { label: "One number", test: (password) => /\d/.test(password) },
  {
    label: "One special character",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

const isPasswordValid = (password) =>
  passwordRules.every((rule) => rule.test(password));

const Signup = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid(form.password)) {
      setError("Password must meet all strength requirements.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/register", form);
      login(response.data.user, response.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Join AI Task Coach</h2>
        <p>Start your journey to enhanced productivity</p>
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <ul className="password-rules" aria-label="Password requirements">
              {passwordRules.map((rule) => {
                const passed = rule.test(form.password);

                return (
                  <li
                    key={rule.label}
                    className={passed ? "valid" : ""}
                    aria-live="polite"
                  >
                    {passed ? "[OK]" : "[ ]"} {rule.label}
                  </li>
                );
              })}
            </ul>
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
        <p className="login-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
