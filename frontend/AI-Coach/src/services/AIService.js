import api from "../api/axios";

const getApiErrorMessage = (error, fallbackMessage) => {
  const messageFromApi =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  return messageFromApi || fallbackMessage;
};

export const askAI = async (input) => {
  let text = input;
  if (typeof input !== "string") {
    text = JSON.stringify(input);
  }
  try {
    const res = await api.post("/ai/task/coach", { text });
    return res.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to get AI response"));
  }
};

export const createTaskAI = async (taskDetails) => {
  let text = taskDetails;
  if (typeof taskDetails !== "string") {
    text = JSON.stringify(taskDetails);
  }
  try {
    const res = await api.post("/ai/task/create", { text });
    return res.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to create task via AI"));
  }
};

export const updateTaskAI = async (updateDetails) => {
  let text = updateDetails;
  if (typeof updateDetails !== "string") {
    text = JSON.stringify(updateDetails);
  }
  try {
    const res = await api.post("/ai/task/update/", { text });
    return res.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update task via AI"));
  }
};

export const deleteTaskAI = async (input) => {
  let text = input;
  if (typeof input !== "string") {
    text = JSON.stringify(input);
  }
  try {
    const res = await api.delete("/ai/task/delete/", { data: { text } });
    return res.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to delete task via AI"));
  }
};

export const analyzeTasksAI = async (input) => {
  let text = input;
  if (typeof input !== "string") {
    text = JSON.stringify(input);
  }
  try {
    const res = await api.post("/ai/task/coach", { text });
    return res.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to analyze tasks"));
  }
};
