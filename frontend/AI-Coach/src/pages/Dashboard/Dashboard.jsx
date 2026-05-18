import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import "./Dashboard.css";
import Tasks from "../../components/tasks/tasks-list/Tasks.jsx";
import CreateTask from "../../components/tasks/add-task/CreateTask.jsx";
import TodoCanvas from "../../components/todo/TodoCanvas.jsx";
import ChatBox from "../../components/Chatbox/Chatbox.jsx";
import { getAllTasks, TASKS_QUERY_KEY } from "../../services/TaskService";

const isCompletedTask = (task) =>
  task?.status === "completed" || Number(task?.progress) >= 100;

export default function Dashboard() {
  const [showCreate, setShowCreate] = useState(false);
  const [taskDisplayMode, setTaskDisplayMode] = useState("normal");
  const [activeChatTask, setActiveChatTask] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const {
    data: tasks = [],
    refetch: refetchTasks,
    isFetching: isRefreshingTasks,
  } = useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: getAllTasks,
    refetchInterval: 60 * 1000,
  });

  const completionStats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(isCompletedTask).length;
    const completionRate = totalTasks
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    return {
      totalTasks,
      completedTasks,
      completionRate,
    };
  }, [tasks]);

  useEffect(() => {
    setLastSyncedAt(new Date());
  }, [tasks]);

  const lastSyncedLabel = lastSyncedAt
    ? `Last synced ${lastSyncedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "Syncing tasks...";

  const handleTaskDisplayMode = (mode) => {
    setTaskDisplayMode((prevMode) => (prevMode === mode ? "normal" : mode));
  };

  const handleTaskDragStart = (task, event) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/json", JSON.stringify(task));
    event.dataTransfer.setData("text/plain", task.title || "Task");
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>AI Task Coach Dashboard</h1>
        <p>Manage your tasks and chat with your AI assistant</p>
        <div className="dashboard-progress-card" aria-label="Task completion summary">
          <div className="dashboard-progress-copy">
            <span className="dashboard-progress-label">Completion</span>
            <strong className="dashboard-progress-value">
              {completionStats.completionRate}%
            </strong>
            <span className="dashboard-progress-meta">
              {completionStats.completedTasks} of {completionStats.totalTasks} tasks completed
            </span>
          </div>
          <div className="dashboard-progress-track" aria-hidden="true">
            <div
              className="dashboard-progress-fill"
              style={{ width: `${completionStats.completionRate}%` }}
            />
          </div>
          <div className="dashboard-meta-row">
            <span className="dashboard-task-count">
              {completionStats.totalTasks} total tasks
            </span>
            <span className="dashboard-sync-status">{lastSyncedLabel}</span>
          </div>
        </div>
      </header>

      <section className="dashboard-quick-utility" aria-label="Quick todo canvas">
        <TodoCanvas />
      </section>

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
            <div className="tasks-header-actions">
              <button
                className={`btn-refresh-tasks ${isRefreshingTasks ? "spinning" : ""}`}
                onClick={() => refetchTasks()}
                title="Refresh tasks"
                aria-label="Refresh tasks"
                type="button"
              >
                ↻
              </button>
              <button
                className="btn-create-task"
                onClick={() => setShowCreate(!showCreate)}
                title="Create new task"
                type="button"
              >
                {showCreate ? "✕" : "+"}
              </button>
            </div>
          </div>

          {/* Conditionally render CreateTask */}
          {showCreate && (
            <div className="create-task-section">
              <CreateTask onTaskCreated={() => setShowCreate(false)} />
            </div>
          )}

          <div className="tasks-list-section">
            <Tasks onTaskDragStart={handleTaskDragStart} />
          </div>
        </div>

        {/* Right Panel - AI Chat */}
        <div className="chat-panel">
          <ChatBox
            selectedTask={activeChatTask}
            onClearSelectedTask={() => setActiveChatTask(null)}
            onTaskDrop={(task) => setActiveChatTask(task)}
          />
        </div>
      </div>
    </div>
  );
}
