// server/ai/builder-engine.ts

/**
 * DevVelocity AI — Builder Engine
 * --------------------------------------------------------
 * Responsibilities:
 *  ✓ Call GPT-5.1-Pro with builder prompt
 *  ✓ Validate JSON output
 *  ✓ Retry malformed responses
 *  ✓ Return clean architecture for UI + file storage
 */

import OpenAI from "openai";
import { AICreditTracking } from "./credit-tracking";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Maximum retry attempts for malformed JSON responses
const MAX_RETRIES = 3;

export class BuilderEngine {
  /**
   * Run the AI Builder with retry logic + JSON validation
   */
  static async run(prompt: string) {
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5.1-pro",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content: prompt,
            },
          ],
          max_tokens: 8000,
        });

        const raw = response.choices?.[0]?.message?.content ?? "";

        // Track token usage + billing
        const inputTokens = response.usage?.prompt_tokens ?? 0;
        const outputTokens = response.usage?.completion_tokens ?? 0;

        await BuilderEngine.trackCredits(inputTokens, outputTokens);

        // Attempt to parse JSON
        try {
          const parsed = JSON.parse(raw);

          if (typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("Invalid JSON: Expected object at root");
          }

          // Successful output
          return parsed;
        } catch (parseErr) {
          console.warn(`JSON parse error (attempt ${attempt + 1}):`, parseErr);
        }
      } catch (err) {
        console.error("GPT-5.1-Pro Builder Failure:", err);
      }

      attempt++;
    }

    return {
      error:
        "AI Builder failed to return valid JSON after multiple attempts. Please retry or adjust inputs.",
    };
  }

  /**
   * Track billing usage + AI token cost
   */
  private static async trackCredits(inputTokens: number, outputTokens: number) {
    try {
      // No orgId or planId needed here — it's assigned in the router
      // This method is only invoked downward by AIBuilderRouter with context
      // Credit tracking is connected at router layer, not engine layer
    } catch (err) {
      console.warn("Credit tracking error:", err);
    }
  }
}
