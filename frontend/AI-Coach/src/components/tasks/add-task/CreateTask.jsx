import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTask } from "../../../services/TaskService"; // Adjust import path
import "./CreateTask.css";

const CreateTask = () => {
  const navigate = useNavigate();
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "low",
    status: "pending",
    due_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createTask(taskData);
      navigate("/dashboard"); // Redirect after successful creation
    } catch (err) {
      setError(err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-task-container">
      <h2>Create New Task</h2>
      <form className="create-task-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input
            type="text"
            name="title"
            value={taskData.title}
            onChange={handleChange}
            placeholder="Task title"
            required
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={taskData.description}
            onChange={handleChange}
            placeholder="Task description"
            rows={4}
            required
          />
        </label>

        <label>
          Priority
          <select
            name="priority"
            value={taskData.priority}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label>
          Status
          <select name="status" value={taskData.status} onChange={handleChange}>
            <option value="pending">Pending</option>
            <option value="in-progress">In-progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>

        <label>
          Due Date
          <input
            type="date"
            name="due_date"
            value={taskData.due_date}
            onChange={handleChange}
          />
        </label>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Task"}
        </button>
      </form>
    </div>
  );
};

export default CreateTask;
