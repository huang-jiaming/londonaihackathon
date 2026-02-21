import { GoogleGenerativeAI } from "@google/generative-ai";

const modelName = "gemini-2.0-flash";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function runGeminiPrompt(prompt: string): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
