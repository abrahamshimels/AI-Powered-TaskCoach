import React, { useState } from "react";
import "./AddSubtaskForm.css";

const AddSubtaskForm = ({ parentId, onAddSubtask, onCancel, depth }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddSubtask(parentId, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status: "pending",
        progress: 0,
      });
      setTitle("");
      setDescription("");
      setPriority("medium");
    } catch (error) {
      console.error("Error adding subtask:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="add-subtask-form"
      style={{ "--depth": depth }}
      onSubmit={handleSubmit}
    >
      <div className="form-group">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Subtask title..."
          className="form-input"
          disabled={isSubmitting}
          autoFocus
        />
      </div>

      <div className="form-row">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="form-input form-textarea"
          rows="2"
          disabled={isSubmitting}
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="form-input form-select"
          disabled={isSubmitting}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn-submit"
          disabled={!title.trim() || isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add Subtask"}
        </button>
        <button
          type="button"
          className="btn-cancel"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddSubtaskForm;
