import OpenAI from "openai";

export const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey:  process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "placeholder",
});
