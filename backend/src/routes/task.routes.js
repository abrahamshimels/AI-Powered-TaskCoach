import express from "express";
import {
  addTask,
  fetchTasks,
  fetchTasksNested,
  fetchSubtasks,
  fetchTask,
  editTask,
  removeTask,
} from "../controllers/task.controller.js";

import { authMiddleware } from "../middleware/auth.js";
const router = express.Router();

router.post("/", authMiddleware, addTask); // Create
router.get("/", authMiddleware, fetchTasks); // Read all
router.get("/nested/all", authMiddleware, fetchTasksNested); // Read all nested
router.get("/:id/subtasks", authMiddleware, fetchSubtasks); // Read subtasks
router.get("/:id", authMiddleware, fetchTask); // Read one
router.put("/:id", authMiddleware, editTask); // Update
router.delete("/:id", authMiddleware, removeTask); // Delete

export default router;
