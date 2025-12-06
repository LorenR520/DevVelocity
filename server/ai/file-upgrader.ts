// server/ai/file-upgrader.ts
/**
 * DevVelocity AI — Architecture File Upgrader (Production Ready)
 * ----------------------------------------------------------------
 * Responsibilities:
 *  ✓ Read old JSON architecture file
 *  ✓ Normalize + modernize structure
 *  ✓ Apply changes based on the user's plan tier
 *  ✓ Ensure output complies with DevVelocity’s 2025 standard schema
 *  ✓ Return upgraded JSON safely (NEVER breaks the UI)
 */

import OpenAI from "openai";
import { buildUpgradePrompt } from "./prompt";  // FIXED CLEAN PATHING

// Initialize GPT-5.1 client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function upgradeArchitectureFile(oldFile: any, plan: string) {
  try {
    // -----------------------------------------------------
    // 1. Build the upgrade prompt (plan-aware)
    // -----------------------------------------------------
    const prompt = buildUpgradePrompt(oldFile, plan);

    // -----------------------------------------------------
    // 2. GPT-5.1 request (new Responses API)
    // -----------------------------------------------------
    const response = await client.responses.create({
      model: "gpt-5.1", // GPT-5.1 is your default AI engine
      input: prompt,
      max_output_tokens: 6000,
      temperature: 0.2,
      reasoning: { effort: "medium" },
    });

    const output = response.output_text;

    if (!output) {
      return { error: "No AI output was generated." };
    }

    // -----------------------------------------------------
    // 3. Attempt to parse returned JSON safely
    // -----------------------------------------------------
    let parsed;

    try {
      parsed = JSON.parse(output);
    } catch (err) {
      // Force the UI to stay operational
      return {
        error: "Failed to parse upgraded JSON.",
        raw: output,
      };
    }

    // -----------------------------------------------------
    // 4. SUCCESS — Upgraded architecture file
    // -----------------------------------------------------
    return {
      upgraded: parsed,
      raw: output,
      message: "Architecture file successfully upgraded.",
    };
  } catch (err: any) {
    console.error("File Upgrader Error:", err);
    return {
      error: err.message ?? "Unknown file upgrade error",
    };
  }
}
