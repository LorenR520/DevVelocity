// server/ai/builder-engine.ts

/**
 * DevVelocity Builder Engine
 * ------------------------------------------------------------
 * Responsible for:
 *  ✓ Calling GPT-5.1-Pro
 *  ✓ Enforcing JSON-only output
 *  ✓ Auto-fixing malformed JSON (retry engine)
 *  ✓ Enforcing plan rules (handled upstream)
 *  ✓ Returning clean "architecture" object
 */

import OpenAI from "openai";
import { AICreditTracking } from "./credit-tracking";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// -------------------------------
// Retry policy for malformed JSON
// -------------------------------
const MAX_RETRIES = 3;

export class BuilderEngine {
  /**
   * Run AI Builder with retries + JSON validation
   */
  static async run(openaiClient: OpenAI, prompt: string) {
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🧠 AI Builder: Attempt ${attempt}/${MAX_RETRIES}`);

        const completion = await openaiClient.chat.completions.create({
          model: "gpt-5.1-pro",
          messages: [
            {
              role: "system",
              content:
                "You are DevVelocity, an autonomous cloud architect. " +
                "Output ONLY valid JSON. No comments. No markdown.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.15,
          max_tokens: 6000,
        });

        const raw = completion.choices?.[0]?.message?.content ?? "";

        // -------------------------------
        // Try to parse JSON from output
        // -------------------------------
        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch (jsonErr) {
          console.warn("⚠️ JSON parse failed:", jsonErr);
          lastError = jsonErr;
          continue; // retry
        }

        // -------------------------------
        // Validate architecture structure
        // -------------------------------
        if (!parsed.architecture) {
          lastError = new Error("AI output missing architecture field");
          continue;
        }

        // -------------------------------
        // Token usage billing (estimate)
        // -------------------------------
        const inputTokens =
          completion.usage?.prompt_tokens ?? raw.length / 4;
        const outputTokens =
          completion.usage?.completion_tokens ??
          JSON.stringify(parsed).length / 4;

        await AICreditTracking.record({
          orgId: parsed.orgId ?? "unknown",
          planId: parsed.plan ?? "developer",
          inputTokens,
          outputTokens,
        });

        // SUCCESS
        return parsed;
      } catch (err) {
        console.error("AI Builder Engine Error:", err);
        lastError = err;
      }
    }

    // -------------------------------
    // FAIL after max retries
    // -------------------------------
    return {
      error:
        lastError?.message ??
        "AI Builder failed after maximum retry attempts.",
      raw: lastError,
    };
  }
}
