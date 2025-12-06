/**
 * DevVelocity AI Builder Engine
 * -----------------------------------------------------------
 * Responsibilities:
 *  ✓ Call GPT-5.1-Pro with our custom prompt
 *  ✓ Ensure strict JSON output (auto-correct if malformed)
 *  ✓ Protect against hallucination
 *  ✓ Validate component structure
 *  ✓ Return stable output to UI + API
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export class BuilderEngine {
  /**
   * Run the AI Builder on a completed Prompt
   */
  static async run(prompt: string) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5.1-pro",
        temperature: 0.1,
        max_tokens: 8000,
        messages: [
          {
            role: "system",
            content: `
You are DevVelocity: a deterministic infrastructure architect.
ALWAYS return ONLY a JSON object.
NEVER include explanations outside the JSON.
            `,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      let raw = response.choices?.[0]?.message?.content ?? "";

      // ---------------------------------------------------------
      // Attempt to parse JSON. If it fails — fix automatically.
      // ---------------------------------------------------------
      let parsed = BuilderEngine.safeParseJSON(raw);

      if (!parsed.valid) {
        const fixed = await BuilderEngine.repairJSON(raw);

        if (!fixed.valid) {
          return {
            error: "Malformed JSON could not be repaired.",
            raw,
          };
        }

        parsed = fixed;
      }

      return parsed.json;
    } catch (err: any) {
      console.error("AI Builder Engine Error:", err);
      return {
        error: err.message ?? "AI Builder Engine failed",
      };
    }
  }

  /**
   * Try parsing JSON safely
   */
  static safeParseJSON(text: string) {
    try {
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");

      if (jsonStart === -1 || jsonEnd === -1) {
        return { valid: false };
      }

      const sliced = text.slice(jsonStart, jsonEnd + 1);

      return { valid: true, json: JSON.parse(sliced) };
    } catch {
      return { valid: false };
    }
  }

  /**
   * If JSON is broken → ask GPT to repair it
   */
  static async repairJSON(brokenText: string) {
    try {
      const result = await openai.chat.completions.create({
        model: "gpt-5.1-pro",
        temperature: 0.0,
        max_tokens: 4000,
        messages: [
          {
            role: "system",
            content: `
You are a JSON repair engine.
Your ONLY job is to output valid JSON extracted and corrected from malformed AI output.
Return ONLY valid JSON.
            `,
          },
          {
            role: "user",
            content: brokenText,
          },
        ],
      });

      const fixed = result.choices?.[0]?.message?.content ?? "";
      const parsed = BuilderEngine.safeParseJSON(fixed);

      return parsed.valid ? parsed : { valid: false };
    } catch (err) {
      return { valid: false };
    }
  }
}
