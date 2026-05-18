import db from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

const normalizeProgress = (value) => {
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return 0;
  return Math.min(100, Math.max(0, Math.round(numberValue)));
};

// CREATE
export const createTask = async (taskData,user_id) => {
  try {
    const {
      title,
      description,
      priority = "medium",
      status = "pending",
      progress = 0,
      due_date = null,
      created_by_ai = false,
      parent_id = null,
    } = taskData;

    if (!user_id) throw new Error("User ID is required");

    const id = uuidv4();

    const [result] = await db.query(
      `
      INSERT INTO tasks
        (id, title, description, priority, status, progress, due_date, created_by_ai, parent_id, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        title,
        description,
        priority,
        status,
        normalizeProgress(progress),
        due_date,
        created_by_ai,
        parent_id,
        user_id,
      ]
    );

    return { id, ...taskData, parent_id };
  } catch (error) {
    throw new Error("Error creating task: " + error.message);
  }
};


// READ ALL
export const getAllTasks = async (user_id) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC",
      [user_id]
    );
    return rows;
  } catch (error) {
    throw new Error("Error fetching tasks: " + error.message);
  }
};

// READ ONE
export const getTaskById = async (id, user_id) => {
  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [id, user_id]);
    if (rows.length === 0) return null;
    return rows[0];
  } catch (error) {
    throw new Error("Error fetching task: " + error.message);
  }
};

// UPDATE
export const updateTask = async (id, taskData, user_id) => {
  try {
    if (!id) throw new Error("Task ID is required");
    if (!taskData || Object.keys(taskData).length === 0)
      throw new Error("No fields to update");

    const fields = [];
    const values = [];

    // Only include fields that exist in taskData
    if (taskData.title !== undefined) {
      fields.push("title = ?");
      values.push(taskData.title);
    }
    if (taskData.description !== undefined) {
      fields.push("description = ?");
      values.push(taskData.description);
    }
    if (taskData.priority !== undefined) {
      fields.push("priority = ?");
      values.push(taskData.priority);
    }
    if (taskData.status !== undefined) {
      fields.push("status = ?");
      values.push(taskData.status);
    }
    if (taskData.progress !== undefined) {
      fields.push("progress = ?");
      values.push(normalizeProgress(taskData.progress));
    }
    if (taskData.due_date !== undefined) {
      fields.push("due_date = ?");
      values.push(taskData.due_date);
    }
    if (taskData.created_by_ai !== undefined) {
      fields.push("created_by_ai = ?");
      values.push(taskData.created_by_ai);
    }

    // If no valid fields, exit
    if (fields.length === 0) {
      throw new Error("No valid fields to update");
    }

    const sql = `UPDATE tasks SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`;
    values.push(id, user_id);

    const [result] = await db.query(sql, values);
    return result;
  } catch (error) {
    throw new Error("Error updating task: " + error.message);
  }
};


// DELETE
export const deleteTask = async (id, user_id) => {
  try {
    const [result] = await db.query("DELETE FROM tasks WHERE id = ? AND user_id = ?", [id, user_id]);
    return result;
  } catch (error) {
    throw new Error("Error deleting task: " + error.message);
  }
};

// GET ALL TASKS NESTED (hierarchical tree)
export const getAllTasksNested = async (user_id) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM tasks WHERE user_id = ? ORDER BY COALESCE(parent_id, id) ASC, created_at DESC",
      [user_id]
    );

    const tasksMap = new Map();
    const rootTasks = [];

    rows.forEach((task) => {
      tasksMap.set(task.id, { ...task, children: [] });
    });

    rows.forEach((task) => {
      if (task.parent_id) {
        const parent = tasksMap.get(task.parent_id);
        if (parent) {
          parent.children.push(tasksMap.get(task.id));
        }
      } else {
        rootTasks.push(tasksMap.get(task.id));
      }
    });

    return rootTasks;
  } catch (error) {
    throw new Error("Error fetching nested tasks: " + error.message);
  }
};

// GET SUBTASKS
export const getSubtasks = async (parentId, user_id) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM tasks WHERE parent_id = ? AND user_id = ? ORDER BY created_at DESC",
      [parentId, user_id]
    );
    return rows;
  } catch (error) {
    throw new Error("Error fetching subtasks: " + error.message);
  }
};
