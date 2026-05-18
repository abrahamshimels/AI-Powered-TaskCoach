import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask, TASKS_QUERY_KEY } from "../../../services/TaskService";
import "./CreateTask.css";

const DEFAULT_DUE_TIME = {
  date: "",
  hour: "12",
  minute: "00",
  period: "AM",
};

const minuteOptions = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0")
);

const toTwentyFourHour = (hour, period) => {
  const numericHour = Number(hour);
  if (period === "AM") return numericHour === 12 ? 0 : numericHour;
  return numericHour === 12 ? 12 : numericHour + 12;
};

const buildDueDate = ({ date, hour, minute, period }) => {
  if (!date) return null;

  const hour24 = String(toTwentyFourHour(hour, period)).padStart(2, "0");
  return `${date} ${hour24}:${minute}:00`;
};

const CreateTask = ({ onTaskCreated }) => {
  const queryClient = useQueryClient();
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "low",
    status: "pending",
  });
  const [dueTime, setDueTime] = useState(DEFAULT_DUE_TIME);
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
      });
      setDueTime(DEFAULT_DUE_TIME);
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

  const handleDueTimeChange = (e) => {
    const { name, value } = e.target;
    setDueTime((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    createTaskMutation.mutate({
      ...taskData,
      due_date: buildDueDate(dueTime),
    });
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

        <fieldset className="create-task-due-fieldset">
          <legend>Due Date & Time</legend>
          <div className="create-task-due-grid">
            <label>
              Date
              <input
                type="date"
                name="date"
                value={dueTime.date}
                onChange={handleDueTimeChange}
                disabled={isSubmitting}
              />
            </label>

            <label>
              Hour
              <select
                name="hour"
                value={dueTime.hour}
                onChange={handleDueTimeChange}
                disabled={isSubmitting}
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
                value={dueTime.minute}
                onChange={handleDueTimeChange}
                disabled={isSubmitting}
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
                value={dueTime.period}
                onChange={handleDueTimeChange}
                disabled={isSubmitting}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </label>
          </div>
        </fieldset>

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
