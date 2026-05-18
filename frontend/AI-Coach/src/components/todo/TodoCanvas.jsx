import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./TodoCanvas.css";

const TODO_STORAGE_KEY = "quick-todo-items";
const TODO_CANVAS_EXPANDED_KEY = "quick-todo-canvas-expanded";

const getInitialTodos = () => {
  if (typeof window === "undefined") return [];

  try {
    const storedTodos = window.localStorage.getItem(TODO_STORAGE_KEY);
    return storedTodos ? JSON.parse(storedTodos) : [];
  } catch {
    return [];
  }
};

const createTodoId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const TodoItem = ({
  todo,
  depth = 0,
  onToggle,
  onAddSubtodo,
  onDeleteTodo,
  onUpdateText,
  expandedTodos,
  onToggleExpand,
}) => {
  const [isAddingSubtodo, setIsAddingSubtodo] = useState(false);
  const [subtodoText, setSubtodoText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const isExpanded = expandedTodos.has(todo.id);
  const hasSubtodos = todo.subtodos && todo.subtodos.length > 0;

  const handleAddSubtodo = (e) => {
    e.preventDefault();
    if (subtodoText.trim()) {
      onAddSubtodo(todo.id, subtodoText);
      setSubtodoText("");
      setIsAddingSubtodo(false);
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onUpdateText(todo.id, editText);
      setIsEditing(false);
    }
  };

  return (
    <div className="todo-item-container" style={{ "--depth": depth }}>
      <div className="todo-item">
        <div className="todo-item-main">
          {hasSubtodos && (
            <button
              className={`expand-toggle ${isExpanded ? "expanded" : ""}`}
              onClick={() => onToggleExpand(todo.id)}
              aria-label="Toggle subtodos"
            >
              ▶
            </button>
          )}
          {!hasSubtodos && <div className="expand-spacer" />}

          <label className="todo-item-label">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => onToggle(todo.id)}
              aria-label={`Mark ${todo.text} as ${todo.completed ? "incomplete" : "complete"}`}
            />
            {!isEditing ? (
              <span
                className={`todo-text ${todo.completed ? "completed" : ""}`}
                onDoubleClick={() => {
                  setIsEditing(true);
                  setEditText(todo.text);
                }}
              >
                {todo.text}
              </span>
            ) : (
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                autoFocus
                className="todo-edit-input"
              />
            )}
          </label>
        </div>

        <div className="todo-item-actions">
          <button
            className="action-btn add-subtodo-btn"
            onClick={() => setIsAddingSubtodo(true)}
            title="Add subtodo"
            aria-label="Add subtodo"
          >
            ➕
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => {
              if (window.confirm("Delete this todo and its subtodos?")) {
                onDeleteTodo(todo.id);
              }
            }}
            title="Delete todo"
            aria-label="Delete todo"
          >
            ✕
          </button>
        </div>
      </div>

      {isAddingSubtodo && (
        <form className="add-subtodo-form" onSubmit={handleAddSubtodo}>
          <input
            type="text"
            value={subtodoText}
            onChange={(e) => setSubtodoText(e.target.value)}
            placeholder="Add a subtodo..."
            autoFocus
          />
          <div className="subtodo-form-actions">
            <button type="submit" disabled={!subtodoText.trim()}>
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingSubtodo(false);
                setSubtodoText("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isExpanded && hasSubtodos && (
        <div className="subtodos-container">
          {todo.subtodos.map((subtodo) => (
            <TodoItem
              key={subtodo.id}
              todo={subtodo}
              depth={depth + 1}
              onToggle={onToggle}
              onAddSubtodo={onAddSubtodo}
              onDeleteTodo={onDeleteTodo}
              onUpdateText={onUpdateText}
              expandedTodos={expandedTodos}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TodoCanvas = () => {
  const [todos, setTodos] = useState(getInitialTodos);
  const [text, setText] = useState("");
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === "undefined") return true;
    const storedValue = window.localStorage.getItem(TODO_CANVAS_EXPANDED_KEY);
    return storedValue ? storedValue === "true" : true;
  });
  const [expandedTodos, setExpandedTodos] = useState(new Set());

  useEffect(() => {
    window.localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    window.localStorage.setItem(TODO_CANVAS_EXPANDED_KEY, String(isExpanded));
  }, [isExpanded]);

  const stats = useMemo(() => {
    const countTodos = (todoList) => {
      let total = 0;
      let completed = 0;
      todoList.forEach((todo) => {
        total += 1;
        if (todo.completed) completed += 1;
        if (todo.subtodos && todo.subtodos.length > 0) {
          const subStats = countTodos(todo.subtodos);
          total += subStats.total;
          completed += subStats.completed;
        }
      });
      return { total, completed };
    };

    const { total, completed } = countTodos(todos);
    return { total, completed, remaining: total - completed };
  }, [todos]);

  const handleAddTodo = (event) => {
    event.preventDefault();
    const nextText = text.trim();
    if (!nextText) return;

    setTodos((currentTodos) => [
      {
        id: createTodoId(),
        text: nextText,
        completed: false,
        subtodos: [],
        createdAt: new Date().toISOString(),
      },
      ...currentTodos,
    ]);
    setText("");
  };

  const toggleTodo = useCallback((todoId, todoList = todos) => {
    return todoList.map((todo) => {
      if (todo.id === todoId) {
        return { ...todo, completed: !todo.completed };
      }
      if (todo.subtodos && todo.subtodos.length > 0) {
        return { ...todo, subtodos: toggleTodo(todoId, todo.subtodos) };
      }
      return todo;
    });
  }, [todos]);

  const addSubtodo = useCallback((parentId, subtodoText, todoList = todos) => {
    return todoList.map((todo) => {
      if (todo.id === parentId) {
        return {
          ...todo,
          subtodos: [
            ...(todo.subtodos || []),
            {
              id: createTodoId(),
              text: subtodoText,
              completed: false,
              subtodos: [],
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }
      if (todo.subtodos && todo.subtodos.length > 0) {
        return { ...todo, subtodos: addSubtodo(parentId, subtodoText, todo.subtodos) };
      }
      return todo;
    });
  }, [todos]);

  const deleteTodo = useCallback((todoId, todoList = todos) => {
    return todoList.reduce((acc, todo) => {
      if (todo.id === todoId) {
        return acc;
      }
      if (todo.subtodos && todo.subtodos.length > 0) {
        return [...acc, { ...todo, subtodos: deleteTodo(todoId, todo.subtodos) }];
      }
      return [...acc, todo];
    }, []);
  }, [todos]);

  const updateText = useCallback((todoId, newText, todoList = todos) => {
    return todoList.map((todo) => {
      if (todo.id === todoId) {
        return { ...todo, text: newText };
      }
      if (todo.subtodos && todo.subtodos.length > 0) {
        return { ...todo, subtodos: updateText(todoId, newText, todo.subtodos) };
      }
      return todo;
    });
  }, [todos]);

  const handleToggleTodo = (todoId) => {
    setTodos(toggleTodo(todoId));
  };

  const handleAddSubtodo = (parentId, subtodoText) => {
    setTodos(addSubtodo(parentId, subtodoText));
  };

  const handleDeleteTodo = (todoId) => {
    setTodos(deleteTodo(todoId));
  };

  const handleUpdateText = (todoId, newText) => {
    setTodos(updateText(todoId, newText));
  };

  const handleToggleExpand = (todoId) => {
    setExpandedTodos((prev) => {
      const next = new Set(prev);
      if (next.has(todoId)) {
        next.delete(todoId);
      } else {
        next.add(todoId);
      }
      return next;
    });
  };

  const clearCompleted = () => {
    const removeCompleted = (todoList) => {
      return todoList
        .filter((todo) => !todo.completed)
        .map((todo) => ({
          ...todo,
          subtodos: todo.subtodos ? removeCompleted(todo.subtodos) : [],
        }));
    };
    setTodos(removeCompleted(todos));
  };

  const clearAll = () => {
    setTodos([]);
    setExpandedTodos(new Set());
  };

  return (
    <section className="todo-canvas" aria-labelledby="todo-canvas-title">
      <div className="todo-canvas-header">
        <div>
          <p className="todo-canvas-kicker">Quick Canvas</p>
          <h2 id="todo-canvas-title">Todo</h2>
        </div>
        <div className="todo-canvas-header-actions">
          <div className="todo-canvas-stats" aria-label="Todo summary">
            <span>{stats.remaining} open</span>
            <span>{stats.completed} done</span>
          </div>
          <button
            type="button"
            className="todo-canvas-toggle"
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={isExpanded}
            aria-controls="todo-canvas-body"
          >
            {isExpanded ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div id="todo-canvas-body" className="todo-canvas-body">
          <form className="todo-canvas-form" onSubmit={handleAddTodo}>
            <input
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Add a quick todo..."
              aria-label="Add a quick todo"
            />
            <button type="submit" disabled={!text.trim()}>
              Add
            </button>
          </form>

          <div className="todo-canvas-actions">
            <button
              type="button"
              className="todo-link-button"
              onClick={clearCompleted}
              disabled={stats.completed === 0}
            >
              Clear completed
            </button>
            <button
              type="button"
              className="todo-link-button danger"
              onClick={clearAll}
              disabled={stats.total === 0}
            >
              Clear all
            </button>
          </div>

          <ul className="todo-canvas-list">
            {todos.length === 0 ? (
              <li className="todo-canvas-empty">
                No quick todos yet. Add one above to start.
              </li>
            ) : (
              todos.map((todo) => (
                <li key={todo.id}>
                  <TodoItem
                    todo={todo}
                    depth={0}
                    onToggle={handleToggleTodo}
                    onAddSubtodo={handleAddSubtodo}
                    onDeleteTodo={handleDeleteTodo}
                    onUpdateText={handleUpdateText}
                    expandedTodos={expandedTodos}
                    onToggleExpand={handleToggleExpand}
                  />
                </li>
              ))
            )}
          </ul>
        </div>
      ) : (
        <div className="todo-canvas-collapsed" id="todo-canvas-body">
          <p>Canvas hidden. Keep a light todo hub ready when you need it.</p>
          <button
            type="button"
            className="todo-canvas-toggle primary"
            onClick={() => setIsExpanded(true)}
          >
            Show canvas
          </button>
        </div>
      )}
    </section>
  );
};

export default TodoCanvas;