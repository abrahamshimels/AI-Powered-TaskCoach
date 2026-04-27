import api from "../api/axios";

export const TASKS_QUERY_KEY = ["tasks"];

const getApiErrorMessage = (error, fallbackMessage) => {
  const messageFromApi =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  return messageFromApi || fallbackMessage;
};

export const getAllTasks = async () => {
  try {
    const res = await api.get("/task/");
    return res.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch tasks"));
  }
};

export const getTaskById = async (id) => {
  try {
    const res = await api.get(`/task/${id}`);
    return res.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch task details"));
  }
};

export const createTask = async (taskData) => {
  try {
    const res = await api.post("/task/", taskData);
    return res.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to create task"));
  }
};

export const updateTaskById = async (id, updateData) => {
  try {
    const res = await api.put(`/task/${id}`, updateData);
    return res.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update task"));
  }
};

export const deleteTaskById = async (id) => {
  try {
    const res = await api.delete(`/task/${id}`);
    return res.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to delete task"));
  }
};