import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  getTaskById,
  updateTaskById,
  deleteTaskById,
} from "../../../services/TaskService";
import "./TaskDetails.css";

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM for input[type=datetime-local]
};

const displayDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const calculateProgress = (dueDate, createdAt) => {
  const now = new Date();
  const start = new Date(createdAt);
  const end = new Date(dueDate);

  if (!dueDate) return 0;

  const total = end - start;
  const elapsed = now - start;

  const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));
  return Math.round(percent);
};

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const progress = task ? calculateProgress(task.due_date, task.created_at) : 0;

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await getTaskById(id);
        setTask(data);
      } catch (err) {
        setError("Failed to load task.");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  const handleFieldUpdate = async (field, value) => {
    setUpdating(true);
    try {
      const updated = await updateTaskById(id, { [field]: value });
      setTask(updated);
    } catch (err) {
      alert("Failed to update " + field);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTaskById(id);
      navigate(-1);
    } catch (err) {
      alert("Delete failed");
    }
  };

  if (loading) return <div className="task-details-loading">Loading...</div>;
  if (error) return <div className="task-details-error">{error}</div>;
  if (!task) return <div className="task-details-empty">Task not found</div>;

  return (
    <motion.div
      className="task-details-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <motion.div
        className="task-details-card"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="task-details-title">{task.title}</h2>
        <p className="task-details-desc">{task.description}</p>

        {/* PROGRESS BAR */}
        {task.due_date && (
          <div className="progress-container">
            <p className="progress-label">
              Progress toward due date: <strong>{progress}%</strong>
            </p>
            <div className="progress-bar">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
        )}

        <div className="task-details-info">
          <p>
            <strong>Status:</strong>
            <select
              className="status-dropdown"
              value={task.status}
              onChange={(e) => handleFieldUpdate("status", e.target.value)}
              disabled={updating}
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In-progress</option>
              <option value="completed">Completed</option>
            </select>
          </p>

          <p>
            <strong>Priority:</strong>
            <select
              className="status-dropdown"
              value={task.priority}
              onChange={(e) => handleFieldUpdate("priority", e.target.value)}
              disabled={updating}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </p>

          <p>
            <strong>Due Date:</strong>
            <input
              type="datetime-local"
              value={formatDate(task.due_date)}
              onChange={(e) => handleFieldUpdate("due_date", e.target.value)}
              disabled={updating}
            />
          </p>

          <p>
            <strong>Created At:</strong> {displayDate(task.created_at)}
          </p>

          <p>
            <strong>Updated At:</strong> {displayDate(task.updated_at)}
          </p>

          <p>
            <strong>Created By AI:</strong>{" "}
            {task.created_by_ai ? "Yes 🤖" : "No"}
          </p>
        </div>

        {/* DELETE BUTTON */}
        <button className="delete-btn" onClick={handleDelete}>
          Delete Task
        </button>
      </motion.div>
    </motion.div>
  );
};

export default TaskDetails;
