// services/ai.service.js
import { GoogleGenAI } from "@google/genai";

export const askGeminiService = async (prompt) => {
  if (!prompt) {
    throw new Error("Prompt is required");
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text || "No output received";
};
