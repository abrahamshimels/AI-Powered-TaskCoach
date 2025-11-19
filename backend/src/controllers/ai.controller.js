import { askGeminiService } from "../services/ai.service.js";
import {
  createTaskService,
  updateTaskService,
  getTasksService,
  deleteTaskService,
} from "../services/task.service.js";

// 1️⃣ GENERAL AI RESPONSE
export const askAI = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const reply = await askGeminiService(prompt);

    res.status(200).json({ reply });
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 2️⃣ AI CREATE TASK
export const aiCreateTask = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });
const now = new Date();
    // Call Gemini
    const aiResponse = await askGeminiService(`
Convert the following text into STRICT JSON for a task.
The JSON MUST ONLY include these fields:
- title (short, concise)
- description (1-2 sentence summary)
- priority (low, medium, high)
- due_date (YYYY-MM-DD HH:MM:SS or null)
- now the date is ${now.toISOString().slice(0,19).replace("T"," ")} use this as reference if needed.
- status (pending, in-progress, completed)
Do NOT include any extra text, explanations, or comments.

User text: "${text}"
    `);

    console.log("AI raw response:", aiResponse);

    // Try parsing AI output
    let parsed;
    try {
      // Remove Markdown ```json ... ``` wrapping if present
      const cleaned = aiResponse
        .replace(/^```json\s*/, "")
        .replace(/```$/, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI JSON:", aiResponse);
      return res.status(400).json({ error: "AI did not return valid JSON." });
    }

    // Normalize fields
    const normalized = {
      title: parsed.title || "Untitled Task",
      description: parsed.description || "No description provided",
      priority: ["low", "medium", "high"].includes(parsed.priority)
        ? parsed.priority
        : "medium",
      status: ["pending", "in-progress", "completed"].includes(parsed.status)
        ? parsed.status
        : "pending",
      due_date: parsed.due_date
        ? parsed.due_date.replace("T", " ").split(".")[0]
        : null,
      created_by_ai: true,
    };

    // Save to DB
    const saved = await createTaskService(normalized , req.user.id);

    res.status(201).json({ message: "Task created with AI", task: saved });
  } catch (err) {
    console.error("AI Create Task Error:", err);
    res.status(500).json({ error: err.message });
  }
};


// 3️⃣ AI UPDATE TASK

export const aiUpdateTask = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const now = new Date();

    // Get all existing tasks
    const tasks = await getTasksService(req.user.id);
    console.log("Existing tasks:", tasks);

    // Call Gemini to generate the update JSON
    const aiTaskUpdate = await askGeminiService(`
Based on the following user's instruction, generate STRICT JSON containing ONLY the fields that should be updated in an existing task.
Allowed fields: id, title, description, priority, status, due_date, created_by_ai.

- Only include fields that are being changed.
- Do NOT include any extra text, explanations, or comments.
- Use the date format YYYY-MM-DD HH:MM:SS for due_date.
- now the date is ${now
      .toISOString()
      .slice(0, 19)
      .replace("T", " ")} use this as reference if needed.
- Select the related task id from the input text among the existing tasks: ${JSON.stringify(
      tasks
    )}
- Boolean or string values must be valid (e.g., priority: "low"|"medium"|"high", status: "pending"|"in-progress"|"completed").

User instruction: "${text}"
`);

    console.log("AI raw response:", aiTaskUpdate);

    // Parse AI output
    let parsed;
    try {
      const cleaned = aiTaskUpdate
        .replace(/^```json\s*/, "")
        .replace(/```$/, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI JSON:", aiTaskUpdate);
      return res.status(400).json({ error: "AI did not return valid JSON." });
    }

    // Ensure task ID exists
    if (!parsed.id) {
      return res
        .status(400)
        .json({ error: "AI did not provide task id to update." });
    }
    const taskId = parsed.id;

    // Normalize fields (only those returned by AI)
    const fieldsToUpdate = {};
    if (parsed.title) fieldsToUpdate.title = parsed.title;
    if (parsed.description) fieldsToUpdate.description = parsed.description;
    if (parsed.priority && ["low", "medium", "high"].includes(parsed.priority))
      fieldsToUpdate.priority = parsed.priority;
    if (
      parsed.status &&
      ["pending", "in-progress", "completed"].includes(parsed.status)
    )
      fieldsToUpdate.status = parsed.status;
    if (parsed.due_date)
      fieldsToUpdate.due_date = parsed.due_date.replace("T", " ").split(".")[0];
    fieldsToUpdate.created_by_ai = true;

    // Update in DB
    console.log("fields to update", fieldsToUpdate);

    const result = await updateTaskService(taskId, fieldsToUpdate , req.user.id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({
      message: "Task updated via AI",
      updated_fields: fieldsToUpdate,
    });
  } catch (err) {
    console.error("AI Update Task Error:", err);
    res.status(500).json({ error: err.message });
  }
};


// AI-POWERED TASK DELETE
export const aiDeleteTask = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    // Get all existing tasks
    const tasks = await getTasksService(req.user.id);
    console.log("Existing tasks:", tasks);

    const now = new Date();

    // Ask AI which task(s) to delete
    const aiTaskDelete = await askGeminiService(`
You are a task management assistant. Based on the user's instruction, select the task(s) to delete.
- Tasks: ${JSON.stringify(tasks)}
- Current date/time: ${now.toISOString().slice(0, 19).replace("T", " ")}
- User instruction: "${text}"
- Return STRICT JSON with only the "id" field of the task(s) to delete.
- Do NOT include any explanations or extra text.
- Example: { "id": 123 } or { "ids": [123, 456] }
`);

    console.log("AI raw response:", aiTaskDelete);

    // Parse AI output
    let parsed;
    try {
      const cleaned = aiTaskDelete
        .replace(/^```json\s*/, "")
        .replace(/```$/, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI JSON:", aiTaskDelete);
      return res.status(400).json({ error: "AI did not return valid JSON." });
    }

    // Determine task IDs to delete
    let idsToDelete = [];
    if (parsed.id) idsToDelete.push(parsed.id);
    if (parsed.ids && Array.isArray(parsed.ids)) idsToDelete = parsed.ids;

    if (idsToDelete.length === 0) {
      return res
        .status(400)
        .json({ error: "AI did not provide any task IDs to delete." });
    }

    // Delete tasks
    const deletedResults = [];
    for (const id of idsToDelete) {
      const result = await deleteTaskService(id , req.user.id);
      deletedResults.push({
        id,
        success: result.success,
        message: result.message,
      });
    }

    res.status(200).json({
      message: "AI task deletion completed",
      deleted: deletedResults,
    });
  } catch (err) {
    console.error("AI Delete Task Error:", err);
    res.status(500).json({ error: err.message });
  }
};




// 4️⃣ AI COACHING / ANALYSIS
export const aiTaskCoach = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    // Get all existing tasks
    const tasks = await getTasksService(req.user.id);
    console.log("Existing tasks:", tasks);

    const now = new Date();

    // Call Gemini to generate analysis based on all tasks
    const aiAnalysis = await askGeminiService(`
You are a productivity assistant. Based on the user's instruction, analyze the user's tasks below and provide a helpful response.
- Tasks: ${JSON.stringify(tasks)}
- Current date/time: ${now.toISOString().slice(0, 19).replace("T", " ")}
- User instruction: "${text}"
- if the user is asking for add new tasks , edit existing tasks, or delete tasks suggest the use the appropriate mode(
Action Mode:
Add
Update
Delete
) for that 
- Respond with actionable insights, summaries, or lists of tasks as appropriate.
`);

    console.log("AI raw analysis:", aiAnalysis);

    // Return AI analysis directly
    res.status(200).json({
      message: "AI Task Analysis",
      analysis: aiAnalysis,
    });
  } catch (err) {
    console.error("AI Task Analysis Error:", err);
    res.status(500).json({ error: err.message });
  }
};
