// controllers/task.controller.js
import {
  createTaskService,
  getTasksService,
  getTaskService,
  updateTaskService,
  deleteTaskService,
} from "../services/task.service.js";

// CREATE
export const addTask = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description)
      return res.status(400).json({ message: "Title & description required" });
    
    const task = await createTaskService(req.body, req.user.id);

    res.status(201).json({ message: "Task created", task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL
export const fetchTasks = async (req, res) => {
  try {
    const tasks = await getTasksService(req.user.id);
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ONE
export const fetchTask = async (req, res) => {
  try {
    const task = await getTaskService(req.params.id, req.user.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
export const editTask = async (req, res) => {
  try {
    const result = await updateTaskService(req.params.id, req.body,req.user.id);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Task not found" });

    res.status(200).json({ message: "Task updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE
export const removeTask = async (req, res) => {
  try {
    const result = await deleteTaskService(req.params.id , req.user.id);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Task not found" });

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
