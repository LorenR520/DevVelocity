// server/ai/builder-engine.ts

/**
 * DevVelocity AI — Builder Engine
 * ------------------------------------------------------------
 * Executes:
 *  ✓ GPT-5.1-Pro JSON-based infrastructure generation
 *  ✓ Deterministic schema mapping
 *  ✓ Validation + sanitization
 *  ✓ Null-fill for incomplete fields
 *  ✓ Error reporting for malformed AI output
 */

import OpenAI from "openai";
import { validateArchitectureShape } from "./validators/schema-validator";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export class BuilderEngine {
  /**
   * Run main AI builder flow.
   */
  static async run(openaiClient: any, prompt: string) {
    try {
      // -----------------------------
      // 1. Request structured JSON
      // -----------------------------
      const response = await openaiClient.chat.completions.create({
        model: "gpt-5.1-pro",
        temperature: 0.1,
        max_tokens: 8000,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content:
              "Respond ONLY in valid JSON. No text, no markdown, no explanations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const raw = response.choices?.[0]?.message?.content;

      if (!raw) {
        return {
          error: "AI Builder returned empty output.",
        };
      }

      // -----------------------------
      // 2. Parse JSON safely
      // -----------------------------
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        return {
          error: "Malformed AI JSON output.",
          raw,
        };
      }

      // -----------------------------
      // 3. Validate against schema
      // -----------------------------
      const validated = validateArchitectureShape(parsed);

      if (!validated.valid) {
        return {
          error: "Output failed schema validation.",
          details: validated.issues,
          raw: parsed,
        };
      }

      // -----------------------------
      // 4. Return sanitized output
      // -----------------------------
      return {
        success: true,
        architecture: validated.cleaned,
      };
    } catch (err: any) {
      console.error("AI Builder Engine Error:", err);
      return {
        error: err.message ?? "AI Builder Engine encountered an error.",
      };
    }
  }
}
