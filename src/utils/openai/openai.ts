import OpenAI from "openai";
import { Messages } from "../types/common.types";

export const createChatBot = async (input: Messages[]) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing");
  }
  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const response = await client.responses.create({
    model: "openai/gpt-oss-20b",
    input,
    instructions: `
      You are a helpful customer support assistant.
      Respond in the user's language.
      Ask for clarification when needed.
      Do not invent app features or claim you performed account actions.
      Your name is ABO-SAMRA
    `,
    reasoning: { effort: "medium" },
    max_output_tokens: 2048,
  });
  const data = await response.output_text;
  return data;
};
