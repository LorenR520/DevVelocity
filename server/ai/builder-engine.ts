// server/ai/builder-engine.ts

/**
 * DevVelocity — AI Builder Engine
 * ---------------------------------------------------------
 * Responsible for:
 *  ✓ Sending builder prompts to GPT-5.1-Pro
 *  ✓ Enforcing JSON-only responses
 *  ✓ Repairing malformed outputs
 *  ✓ Normalizing the final architecture object
 *  ✓ Returning a stable, predictable structure
 */

import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ Missing OPENAI_API_KEY — AI Builder disabled.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export class BuilderEngine {
  /**
   * Main run() method.
   * Executes GPT-5.1-Pro with deterministic output.
   */
  static async run(prompt: string) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-5.1-pro",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `
You are DevVelocity — a deterministic cloud automation engine.
Return ONLY valid JSON.
If unsure, make a reasonable assumption.
Never apologize. Never add explanations.
            `,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 8000,
      });

      const raw = completion.choices?.[0]?.message?.content;

      if (!raw) {
        return {
          error: "No AI output received.",
        };
      }

      // -------------------------------------------------
      // Ensure valid JSON
      // -------------------------------------------------
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        // Attempt auto-repair
        parsed = BuilderEngine.repairMalformedJSON(raw);
      }

      if (!parsed) {
        return {
          error: "AI returned invalid JSON.",
          raw,
        };
      }

      // -------------------------------------------------
      // Normalize output structure (guaranteed)
      // -------------------------------------------------
      return BuilderEngine.normalize(parsed);
    } catch (err: any) {
      console.error("AI Builder Engine Error:", err);
      return {
        error: err.message ?? "Unknown AI builder error",
      };
    }
  }

  /**
   * Attempt to salvage malformed JSON.
   */
  static repairMalformedJSON(raw: string) {
    try {
      const fixed = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }

  /**
   * Ensure structure matches DevVelocity’s schema.
   * (Prevents frontend crashes.)
   */
  static normalize(obj: any) {
    return {
      summary: obj.summary ?? "",
      architecture: obj.architecture ?? {},
      components: Array.isArray(obj.components) ? obj.components : [],
      deployments: obj.deployments ?? {},
      estimated_cost: obj.estimated_cost ?? {},
      provider_count: obj.provider_count ?? 1,
      metadata: obj.metadata ?? {},
    };
  }
}
