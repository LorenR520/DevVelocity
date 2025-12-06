/**
 * DevVelocity — Builder Engine
 * ------------------------------------------------------------
 * Executes GPT-5.1-Pro requests for:
 *  ✓ Full cloud architecture generation
 *  ✓ Template generation
 *  ✓ Build instructions
 *
 * Ensures:
 *  - JSON-only responses
 *  - Automatic retry on invalid output
 *  - Safe parsing
 */

import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ Missing OPENAI_API_KEY — Builder Engine will fail.");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export class BuilderEngine {
  /**
   * Run the AI builder using a prompt (from buildAIPrompt)
   */
  static async run(openai = client, prompt: string) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5.1-pro",
        messages: [
          {
            role: "system",
            content: "Respond ONLY with valid JSON. No commentary.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 16000,
      });

      const raw = response.choices?.[0]?.message?.content;

      if (!raw) {
        return { error: "No response from AI Builder." };
      }

      // Try parsing JSON output
      try {
        const parsed = JSON.parse(raw);
        return parsed;
      } catch (err) {
        console.warn("⚠️ AI returned invalid JSON, attempting repair...");

        // Attempt automatic repair using GPT
        const repair = await openai.chat.completions.create({
          model: "gpt-5.1-pro",
          messages: [
            {
              role: "system",
              content:
                "Fix the following so it becomes valid JSON. Return ONLY JSON.",
            },
            { role: "user", content: raw },
          ],
          temperature: 0,
        });

        const repaired = repair.choices?.[0]?.message?.content;

        try {
          return JSON.parse(repaired ?? "{}");
        } catch (err2) {
          return {
            error: "Failed to parse AI Builder output even after repair.",
            raw,
          };
        }
      }
    } catch (err: any) {
      console.error("Builder Engine Error:", err);
      return {
        error: err?.message ?? "Unknown error in BuilderEngine.run()",
      };
    }
  }
}
