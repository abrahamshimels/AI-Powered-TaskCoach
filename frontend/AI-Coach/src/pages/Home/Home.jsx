import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Home.css';
import ChatBox from '../../components/Chatbox/Chatbox';

export default function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>AI Task Coach</h1>
        <p>Your personal AI-powered task management assistant for enhanced productivity.</p>
        <div className="home-actions">
          <Link to="/login" className="btn btn-primary">Login</Link>
          <Link to="/signup" className="btn btn-secondary">Sign Up</Link>
        </div>
      </header>
      <main className="home-main">
        <section className="features">
          <h2>Features</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <h3>AI-Powered Tasks</h3>
              <p>Create and manage tasks with intelligent AI assistance.</p>
            </div>
            <div className="feature-card">
              <h3>Smart Prioritization</h3>
              <p>Get AI recommendations to prioritize your tasks effectively.</p>
            </div>
            <div className="feature-card">
              <h3>Productivity Insights</h3>
              <p>Analyze your task patterns and improve your workflow.</p>
            </div>
          </div>
        </section>
        <ChatBox />
      </main>
    </div>
  );
}
