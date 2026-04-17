// services/ai.service.js
import { GoogleGenAI } from "@google/genai";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_RERANK_URL = "https://openrouter.ai/api/v1/rerank";

const getEnvValue = (key, required = false) => {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`${key} is required for the selected AI provider`);
  }
  return value?.trim() || "";
};

export const askAIService = async (prompt, options = {}) => {
  if (!prompt) {
    throw new Error("Prompt is required");
  }

  const provider = (process.env.AI_SERVICE_PROVIDER || "gemini").toLowerCase();
  console.log("[AI Service] provider=", provider, "options=", options);

  switch (provider) {
    case "gemini":
      return askGeminiService(prompt);
    case "chatgpt":
      return askChatGPTService(prompt);
    case "openrouter":
      return askOpenRouterService(prompt, options);
    default:
      throw new Error(
        `Unsupported AI_SERVICE_PROVIDER: ${provider}. Supported values: gemini, chatgpt, openrouter.`
      );
  }
};

const askGeminiService = async (prompt) => {
  const apiKey = getEnvValue("GEMINI_API_KEY", true);

  const ai = new GoogleGenAI({
    apiKey,
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text || "No output received";
};

const askChatGPTService = async (prompt) => {
  const apiKey = getEnvValue("OPENAI_API_KEY", true);
  const model = process.env.OPENAI_API_MODEL || "gpt-3.5-turbo";

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || "No output received";
};

const askOpenRouterService = async (prompt, options = {}) => {
  const apiKey = getEnvValue("OPENROUTER_API_KEY", true);
  const envMode = (process.env.OPENROUTER_MODE || "chat").toLowerCase();
  const mode = (options.openRouterMode || envMode).toLowerCase();
  const configuredModel = process.env.OPENROUTER_MODEL;

  let model = options.openRouterModel;
  if (!model) {
    if (mode === "rerank") {
      model = process.env.OPENROUTER_RERANK_MODEL || configuredModel || "cohere/rerank-4-pro";
    } else {
      model = process.env.OPENROUTER_CHAT_MODEL || configuredModel || "gpt-4o-mini";
    }
  }

  console.log("[OpenRouter] mode=", mode, "model=", model);

  if (mode === "chat" && model.toLowerCase().includes("rerank")) {
    throw new Error(
      `OPENROUTER_MODEL "${model}" is a rerank model but the mode is chat. Set OPENROUTER_CHAT_MODEL to a chat-compatible model like "gpt-4o-mini".`
    );
  }

  if (mode === "rerank" && !model.toLowerCase().includes("rerank")) {
    throw new Error(
      `OPENROUTER_MODEL "${model}" is not a rerank model but the mode is rerank. Use OPENROUTER_RERANK_MODEL for rerank models like "cohere/rerank-4-pro".`
    );
  }

  if (mode === "rerank") {
    const documents = (process.env.OPENROUTER_RERANK_DOCUMENTS || "")
      .split("||")
      .map((item) => item.trim())
      .filter(Boolean);
    if (documents.length === 0) {
      throw new Error(
        "OPENROUTER_RERANK_DOCUMENTS must be set when OPENROUTER_MODE=rerank. Use || to separate documents."
      );
    }

    const top_n = Number(process.env.OPENROUTER_RERANK_TOP_N || 3);

    const response = await fetch(OPENROUTER_RERANK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        query: prompt,
        documents,
        top_n,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter rerank error: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.results)) {
      throw new Error("Unexpected OpenRouter rerank response format.");
    }

    return data.results
      .map(
        (result) =>
          `Index ${result.index}: ${result.document?.text ?? ""} (score=${result.relevance_score})`
      )
      .join("\n");
  }

  const response = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter error: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || "No output received";
};
