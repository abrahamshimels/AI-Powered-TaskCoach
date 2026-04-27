import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import "./task.css";
import { useQuery } from "@tanstack/react-query";
import { getAllTasks, TASKS_QUERY_KEY } from "../../../services/TaskService";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const DUE_SOON_WINDOW_MS = 6 * HOUR_MS;

const SECTION_ORDER = [
  "dueSoon",
  "dueToday",
  "dueThisWeek",
  "dueThisMonth",
  "later",
  "noDeadline",
];

const SECTION_META = {
  dueSoon: {
    title: "Due Soon (Next 6 Hours)",
    subtitle: "High-priority tasks that need attention now",
  },
  dueToday: {
    title: "Due Today",
    subtitle: "Tasks scheduled for today",
  },
  dueThisWeek: {
    title: "Due This Week",
    subtitle: "Tasks in the current week",
  },
  dueThisMonth: {
    title: "Due This Month",
    subtitle: "Tasks in the current month",
  },
  later: {
    title: "Later",
    subtitle: "Long-term tasks",
  },
  noDeadline: {
    title: "No Deadline",
    subtitle: "Tasks without due dates",
  },
};

const getTaskDate = (task) => {
  if (!task?.due_date) return null;
  const due = new Date(task.due_date);
  return Number.isNaN(due.getTime()) ? null : due;
};

const getWeekBounds = (date) => {
  const ref = new Date(date);
  const day = ref.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(ref);
  start.setDate(ref.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isInCurrentWeek = (date, now) => {
  const { start, end } = getWeekBounds(now);
  return date >= start && date <= end;
};

const isInCurrentMonth = (date, now) =>
  date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();

const formatDuration = (durationMs) => {
  const absMs = Math.abs(durationMs);

  if (absMs >= DAY_MS) {
    const days = Math.floor(absMs / DAY_MS);
    const hours = Math.floor((absMs % DAY_MS) / HOUR_MS);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  if (absMs >= HOUR_MS) {
    const hours = Math.floor(absMs / HOUR_MS);
    const minutes = Math.floor((absMs % HOUR_MS) / MINUTE_MS);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  const minutes = Math.max(1, Math.floor(absMs / MINUTE_MS));
  return `${minutes}m`;
};

const getDueLabel = (task, now) => {
  const dueDate = getTaskDate(task);
  if (!dueDate) return "No deadline";

  const diff = dueDate.getTime() - now.getTime();
  if (diff < 0) return `Overdue by ${formatDuration(diff)}`;

  return `${formatDuration(diff)} left`;
};

const getUrgencyClass = (task, now) => {
  const dueDate = getTaskDate(task);
  if (!dueDate) return "long-term";

  const diff = dueDate.getTime() - now.getTime();
  if (diff < DAY_MS) return "urgent";
  if (diff < 7 * DAY_MS) return "medium";
  return "long-term";
};

const getCategory = (task, now) => {
  const dueDate = getTaskDate(task);
  if (!dueDate) return "noDeadline";

  const diff = dueDate.getTime() - now.getTime();

  if (diff >= 0 && diff <= DUE_SOON_WINDOW_MS) return "dueSoon";
  if (isSameDay(dueDate, now)) return "dueToday";
  if (isInCurrentWeek(dueDate, now)) return "dueThisWeek";
  if (isInCurrentMonth(dueDate, now)) return "dueThisMonth";
  return "later";
};

const sortByDueTime = (a, b, now) => {
  const aDate = getTaskDate(a);
  const bDate = getTaskDate(b);

  if (!aDate && !bDate) {
    return (a.title || "").localeCompare(b.title || "");
  }

  if (!aDate) return 1;
  if (!bDate) return -1;

  const aDiff = aDate.getTime() - now.getTime();
  const bDiff = bDate.getTime() - now.getTime();

  const aOverdue = aDiff < 0;
  const bOverdue = bDiff < 0;

  if (aOverdue !== bOverdue) {
    return aOverdue ? -1 : 1;
  }

  if (aOverdue && bOverdue) {
    return bDate.getTime() - aDate.getTime();
  }

  return aDate.getTime() - bDate.getTime();
};

const getStatusProgress = (status) => {
  if (status === "completed") return 100;
  if (status === "in-progress") return 55;
  return 20;
};

const TaskBoardSkeleton = () => {
  return (
    <div className="task-skeleton-group" aria-hidden="true">
      {[1, 2, 3].map((section) => (
        <div className="task-skeleton-section" key={section}>
          <div className="task-skeleton-heading shimmer" />
          <div className="task-skeleton-subheading shimmer" />
          {[1, 2].map((card) => (
            <div className="task-skeleton-card" key={card}>
              <div className="task-skeleton-title shimmer" />
              <div className="task-skeleton-line shimmer" />
              <div className="task-skeleton-line short shimmer" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const Tasks = () => {
  const [nowTick, setNowTick] = useState(Date.now());
  const navigate = useNavigate();

  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: getAllTasks,
    refetchInterval: 60 * 1000,
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTick(Date.now());
    }, 30 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  const now = useMemo(() => new Date(nowTick), [nowTick]);

  const groupedTasks = useMemo(() => {
    const grouped = {
      dueSoon: [],
      dueToday: [],
      dueThisWeek: [],
      dueThisMonth: [],
      later: [],
      noDeadline: [],
    };

    tasks.forEach((task) => {
      const section = getCategory(task, now);
      grouped[section].push(task);
    });

    SECTION_ORDER.forEach((section) => {
      grouped[section].sort((a, b) => sortByDueTime(a, b, now));
    });

    return grouped;
  }, [tasks, now]);

  const handleOpenTask = (id) => {
    navigate(`/task/${id}`);
  };

  if (isLoading) {
    return (
      <div className="taskList-container">
        <h2 className="taskList-title">Your Tasks</h2>
        <TaskBoardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="taskList-container">
        <h2 className="taskList-title">Your Tasks</h2>
        <div className="task-fetch-error" role="alert">
          <p className="task-fetch-error-title">Couldn&apos;t load tasks</p>
          <p className="task-fetch-error-msg">
            {error?.message || "A network issue occurred while fetching tasks."}
          </p>
          <button className="task-retry-btn" type="button" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="taskList-container">
      <h2 className="taskList-title">Your Tasks</h2>
      {isFetching && <p className="task-refreshing">Refreshing tasks...</p>}

      <AnimatePresence mode="popLayout">
        {SECTION_ORDER.map((sectionKey) => {
          const sectionTasks = groupedTasks[sectionKey];
          if (!sectionTasks.length) return null;

          const meta = SECTION_META[sectionKey];

          return (
            <motion.section
              key={sectionKey}
              className="task-category"
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <header className="task-category-header">
                <h3>{meta.title}</h3>
                <p>{meta.subtitle}</p>
              </header>

              <motion.ul className="taskList-wrapper" layout>
                <AnimatePresence>
                  {sectionTasks.map((task) => {
                    const dueText = getDueLabel(task, now);
                    const urgencyClass = getUrgencyClass(task, now);
                    const statusProgress = getStatusProgress(task.status);

                    return (
                      <motion.li
                        layout
                        key={task.id}
                        className={`task-item urgency-${urgencyClass}`}
                        onClick={() => handleOpenTask(task.id)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="task-header">
                          <h3 className="task-title">{task.title}</h3>
                          <span className={`task-status status-${task.status}`}>
                            {task.status}
                          </span>
                        </div>

                        {task.description && <p className="task-desc">{task.description}</p>}

                        <div className="task-due-row">
                          <p className={`task-due task-due-${urgencyClass}`}>{dueText}</p>
                          {task.due_date && (
                            <p className="task-deadline-stamp">
                              {new Date(task.due_date).toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div className="task-progress">
                          <div className="task-progress-track">
                            <motion.div
                              className="task-progress-fill"
                              initial={false}
                              animate={{ width: `${statusProgress}%` }}
                              transition={{ duration: 0.35 }}
                            />
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </motion.ul>
            </motion.section>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default Tasks;
