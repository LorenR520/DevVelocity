/**
 * DevVelocity AI — Builder Engine
 * ------------------------------------------------------------
 * Responsible for:
 *  ✓ Sending prompt to GPT-5.1-Pro
 *  ✓ Enforcing JSON-only output
 *  ✓ Returning token counts
 *  ✓ Auto-repairing malformed AI JSON
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export class BuilderEngine {
  static async run(prompt: string) {
    try {
      // --------------------------------------------------------
      // 🔥 Call GPT-5.1-Pro with JSON-only enforced
      // --------------------------------------------------------
      const response = await openai.chat.completions.create({
        model: "gpt-5.1-pro",
        messages: [
          {
            role: "system",
            content:
              "You are DevVelocity's infrastructure builder AI. " +
              "Respond ONLY with valid JSON. No text before or after. " +
              "Do not explain yourself.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 7000,
        response_format: { type: "json_object" },
      });

      const content = response.choices?.[0]?.message?.content;

      if (!content) {
        return { error: "No AI output returned." };
      }

      // --------------------------------------------------------
      // 🧪 Attempt to parse AI JSON output
      // --------------------------------------------------------
      let parsed: any = null;

      try {
        parsed = JSON.parse(content);
      } catch (err) {
        // --------------------------------------------------------
        // ⚠️ Try fixing JSON using secondary repair prompt
        // --------------------------------------------------------
        const repaired = await BuilderEngine.repairJSON(content);
        if (!repaired.success) {
          return { error: "Malformed JSON and auto-repair failed.", raw: content };
        }
        parsed = repaired.json;
      }

      // --------------------------------------------------------
      // 📊 Extract token usage
      // --------------------------------------------------------
      const tokenUsage = {
        input: response.usage?.prompt_tokens ?? 1500,
        output: response.usage?.completion_tokens ?? 3500,
      };

      return {
        success: true,
        json: parsed,
        tokenUsage,
      };
    } catch (err: any) {
      console.error("Builder Engine Error:", err);
      return { error: err.message ?? "BuilderEngine failed." };
    }
  }

  /**
   * Attempts to repair malformed JSON using GPT-4 level model
   */
  static async repairJSON(badJSON: string) {
    try {
      const repairClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      });

      const repair = await repairClient.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: "Fix the following broken JSON and return ONLY repaired JSON.",
          },
          {
            role: "user",
            content: badJSON,
          },
        ],
        temperature: 0,
      });

      const output = repair.choices?.[0]?.message?.content;
      if (!output) {
        return { success: false };
      }

      return {
        success: true,
        json: JSON.parse(output),
      };
    } catch {
      return { success: false };
    }
  }
}
