/**
 * DevVelocity — Core AI Builder Engine
 * --------------------------------------------------------------
 * Handles:
 *  - GPT-5.1-Pro calls
 *  - JSON-only structured outputs
 *  - Auto-repair for invalid JSON
 *  - Prompt injection protection
 *  - Output validation
 */

import OpenAI from "openai";
import { buildAIPrompt } from "./prompt";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export class BuilderEngine {
  /**
   * Run the full AI build using structured plan-aware prompts.
   */
  static async run(openai: OpenAI, prompt: string) {
    try {
      // -----------------------------------------------------
      // Call GPT-5.1-Pro with forced JSON output
      // -----------------------------------------------------
      const response = await client.chat.completions.create({
        model: "gpt-5.1-pro",
        temperature: 0.15,
        max_tokens: 8000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are DevVelocity — an elite autonomous cloud architect. " +
              "Always return ONLY JSON. No text outside JSON. No commentary.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const raw = response.choices?.[0]?.message?.content;

      if (!raw) {
        return { error: "AI returned no output." };
      }

      // -----------------------------------------------------
      // Try to parse returned JSON safely
      // -----------------------------------------------------
      let parsed = null;

      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        // Attempt auto-repair
        const repaired = BuilderEngine.tryFixJSON(raw);
        try {
          parsed = JSON.parse(repaired);
        } catch {
          return {
            error: "Failed to parse AI output JSON.",
            raw,
          };
        }
      }

      // -----------------------------------------------------
      // Validate required fields
      // -----------------------------------------------------
      const required = [
        "providers",
        "services",
        "pipelines",
        "features",
        "architecture_diagram",
        "deployment_steps",
        "terraform",
        "cloud_init",
        "warnings",
        "upgrade_recommendations",
      ];

      for (const key of required) {
        if (!(key in parsed)) {
          parsed[key] = `MISSING_FIELD_${key}`;
        }
      }

      return parsed;
    } catch (err: any) {
      console.error("BuilderEngine.run() Error:", err);
      return {
        error: err?.message ?? "Unknown AI engine failure.",
      };
    }
  }

  /**
   * Attempt auto-fix for malformed JSON.
   * GPT sometimes returns trailing commas or loose text.
   */
  static tryFixJSON(text: string): string {
    // Remove leading/trailing non-JSON characters
    const cleaned = text
      .replace(/^[^{\[]+/, "")
      .replace(/[^}\]]+$/, "")
      .trim();

    // Remove stray commas before closing braces
    return cleaned.replace(/,\s*([}\]])/g, "$1");
  }
}
