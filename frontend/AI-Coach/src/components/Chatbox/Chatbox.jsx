import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { AuthContext } from "../../context/AuthContext";
import { TASKS_QUERY_KEY } from "../../services/TaskService";
import {
  askAI,
  createTaskAI,
  updateTaskAI,
  deleteTaskAI,
  analyzeTasksAI,
} from "../../services/AIService";
import "./Chatbox.css";

const normalizeTaskProgress = (task) => {
  const progress = Number(task?.progress);
  if (Number.isNaN(progress)) return null;
  return Math.min(100, Math.max(0, Math.round(progress)));
};

const buildTaskContext = (task) => {
  if (!task) return "";

  const progress = normalizeTaskProgress(task);
  const dueDate = task.due_date
    ? new Date(task.due_date).toLocaleString()
    : "No deadline";

  return [
    `Active task: ${task.title || "Untitled task"}`,
    task.description ? `Description: ${task.description}` : null,
    `Status: ${task.status || "unknown"}`,
    `Progress: ${progress === null ? "Not set" : `${progress}%`}`,
    `Due date: ${dueDate}`,
  ]
    .filter(Boolean)
    .join("\n");
};

const AIChatWithActions = ({
  selectedTask = null,
  onClearSelectedTask,
  onTaskDrop,
}) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [action, setAction] = useState("analysis");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [displayMode, setDisplayMode] = useState("normal");
  const [chatPosition, setChatPosition] = useState({ x: 40, y: 60 });
  const [chatSize, setChatSize] = useState({ width: 680, height: 760 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const chatBoxRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeOriginRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 40, y: 60 });
  const sizeRef = useRef({ width: 680, height: 760 });
  const rafRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const handleDisplayMode = (mode) => {
    setDisplayMode((prevMode) => (prevMode === mode ? "normal" : mode));
  };

  const startDrag = (event) => {
    if (displayMode !== "custom" || event.button !== 0) return;
    event.preventDefault();
    setDragging(true);
    dragOffsetRef.current = {
      x: event.clientX - positionRef.current.x,
      y: event.clientY - positionRef.current.y,
    };
  };

  const startResize = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setResizing(true);
    resizeOriginRef.current = { x: event.clientX, y: event.clientY };
  };

  useEffect(() => {
    const updateFrame = () => {
      if (chatBoxRef.current && displayMode === "custom") {
        const { x, y } = positionRef.current;
        const { width, height } = sizeRef.current;
        chatBoxRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        chatBoxRef.current.style.width = `${width}px`;
        chatBoxRef.current.style.height = `${height}px`;
      }
      rafRef.current = null;
    };

    const scheduleUpdate = () => {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updateFrame);
      }
    };

    const handlePointerMove = (event) => {
      if (displayMode !== "custom") return;
      if (dragging) {
        const x = Math.max(16, event.clientX - dragOffsetRef.current.x);
        const y = Math.max(16, event.clientY - dragOffsetRef.current.y);
        positionRef.current = { x, y };
        setChatPosition({ x, y });
        scheduleUpdate();
      }

      if (resizing) {
        const width = Math.max(420, sizeRef.current.width + (event.clientX - resizeOriginRef.current.x));
        const height = Math.max(520, sizeRef.current.height + (event.clientY - resizeOriginRef.current.y));
        resizeOriginRef.current = { x: event.clientX, y: event.clientY };
        sizeRef.current = { width, height };
        setChatSize({ width, height });
        scheduleUpdate();
      }
    };

    const handlePointerUp = () => {
      if (dragging) setDragging(false);
      if (resizing) setResizing(false);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [displayMode, dragging, resizing]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (!user) {
      setMessages([
        {
          sender: "ai",
          text: "👋 Welcome to AI Task Coach! To start chatting and managing your tasks, please [login](/login) or [sign up](/signup).",
          isMarkdown: true,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } else if (messages.length === 0) {
      setMessages([
        {
          sender: "ai",
          text: "👋 Hello! I'm your AI Productivity Coach. How can I help you with your tasks today?",
          isMarkdown: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
  }, [user]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!user) {
      // Not authenticated, redirect to login
      navigate("/login");
      return;
    }

    const userMessage = {
      sender: "user",
      text: input,
      isMarkdown: false,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setIsTyping(true);

    const requestText = contextualInputPrefix
      ? `${contextualInputPrefix}\n\nUser request: ${input.trim()}`
      : input.trim();

    try {
      let res;
      switch (action) {
        case "ask":
          res = await askAI(requestText);
          break;
        case "add":
          res = await createTaskAI(requestText);
          break;
        case "update":
          res = await updateTaskAI(requestText);
          break;
        case "delete":
          res = await deleteTaskAI(requestText);
          break;
        case "analysis":
          res = await analyzeTasksAI(requestText);
          break;
        default:
          res = await askAI(requestText);
      }

      if (["add", "update", "delete"].includes(action)) {
        await queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      }

      const aiText =
        res.analysis ||
        res.reply ||
        res.message ||
        JSON.stringify(res, null, 2);

      // Simulate typing delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 800));

      const aiMessage = {
        sender: "ai",
        text: aiText,
        isMarkdown: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "❌ Error: " + err.message,
          isMarkdown: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getActionIcon = (actionType) => {
    const icons = {
      ask: "💬",
      add: "➕",
      update: "✏️",
      delete: "🗑️",
      analysis: "📊",
    };
    return icons[actionType] || "💬";
  };

  const getActionColor = (actionType) => {
    const colors = {
      ask: "#3B82F6",
      add: "#10B981",
      update: "#F59E0B",
      delete: "#EF4444",
      analysis: "#8B5CF6",
    };
    return colors[actionType] || "#3B82F6";
  };

  const quickActions = [
    { label: "Add task", action: "add", prompt: "Add a new task: " },
    {
      label: "Today's review",
      action: "analysis",
      prompt: "Analyze my current tasks and productivity: ",
    },
    {
      label: "Update progress",
      action: "update",
      prompt: "Update task progress: ",
    },
    {
      label: "Get suggestions",
      action: "ask",
      prompt: "Suggest ways to improve my productivity: ",
    },
  ];

  const handleQuickAction = (quickAction) => {
    setAction(quickAction.action);
    setInput(quickAction.prompt);
    inputRef.current?.focus();
  };

  const handleDragOver = (event) => {
    if (!onTaskDrop) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDropTarget(true);
  };

  const handleDragLeave = (event) => {
    if (!onTaskDrop) return;
    if (event.currentTarget === event.target) {
      setIsDropTarget(false);
    }
  };

  const handleDrop = (event) => {
    if (!onTaskDrop) return;
    event.preventDefault();
    setIsDropTarget(false);

    const rawTask = event.dataTransfer.getData("application/json");
    if (!rawTask) return;

    try {
      const task = JSON.parse(rawTask);
      onTaskDrop(task);
      setAction("ask");
      inputRef.current?.focus();
    } catch {
      // Ignore malformed task payloads.
    }
  };

  const contextualInputPrefix = selectedTask ? buildTaskContext(selectedTask) : "";

  const customStyle =
    displayMode === "custom"
      ? {
          left: 0,
          top: 0,
          transform: `translate3d(${chatPosition.x}px, ${chatPosition.y}px, 0)`,
          width: chatSize.width,
          height: chatSize.height,
        }
      : {};

  return (
    <div
      ref={chatBoxRef}
      className={`modern-chatbox ${displayMode === "full" ? "full-screen" : displayMode === "half" ? "half-screen" : displayMode === "custom" ? "custom-mode" : ""} ${isDropTarget ? "is-drop-target" : ""}`}
      style={customStyle}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* HEADER */}
      <div
        className="chatbox-header glassmorphism"
        onPointerDown={displayMode === "custom" ? startDrag : undefined}
      >
        <div className="header-content">
          <div className="ai-avatar">
            <div className="avatar-pulse"></div>
            <span>⚡</span>
          </div>
          <div className="header-text">
            <h2 className="title-gradient">AI Productivity Coach</h2>
            <p className="subtitle">
              Your intelligent task management assistant
            </p>
          </div>
        </div>
        <div className="header-actions">
          <div className="display-mode-controls">
            <button
              className={`mode-btn ${displayMode === "half" ? "active" : ""}`}
              onClick={() => handleDisplayMode("half")}
              title="Focus mode"
            >
              <span>▤</span>
            </button>
            <button
              className={`mode-btn ${displayMode === "full" ? "active" : ""}`}
              onClick={() => handleDisplayMode("full")}
              title="Full screen"
            >
              <span>⛶</span>
            </button>
            <button
              className={`mode-btn ${displayMode === "custom" ? "active" : ""}`}
              onClick={() => handleDisplayMode("custom")}
              title="Floating custom mode"
            >
              <span>⤢</span>
            </button>
            {displayMode !== "normal" && (
              <button
                className="mode-btn close-btn"
                onClick={() => setDisplayMode("normal")}
                title="Exit expanded mode"
              >
                ✕
              </button>
            )}
          </div>
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span>Online</span>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="quick-actions-container">
        {selectedTask && (
          <div className="task-context-card">
            <div className="task-context-copy">
              <span className="task-context-label">Focused task</span>
              <strong className="task-context-title">{selectedTask.title}</strong>
              <span className="task-context-meta">
                {selectedTask.status || "unknown"}
                {normalizeTaskProgress(selectedTask) !== null
                  ? ` · ${normalizeTaskProgress(selectedTask)}%`
                  : ""}
              </span>
            </div>
            <button
              type="button"
              className="task-context-clear"
              onClick={() => onClearSelectedTask?.()}
            >
              Clear
            </button>
          </div>
        )}
        <div className="quick-actions-scroll">
          {quickActions.map((qa, index) => (
            <button
              key={index}
              className="quick-action-btn"
              onClick={() => handleQuickAction(qa)}
              disabled={!user}
              style={{ "--action-color": getActionColor(qa.action) }}
            >
              <span className="quick-action-icon">
                {getActionIcon(qa.action)}
              </span>
              <span className="quick-action-label">{qa.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MESSAGES */}
      <div className="messages-container">
        {messages.length === 0 && user && (
          <div className={`welcome-message ${isDropTarget ? "drop-target" : ""}`}>
            <div className="welcome-icon">🎯</div>
            <h3>Welcome to Your AI Coach!</h3>
            <p>
              {selectedTask
                ? "A task is attached to this chat. Ask a question or request an update about it."
                : "Drag a task from the dashboard into this panel to focus the conversation."}
            </p>
            <div className="welcome-tips">
              <div className="tip">• Ask for task analysis</div>
              <div className="tip">• Add new tasks naturally</div>
              <div className="tip">• Get productivity insights</div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message-wrapper ${msg.sender}`}>
            <div className="message-avatar">
              {msg.sender === "ai" ? "🤖" : "👤"}
            </div>
            <div className="message-content-wrapper">
              <div className={`message-bubble ${msg.sender}`}>
                {msg.isMarkdown ? (
                  <ReactMarkdown
                    children={msg.text}
                    components={{
                      code({ inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  />
                ) : (
                  <div className="message-text">{msg.text}</div>
                )}
              </div>
              <div className="message-footer">
                <span className="message-time">{msg.timestamp}</span>
                <button
                  className="copy-btn modern-copy"
                  onClick={() => copyToClipboard(msg.text)}
                  title="Copy message"
                >
                  <span className="copy-icon">📄</span>
                  Copy
                </button>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message-wrapper ai typing-indicator">
            <div className="message-avatar">🤖</div>
            <div className="message-content-wrapper">
              <div className="message-bubble ai typing">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="typing-text">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ACTION SELECTOR */}
      <div className="action-selector glassmorphism">
        <div className="action-selector-label">
          <span className="selector-icon">🎯</span>
          Action Mode:
        </div>
        <div className="action-buttons">
          {["ask", "add", "update", "delete", "analysis"].map((opt) => (
            <button
              key={opt}
              className={`chat-action-btn ${action === opt ? "active" : ""}`}
              onClick={() => setAction(opt)}
              disabled={!user}
              style={{
                "--action-color": getActionColor(opt),
                "--action-color-light": getActionColor(opt) + "20",
              }}
            >
              <span className="chat-action-btn-icon">{getActionIcon(opt)}</span>
              <span className="chat-action-btn-label">
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="input-container glassmorphism">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            className="modern-textarea"
            placeholder={
              user
                ? selectedTask
                  ? `Ask about "${selectedTask.title}" or request an update...`
                  : `What would you like to ${action}? (Press Enter to send, Shift+Enter for new line)`
                : "Please login to start chatting with your AI coach"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            rows="1"
            disabled={!user}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={loading || !input.trim() || !user}
          >
            {loading ? (
              <div className="send-spinner"></div>
            ) : (
              <svg
                className="send-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
        <div className="input-footer">
          <span className="current-action">
            Mode:{" "}
            <strong style={{ color: getActionColor(action) }}>
              {action.charAt(0).toUpperCase() + action.slice(1)}
            </strong>
          </span>
          <span className="input-hint">
            {input.length > 0 && `${input.length} characters`}
          </span>
        </div>
        {displayMode === "custom" && (
          <div
            className="resize-handle"
            onMouseDown={startResize}
            title="Drag to resize chat window"
          />
        )}
      </div>
    </div>
  );
};

export default AIChatWithActions;
