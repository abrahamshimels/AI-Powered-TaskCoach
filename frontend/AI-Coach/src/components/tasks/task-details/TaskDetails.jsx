import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  getTaskById,
  updateTaskById,
  deleteTaskById,
  TASKS_QUERY_KEY,
} from "../../../services/TaskService";
import "./TaskDetails.css";

const DEFAULT_DUE_TIME = {
  date: "",
  hour: "12",
  minute: "00",
  period: "AM",
};

const minuteOptions = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0")
);

const MotionDiv = motion.div;

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

const formatDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toTwentyFourHour = (hour, period) => {
  const numericHour = Number(hour);
  if (period === "AM") return numericHour === 12 ? 0 : numericHour;
  return numericHour === 12 ? 12 : numericHour + 12;
};

const toTwelveHourParts = (hour24) => {
  if (hour24 === 0) return { hour: "12", period: "AM" };
  if (hour24 === 12) return { hour: "12", period: "PM" };
  if (hour24 > 12) {
    return { hour: String(hour24 - 12).padStart(2, "0"), period: "PM" };
  }
  return { hour: String(hour24).padStart(2, "0"), period: "AM" };
};

const parseDueDateParts = (dateString) => {
  if (!dateString) return DEFAULT_DUE_TIME;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return DEFAULT_DUE_TIME;

  const { hour, period } = toTwelveHourParts(date.getHours());

  return {
    date: formatDateInputValue(date),
    hour,
    minute: String(date.getMinutes()).padStart(2, "0"),
    period,
  };
};

const buildDueDate = ({ date, hour, minute, period }) => {
  if (!date) return null;

  const hour24 = String(toTwentyFourHour(hour, period)).padStart(2, "0");
  return `${date} ${hour24}:${minute}:00`;
};

const normalizeProgress = (value) => {
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return 0;
  return Math.min(100, Math.max(0, Math.round(numberValue)));
};

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [task, setTask] = useState(null);
  const [editData, setEditData] = useState({
    status: "pending",
    priority: "low",
    progress: 0,
    dueTime: DEFAULT_DUE_TIME,
  });
  const [dirtyFields, setDirtyFields] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");

  const hasChanges = dirtyFields.size > 0;

  const resetEditState = (taskData) => {
    setEditData({
      status: taskData.status || "pending",
      priority: taskData.priority || "low",
      progress: normalizeProgress(taskData.progress),
      dueTime: parseDueDateParts(taskData.due_date),
    });
    setDirtyFields(new Set());
  };

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await getTaskById(id);
        setTask(data);
        resetEditState(data);
      } catch {
        setError("Failed to load task.");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  const markFieldDirty = (field) => {
    setDirtyFields((prev) => {
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
    markFieldDirty(name);
    setUpdateMessage("");
  };

  const handleDueTimeChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      dueTime: { ...prev.dueTime, [name]: value },
    }));
    markFieldDirty("due_date");
    setUpdateMessage("");
  };

  const handleProgressChange = (e) => {
    setEditData((prev) => ({
      ...prev,
      progress: normalizeProgress(e.target.value),
    }));
    markFieldDirty("progress");
    setUpdateMessage("");
  };

  const buildUpdatePayload = () => {
    const payload = {};

    if (dirtyFields.has("status") && editData.status !== task.status) {
      payload.status = editData.status;
    }

    if (dirtyFields.has("priority") && editData.priority !== task.priority) {
      payload.priority = editData.priority;
    }

    if (
      dirtyFields.has("progress") &&
      editData.progress !== normalizeProgress(task.progress)
    ) {
      payload.progress = editData.progress;
    }

    if (dirtyFields.has("due_date")) {
      const nextDueDate = buildDueDate(editData.dueTime);
      const currentDueDate = buildDueDate(parseDueDateParts(task.due_date));

      if (nextDueDate !== currentDueDate) {
        payload.due_date = nextDueDate;
      }
    }

    return payload;
  };

  const handleUpdate = async () => {
    const payload = buildUpdatePayload();

    if (Object.keys(payload).length === 0) {
      setDirtyFields(new Set());
      setUpdateMessage("No changes to update.");
      return;
    }

    setUpdating(true);
    setUpdateMessage("");
    try {
      await updateTaskById(id, payload);
      const updatedTask = await getTaskById(id);
      setTask(updatedTask);
      resetEditState(updatedTask);
      await queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      setUpdateMessage("Task updated successfully.");
    } catch {
      setUpdateMessage("Failed to update task.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTaskById(id);
      await queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      navigate(-1);
    } catch {
      alert("Delete failed");
    }
  };

  if (loading) return <div className="task-details-loading">Loading...</div>;
  if (error) return <div className="task-details-error">{error}</div>;
  if (!task) return <div className="task-details-empty">Task not found</div>;

  return (
    <MotionDiv
      className="task-details-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <MotionDiv
        className="task-details-card"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="task-details-title">{task.title}</h2>
        <p className="task-details-desc">{task.description}</p>

        {/* PROGRESS BAR */}
        <div className="progress-container">
          <div className="progress-label-row">
            <p className="progress-label">
              Task progress: <strong>{editData.progress}%</strong>
            </p>
            {dirtyFields.has("progress") && (
              <span className="progress-unsaved">Unsaved</span>
            )}
          </div>
          <div className="progress-slider-wrap">
            <div className="progress-bar" aria-hidden="true">
              <motion.div
                className="progress-fill"
                initial={false}
                animate={{ width: `${editData.progress}%` }}
                transition={{ type: "spring", stiffness: 220, damping: 28 }}
              />
            </div>
            <input
              className="progress-slider"
              type="range"
              min="0"
              max="100"
              step="1"
              value={editData.progress}
              onChange={handleProgressChange}
              disabled={updating}
              aria-label="Task progress percentage"
            />
          </div>
        </div>

        <div className="task-details-info">
          <p>
            <strong>Status:</strong>
            <select
              className="status-dropdown"
              name="status"
              value={editData.status}
              onChange={handleEditChange}
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
              name="priority"
              value={editData.priority}
              onChange={handleEditChange}
              disabled={updating}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </p>

          <div className="task-details-due-edit">
            <strong>Due Date & Time:</strong>
            <div className="task-details-due-grid">
              <label>
                Date
                <input
                  type="date"
                  name="date"
                  value={editData.dueTime.date}
                  onChange={handleDueTimeChange}
                  disabled={updating}
                />
              </label>

              <label>
                Hour
                <select
                  name="hour"
                  value={editData.dueTime.hour}
                  onChange={handleDueTimeChange}
                  disabled={updating}
                >
                  {Array.from({ length: 12 }, (_, index) => {
                    const hour = String(index + 1).padStart(2, "0");
                    return (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label>
                Minute
                <select
                  name="minute"
                  value={editData.dueTime.minute}
                  onChange={handleDueTimeChange}
                  disabled={updating}
                >
                  {minuteOptions.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                AM/PM
                <select
                  name="period"
                  value={editData.dueTime.period}
                  onChange={handleDueTimeChange}
                  disabled={updating}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </label>
            </div>
          </div>

          <p>
            <strong>Created At:</strong> {displayDate(task.created_at)}
          </p>

          <p>
            <strong>Updated At:</strong> {displayDate(task.updated_at)}
          </p>

          <p>
            <strong>Created By AI:</strong>{" "}
            {task.created_by_ai ? "Yes" : "No"}
          </p>
        </div>

        {updateMessage && (
          <p className="task-details-update-message">{updateMessage}</p>
        )}

        <button
          className="update-btn"
          type="button"
          onClick={handleUpdate}
          disabled={updating || !hasChanges}
        >
          {updating ? "Updating..." : "Update Task"}
        </button>

        {/* DELETE BUTTON */}
        <button className="delete-btn" onClick={handleDelete}>
          Delete Task
        </button>
      </MotionDiv>
    </MotionDiv>
  );
};

export default TaskDetails;
