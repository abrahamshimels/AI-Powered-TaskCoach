// services/task.service.js
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../models/task.model.js";

// ------- CREATE -------
export const createTaskService = async (data,user_id) => {
  return await createTask(data,user_id);
};

// ------- GET ALL -------
export const getTasksService = async (user_id) => {
  return await getAllTasks(user_id);
};

// ------- GET ONE -------
export const getTaskService = async (id, user_id) => {
  return await getTaskById(id, user_id);
};

// ------- UPDATE -------
export const updateTaskService = async (id, data, user_id) => {
  return await updateTask(id, data, user_id);
};

// ------- DELETE -------
export const deleteTaskService = async (id, user_id) => {
  return await deleteTask(id, user_id);
};
