import api from "../api/axios";

export const askAI = async (input) => {
  let text = input;
  if (typeof input !== "string") {
    text = JSON.stringify(input);
  }
  const res = await api.post("/ai/task/coach", { text });
  return res.data;
};

export const createTaskAI = async (taskDetails) => {
  let text = taskDetails;
  if (typeof taskDetails !== "string") {
    text = JSON.stringify(taskDetails);
  }
  const res = await api.post("/ai/task/create", { text });
  return res.data;
};

export const updateTaskAI = async (updateDetails) => {
    let text = updateDetails;
    if (typeof updateDetails !== "string") {
      text = JSON.stringify(updateDetails);
    }
  const res = await api.post("/ai/task/update/", { text });
  return res.data;
};

export const deleteTaskAI = async (input) => {
    let text = input;
    if (typeof input !== "string") {
      text = JSON.stringify(input);
    }
  const res = await api.delete("/ai/task/delete/", { data: { text } });
  return res.data;
};

export const analyzeTasksAI = async (input) => {
    let text = input;
    if (typeof input !== "string") {
      text = JSON.stringify(input);
    }
  const res = await api.post("/ai/task/coach", { text });
  return res.data;
};
