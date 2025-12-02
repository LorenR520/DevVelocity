// server/ai/builder-engine.ts

import OpenAI from "openai";
import { buildAIPrompt } from "@/ai-builder/prompt";

/**
 * DevVelocity AI Builder Engine
 * ------------------------------
 * Uses GPT-5.1-Pro to generate:
 *  - Cloud architecture
 *  - Cloud-init
 *  - Docker Compose
 *  - Pipelines
 *  - Security + SSO models
 *  - Budget analysis
 *  - Upgrade recommendations
 */

export async function runAIBuild(answers: Record<string, any>) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  // ------------------------------------------
  // Initialize GPT-5.1-Pro Client
  // ------------------------------------------
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Produce the master prompt
  const prompt = buildAIPrompt(answers);

  // ------------------------------------------
  // Call GPT-5.1-Pro
  // ------------------------------------------
  const completion = await openai.chat.completions.create({
    model: "gpt-5.1-pro",
    temperature: 0.2,
    max_tokens: 6000,
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content:
          "Generate the complete infrastructure output in the required JSON structure.",
      },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content;

  if (!raw) {
    throw new Error("AI returned no data.");
  }

  // ------------------------------------------
  // Attempt to parse JSON output
  // ------------------------------------------
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("JSON parsing failed:", err);
    throw new Error("AI output was not valid JSON.");
  }

  return parsed;
}

/**
 * Upgrade Engine — re-evaluates an existing saved infrastructure file
 * and makes updated recommendations based on:
 *  - new cloud best practices
 *  - updated security rules
 *  - user's current plan tier
 *  - optimization opportunities
 */
export async function runAIUpgrade(existingConfig: string, plan: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `
You are DevVelocity AI Upgrade Engine.
The user has provided an **existing infrastructure file** that may be outdated.

Your job:
  - Analyze it
  - Modernize it
  - Enforce tier restrictions
  - Suggest optimizations
  - Identify deprecated features
  - Recommend an upgrade ONLY if needed
  - Maintain full JSON structure

User Plan: ${plan}

Return JSON EXACTLY in this structure:

{
  "updated_config": { ...updated JSON... },
  "changes": "... list of what changed ...",
  "upgrade_suggestions": "... if any ...",
  "warnings": "... if any ..."
}

Here is the user's existing config:
\`\`\`json
${existingConfig}
\`\`\`
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.1-pro",
    temperature: 0.2,
    max_tokens: 5000,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: "Analyze and upgrade this config now." },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error("Upgrade engine returned no data.");
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("JSON parse error:", raw);
    throw new Error("Upgrade output was invalid JSON.");
  }

  return parsed;
}
