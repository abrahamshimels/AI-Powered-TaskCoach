import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask, TASKS_QUERY_KEY } from "../../../services/TaskService";
import "./CreateTask.css";

const CreateTask = ({ onTaskCreated }) => {
  const queryClient = useQueryClient();
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "low",
    status: "pending",
    due_date: "",
  });
  const [error, setError] = useState("");

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      setTaskData({
        title: "",
        description: "",
        priority: "low",
        status: "pending",
        due_date: "",
      });
      if (onTaskCreated) onTaskCreated();
    },
    onError: (mutationError) => {
      setError(mutationError?.message || "Failed to create task");
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    createTaskMutation.mutate(taskData);
  };

  const isSubmitting = createTaskMutation.isPending;

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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
            required
          />
        </label>

        <label>
          Priority
          <select
            name="priority"
            value={taskData.priority}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label>
          Status
          <select
            name="status"
            value={taskData.status}
            onChange={handleChange}
            disabled={isSubmitting}
          >
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
            disabled={isSubmitting}
          />
        </label>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="btn-loading-wrap">
              <span className="btn-spinner" /> Creating...
            </span>
          ) : (
            "Create Task"
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateTask;
