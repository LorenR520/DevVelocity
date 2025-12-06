// server/ai/builder-engine.ts

/**
 * DevVelocity AI — Builder Engine
 * ---------------------------------------------------------
 * Responsibilities:
 *  ✓ Accepts a fully built prompt
 *  ✓ Calls GPT-5.1-Pro safely
 *  ✓ Forces structured JSON output
 *  ✓ Attempts recovery if model returns invalid JSON
 *  ✓ Returns final normalized builder object
 */

import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ Missing OPENAI_API_KEY — AI Builder will not function.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Normalize whitespace and invisible characters that cause JSON parsing issues
 */
function cleanJSON(str: string) {
  return str
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .replace(/\u0000/g, "")
    .trim();
}

export class BuilderEngine {
  /**
   * Execute the AI build generation
   */
  static async run(
    openaiClient: OpenAI,
    prompt: string
  ): Promise<any> {
    try {
      const response = await openaiClient.chat.completions.create({
        model: "gpt-5.1-pro",
        messages: [
          {
            role: "system",
            content:
              "You are DevVelocity AI — output MUST be valid JSON. No commentary.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 8000,
        response_format: { type: "json_object" }, // Force JSON
      });

      const content = response.choices?.[0]?.message?.content;

      if (!content) {
        return { error: "AI returned no content." };
      }

      const cleaned = cleanJSON(content);

      try {
        // Attempt JSON parse
        const parsed = JSON.parse(cleaned);
        return { success: true, ...parsed };
      } catch (err) {
        console.error("JSON Parse Error:", err);
        return {
          error: "AI returned invalid JSON.",
          raw: cleaned,
        };
      }
    } catch (err: any) {
      console.error("AI Builder Engine Error:", err);

      return {
        error: err?.message ?? "Unknown AI Builder Error",
      };
    }
  }
}
