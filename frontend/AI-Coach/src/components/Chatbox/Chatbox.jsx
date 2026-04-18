import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { AuthContext } from "../../context/AuthContext";
import {
  askAI,
  createTaskAI,
  updateTaskAI,
  deleteTaskAI,
  analyzeTasksAI,
} from "../../services/AIService";
import "./Chatbox.css";

const AIChatWithActions = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
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

    try {
      let res;
      switch (action) {
        case "ask":
          res = await askAI(input);
          break;
        case "add":
          res = await createTaskAI(input);
          break;
        case "update":
          res = await updateTaskAI(input);
          break;
        case "delete":
          res = await deleteTaskAI(input);
          break;
        case "analysis":
          res = await analyzeTasksAI(input);
          break;
        default:
          res = await askAI(input);
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
      className={`modern-chatbox ${displayMode === "full" ? "full-screen" : displayMode === "half" ? "half-screen" : displayMode === "custom" ? "custom-mode" : ""}`}
      style={customStyle}
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
              {qa.label}
            </button>
          ))}
        </div>
      </div>

      {/* MESSAGES */}
      <div className="messages-container">
        {messages.length === 0 && user && (
          <div className="welcome-message">
            <div className="welcome-icon">🎯</div>
            <h3>Welcome to Your AI Coach!</h3>
            <p>
              I'm here to help you manage tasks, track progress, and boost
              productivity.
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
              className={`action-btn ${action === opt ? "active" : ""}`}
              onClick={() => setAction(opt)}
              disabled={!user}
              style={{
                "--action-color": getActionColor(opt),
                "--action-color-light": getActionColor(opt) + "20",
              }}
            >
              <span className="action-btn-icon">{getActionIcon(opt)}</span>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
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
                ? `What would you like to ${action}? (Press Enter to send, Shift+Enter for new line)`
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
