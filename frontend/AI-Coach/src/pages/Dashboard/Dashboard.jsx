import React, { useState } from "react";
import "./Dashboard.css";
import Tasks from "../../components/tasks/tasks-list/Tasks.jsx";
import CreateTask from "../../components/tasks/add-task/CreateTask.jsx";
import ChatBox from "../../components/Chatbox/Chatbox.jsx";

export default function Dashboard() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>AI Task Coach Dashboard</h1>
        <p>Manage your tasks and chat with your AI assistant</p>
      </header>

      <div className="dashboard-content">
        {/* Left Panel - Tasks */}
        <div className="tasks-panel">
          <div className="tasks-header">
            <h2>Your Tasks</h2>
            <button
              className="btn-create-task"
              onClick={() => setShowCreate(!showCreate)}
              title="Create new task"
            >
              {showCreate ? "✕" : "+"}
            </button>
          </div>

          {/* Conditionally render CreateTask */}
          {showCreate && (
            <div className="create-task-section">
              <CreateTask />
            </div>
          )}

          <div className="tasks-list-section">
            <Tasks />
          </div>
        </div>

        {/* Right Panel - AI Chat */}
        <div className="chat-panel">
          <ChatBox />
        </div>
      </div>
    </div>
  );
}
