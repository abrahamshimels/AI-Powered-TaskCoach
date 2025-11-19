import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./task.css";
import { getAllTasks } from "../../../services/TaskService";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      const data = await getAllTasks();
      setTasks(data);
    };
    fetchTasks();
  }, []);

  const handleOpenTask = (id) => {
    navigate(`/task/${id}`);
  };

  return (
    <div className="taskList-container">
      <h2 className="taskList-title">Your Tasks</h2>

      <ul className="taskList-wrapper">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="task-item"
            onClick={() => handleOpenTask(task.id)}
          >
            <div className="task-header">
              <h3 className="task-title">{task.title}</h3>
              <span className={`task-status status-${task.status}`}>
                {task.status}
              </span>
            </div>

            <p className="task-desc">{task.description}</p>

            {task.due_date && (
              <p className="task-due">
                ⏳ Due: <span>{task.due_date}</span>
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Tasks;
