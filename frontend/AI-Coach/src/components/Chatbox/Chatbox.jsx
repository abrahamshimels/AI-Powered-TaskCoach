import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  askAI,
  createTaskAI,
  updateTaskAI,
  deleteTaskAI,
  analyzeTasksAI,
} from "../../services/AIService";
import "./Chatbox.css";

const AIChatWithActions = () => {
  const [action, setAction] = useState("analysis");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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

  return (
    <div className="modern-chatbox">
      {/* HEADER */}
      <div className="chatbox-header glassmorphism">
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
        <div className="status-indicator">
          <div className="status-dot"></div>
          <span>Online</span>
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
        {messages.length === 0 && (
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
            placeholder={`What would you like to ${action}? (Press Enter to send, Shift+Enter for new line)`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            rows="1"
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
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
      </div>
    </div>
  );
};

export default AIChatWithActions;
