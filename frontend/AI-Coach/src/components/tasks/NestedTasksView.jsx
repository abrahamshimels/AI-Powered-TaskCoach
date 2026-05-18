import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NestedTaskTree from "../tasks/nested/NestedTaskTree";
import {
  getAllTasksNested,
  TASKS_NESTED_QUERY_KEY,
  createTask,
  updateTaskById,
  deleteTaskById,
} from "../../services/TaskService";
import "./NestedTasksView.css";

const NestedTasksView = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: TASKS_NESTED_QUERY_KEY,
    queryFn: getAllTasksNested,
    refetchInterval: 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_NESTED_QUERY_KEY });
      setTitle("");
      setDescription("");
      setIsCreating(false);
    },
    onError: (error) => {
      console.error("Error creating task:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTaskById(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_NESTED_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTaskById,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_NESTED_QUERY_KEY });
    },
  });

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || null,
      priority: "medium",
      status: "pending",
      progress: 0,
    });
  };

  const handleTaskUpdate = (taskId, updateData) => {
    updateMutation.mutate({ id: taskId, data: updateData });
  };

  const handleTaskDelete = (taskId) => {
    deleteMutation.mutate(taskId);
  };

  const handleTaskCreate = (taskData) => {
    createMutation.mutate(taskData);
  };

  const handleTaskToggle = (taskId) => {
    const findTask = (taskList) => {
      for (const task of taskList) {
        if (task.id === taskId) return task;
        if (task.children && task.children.length > 0) {
          const found = findTask(task.children);
          if (found) return found;
        }
      }
      return null;
    };

    const task = findTask(tasks);
    if (task) {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      handleTaskUpdate(taskId, { status: newStatus });
    }
  };

  return (
    <div className="nested-tasks-view">
      <div className="nested-tasks-header">
        <div>
          <h2 className="nested-tasks-title">Task Hierarchy</h2>
          <p className="nested-tasks-subtitle">
            Organize tasks with subtasks for better structure
          </p>
        </div>
      </div>

      {/* Create Task Form */}
      <div className="create-task-section">
        {!isCreating ? (
          <button
            className="btn-create-new"
            onClick={() => setIsCreating(true)}
          >
            ➕ Create New Task
          </button>
        ) : (
          <form className="create-task-form" onSubmit={handleCreateTask}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className="form-input"
              autoFocus
              disabled={createMutation.isPending}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description (optional)"
              className="form-input form-textarea"
              rows="3"
              disabled={createMutation.isPending}
            />
            <div className="form-actions">
              <button
                type="submit"
                className="btn-submit"
                disabled={!title.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Task"}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setIsCreating(false);
                  setTitle("");
                  setDescription("");
                }}
                disabled={createMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Tasks Tree */}
      <div className="tasks-tree-section">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading tasks...</p>
          </div>
        ) : isError ? (
          <div className="error-state">
            <p className="error-title">Failed to load tasks</p>
            <p className="error-message">
              {error?.message || "An error occurred while loading tasks"}
            </p>
          </div>
        ) : (
          <NestedTaskTree
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onTaskCreate={handleTaskCreate}
            onTaskToggle={handleTaskToggle}
          />
        )}
      </div>
    </div>
  );
};

export default NestedTasksView;
