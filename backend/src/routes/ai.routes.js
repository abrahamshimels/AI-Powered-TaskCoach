import express from "express";
import {
  askAI,
  aiCreateTask,
  aiUpdateTask,
  aiTaskCoach,
  aiDeleteTask,
} from "../controllers/ai.controller.js";

import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/ask", authMiddleware, aiTaskCoach);
router.post("/task/create", authMiddleware, aiCreateTask);
router.post("/task/update/", authMiddleware, aiUpdateTask);
router.delete("/task/delete/", authMiddleware, aiDeleteTask);
router.post("/task/coach", authMiddleware, aiTaskCoach);

export default router;
