import React, { useState, useCallback } from "react";
import TaskTreeNode from "./TaskTreeNode";
import AddSubtaskForm from "./AddSubtaskForm";
import "./NestedTaskTree.css";

const NestedTaskTree = ({
  tasks = [],
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate,
  onTaskToggle,
}) => {
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [addingSubtaskFor, setAddingSubtaskFor] = useState(null);

  const toggleExpand = useCallback((taskId) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const handleAddSubtask = useCallback(
    (parentId, subtaskData) => {
      onTaskCreate({
        ...subtaskData,
        parent_id: parentId,
      });
      setAddingSubtaskFor(null);
    },
    [onTaskCreate]
  );

  const renderTaskNode = (task, depth = 0) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasChildren = task.children && task.children.length > 0;

    return (
      <div key={task.id} className="task-node">
        <TaskTreeNode
          task={task}
          depth={depth}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onToggleExpand={toggleExpand}
          onTaskUpdate={onTaskUpdate}
          onTaskDelete={onTaskDelete}
          onTaskToggle={onTaskToggle}
          onAddSubtask={() => setAddingSubtaskFor(task.id)}
          isEditing={editingTaskId === task.id}
          onEditStart={() => setEditingTaskId(task.id)}
          onEditEnd={() => setEditingTaskId(null)}
        />

        {addingSubtaskFor === task.id && (
          <AddSubtaskForm
            parentId={task.id}
            onAddSubtask={handleAddSubtask}
            onCancel={() => setAddingSubtaskFor(null)}
            depth={depth}
          />
        )}

        {isExpanded && hasChildren && (
          <div className="children-container">
            {task.children.map((child) => renderTaskNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="empty-tasks">
        <p>📝 No tasks yet. Create your first task!</p>
      </div>
    );
  }

  return (
    <div className="nested-task-tree">
      {tasks.map((task) => renderTaskNode(task))}
    </div>
  );
};

export default NestedTaskTree;
