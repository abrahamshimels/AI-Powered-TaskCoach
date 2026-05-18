import axios from "axios";

const apiBaseURL = import.meta.env.VITE_API_BASE_URL;
const AUTH_INVALID_EVENT = "auth:invalid-token";

const emitAuthInvalid = (message = "Invalid token") => {
  window.dispatchEvent(
    new CustomEvent(AUTH_INVALID_EVENT, {
      detail: { message },
    })
  );
};

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});

// Add token to headers automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error?.config?.url || "";
    const requestUsedToken = Boolean(error?.config?.headers?.Authorization);
    const isAuthEndpoint = /\/auth\/(login|signup)/i.test(requestUrl);
    const apiMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Invalid token";

    if (
      !isAuthEndpoint &&
      requestUsedToken &&
      /invalid token|token expired|jwt expired|unauthorized/i.test(apiMessage)
    ) {
      emitAuthInvalid(apiMessage || "Invalid token");
    }

    return Promise.reject(error);
  }
);

export default api;
