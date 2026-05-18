import React, { useState } from "react";
import "./TaskTreeNode.css";

const TaskTreeNode = ({
  task,
  depth = 0,
  isExpanded,
  hasChildren,
  onToggleExpand,
  onTaskUpdate,
  onTaskDelete,
  onTaskToggle,
  onAddSubtask,
  isEditing,
  onEditStart,
  onEditEnd,
}) => {
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || "");

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onTaskUpdate(task.id, {
        title: editTitle,
        description: editDescription,
      });
      onEditEnd();
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "#10b981",
      medium: "#f59e0b",
      high: "#ef4444",
    };
    return colors[priority] || "#6b7280";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: "⏳",
      "in-progress": "⚡",
      completed: "✅",
    };
    return icons[status] || "📌";
  };

  const getProgressColor = (progress) => {
    if (progress < 33) return "#ef4444";
    if (progress < 66) return "#f59e0b";
    return "#10b981";
  };

  return (
    <div className="task-tree-node" style={{ "--depth": depth }}>
      <div className="node-header">
        <div className="node-content">
          {hasChildren && (
            <button
              className={`expand-btn ${isExpanded ? "expanded" : ""}`}
              onClick={() => onToggleExpand(task.id)}
              aria-label="Toggle subtasks"
            >
              ▶
            </button>
          )}
          {!hasChildren && <div className="expand-spacer" />}

          <div
            className="status-icon"
            title={task.status}
            onClick={() => onTaskToggle(task.id)}
          >
            {getStatusIcon(task.status)}
          </div>

          {!isEditing ? (
            <div className="task-info-display" onDoubleClick={onEditStart}>
              <h4 className={`task-title ${task.status}`}>
                {task.title}
              </h4>
              {task.description && (
                <p className="task-description">{task.description}</p>
              )}
              <div className="task-meta">
                <span
                  className="priority-badge"
                  style={{ "--color": getPriorityColor(task.priority) }}
                >
                  {task.priority}
                </span>
                <div className="progress-container">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${task.progress}%`,
                      backgroundColor: getProgressColor(task.progress),
                    }}
                  />
                  <span className="progress-text">{task.progress}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="task-edit-form">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="edit-input edit-title"
                placeholder="Task title"
                autoFocus
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="edit-input edit-description"
                placeholder="Task description (optional)"
                rows="2"
              />
              <div className="edit-actions">
                <button
                  className="btn-save"
                  onClick={handleSaveEdit}
                >
                  Save
                </button>
                <button
                  className="btn-cancel"
                  onClick={onEditEnd}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="node-actions">
          {!isEditing && (
            <>
              <button
                className="action-btn edit-btn"
                onClick={onEditStart}
                title="Edit task"
              >
                ✎
              </button>
              <button
                className="action-btn add-btn"
                onClick={onAddSubtask}
                title="Add subtask"
              >
                ➕
              </button>
              <button
                className="action-btn delete-btn"
                onClick={() => {
                  if (window.confirm("Delete this task and its subtasks?")) {
                    onTaskDelete(task.id);
                  }
                }}
                title="Delete task"
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskTreeNode;
