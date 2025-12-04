// server/ai/file-upgrader.ts

import OpenAI from "openai";
import { buildUpgradePrompt } from "@/ai-builder/prompt";

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ Missing OPENAI_API_KEY — upgrade system will not work.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Upgrade an existing saved architecture file.
 * This:
 *  - Reads their old JSON
 *  - Compares to latest DevVelocity standards
 *  - Fixes broken/legacy fields
 *  - Suggests upgrades if they exceed plan limits
 *  - Returns a new JSON file to save
 */
export async function upgradeArchitectureFile(oldFile: any, plan: string) {
  try {
    const prompt = buildUpgradePrompt(oldFile, plan);

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 6000,
    });

    const output = response.choices?.[0]?.message?.content;

    if (!output) {
      return { error: "No AI output returned" };
    }

    let parsed;
    try {
      parsed = JSON.parse(output);
    } catch (err) {
      return {
        error: "Failed to parse upgraded JSON",
        raw: output,
      };
    }

    return {
      upgraded: parsed,
    };
  } catch (err: any) {
    console.error("File Upgrader Error:", err);
    return {
      error: err.message || "Unknown error",
    };
  }
}
