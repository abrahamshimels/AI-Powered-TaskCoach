import api from "../api/axios";

export const getAllTasks = async () => {
  const res = await api.get("/task/");
  console.log("response", res.data);
  return res.data;
};

export const getTaskById = async (id) => {
  const res = await api.get(`/task/${id}`);
  return res.data;
};

export const createTask = async (taskData) => {
  const res = await api.post("/task/", taskData);
  return res.data;
};

export const updateTaskById = async (id, updateData) => {
  const res = await api.put(`/task/${id}`, updateData);
  return res.data;
};

export const deleteTaskById = async (id) => {
  const res = await api.delete(`/task/${id}`);
  return res.data;
};