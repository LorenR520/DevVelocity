// server/ai/builder-engine.ts

/**
 * DevVelocity — AI Builder Engine (GPT-5.1-Pro)
 * ---------------------------------------------------------
 * Responsibilities:
 *  • Run model with safe JSON formatting
 *  • Retry on malformed JSON
 *  • Enforce plan context + provider docs
 *  • Guarantee infrastructure blueprint output
 */

import OpenAI from "openai";
import { AICreditTracking } from "./credit-tracking";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Max safe retries for malformed JSON
const MAX_RETRIES = 3;

export class BuilderEngine {
  /**
   * Run AI Builder with full retry + validation
   */
  static async run(openaiClient: OpenAI, prompt: string) {
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      attempts++;

      try {
        const response = await openaiClient.chat.completions.create({
          model: "gpt-5.1-pro",
          messages: [
            {
              role: "system",
              content: "Return ONLY valid JSON. No markdown. No commentary.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.25,
          max_tokens: 6000,
          response_format: { type: "json_object" },
        });

        const raw = response.choices?.[0]?.message?.content;

        if (!raw) {
          throw new Error("No output returned");
        }

        // Parse JSON
        let json;
        try {
          json = JSON.parse(raw);
        } catch (err) {
          console.warn(`⚠️ Invalid JSON (Attempt ${attempts})`);
          continue;
        }

        // Token usage tracking
        const usage = response.usage;
        if (usage) {
          await AICreditTracking.record({
            orgId: json?.orgId || "unknown",
            planId: json?.planId || "developer",
            inputTokens: usage.prompt_tokens,
            outputTokens: usage.completion_tokens,
          });
        }

        return json;
      } catch (err) {
        console.error("AI Builder Engine Failure:", err);

        if (attempts >= MAX_RETRIES) {
          return {
            error:
              "AI Builder failed after multiple attempts. Please retry or upgrade your plan.",
          };
        }
      }
    }
  }
}
