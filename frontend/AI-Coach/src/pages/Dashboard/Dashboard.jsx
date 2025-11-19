import React, { useState } from "react";
import "./Dashboard.css";
import Tasks from "../../components/tasks/tasks-list/Tasks.jsx";
import CreateTask from "../../components/tasks/add-task/CreateTask.jsx";

export default function Dashboard() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>List of tasks will be displayed here.</p>

      <Tasks />

      <div className="dashboard-actions">
        <button
          className="btn-create-task"
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? "Hide Create Task" : "Create New Task"}
        </button>
      </div>

      {/* Conditionally render CreateTask */}
      {showCreate && <CreateTask />}
    </div>
  );
}
