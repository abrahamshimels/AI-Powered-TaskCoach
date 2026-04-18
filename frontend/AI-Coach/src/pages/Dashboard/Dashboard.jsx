import React, { useState } from "react";
import "./Dashboard.css";
import Tasks from "../../components/tasks/tasks-list/Tasks.jsx";
import CreateTask from "../../components/tasks/add-task/CreateTask.jsx";
import ChatBox from "../../components/Chatbox/Chatbox.jsx";

export default function Dashboard() {
  const [showCreate, setShowCreate] = useState(false);
  const [taskDisplayMode, setTaskDisplayMode] = useState("normal");

  const handleTaskDisplayMode = (mode) => {
    setTaskDisplayMode((prevMode) => (prevMode === mode ? "normal" : mode));
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>AI Task Coach Dashboard</h1>
        <p>Manage your tasks and chat with your AI assistant</p>
      </header>

      <div className="dashboard-content">
        {/* Left Panel - Tasks */}
        <div
          className={`tasks-panel ${taskDisplayMode === "full" ? "task-full-screen" : taskDisplayMode === "half" ? "task-half-screen" : ""}`}
        >
          <div className="tasks-header">
            <div className="tasks-header-left">
              <h2>Your Tasks</h2>
              <div className="task-mode-controls">
                <button
                  className={`mode-btn ${taskDisplayMode === "half" ? "active" : ""}`}
                  onClick={() => handleTaskDisplayMode("half")}
                  title="Focus mode"
                >
                  ▤
                </button>
                <button
                  className={`mode-btn ${taskDisplayMode === "full" ? "active" : ""}`}
                  onClick={() => handleTaskDisplayMode("full")}
                  title="Full screen"
                >
                  ⛶
                </button>
                {taskDisplayMode !== "normal" && (
                  <button
                    className="mode-btn close-btn"
                    onClick={() => setTaskDisplayMode("normal")}
                    title="Exit focus"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
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
