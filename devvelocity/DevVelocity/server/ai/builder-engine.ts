// server/ai/builder-engine.ts

import OpenAI from "openai";
import { buildAIPrompt } from "@/ai-builder/prompt";

/**
 * DevVelocity AI Builder Engine (GPT-5.1-Pro)
 * ------------------------------------------
 * Generates:
 *  - Architecture
 *  - Cloud-init
 *  - Docker Compose
 *  - Pipelines
 *  - SSO/Security models
 *  - Budget projections
 *  - Upgrade recommendations
 */

export async function runAIBuild(answers: Record<string, any>) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  const systemPrompt = buildAIPrompt(answers);

  // ------------------------------------------
  // GPT-5.1-Pro Call (new API)
  // ------------------------------------------
  const response = await client.responses.create({
    model: "gpt-5.1-pro",
    temperature: 0.25,
    max_output_tokens: 6000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content:
          "Generate the complete infrastructure output in the required JSON schema.",
      },
    ],
  });

  const raw = response.output_text;
  if (!raw) throw new Error("AI returned empty output.");

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("Invalid JSON from AI:", raw);
    throw new Error("AI output was not valid JSON.");
  }

  return parsed;
}

/**
 * Upgrade Engine — GPT-5.1-Pro
 * ------------------------------------------
 * Takes an OLD config file and:
 *  - updates to new cloud best practices
 *  - enforces tier limits
 *  - modernizes templates
 *  - warns about deprecated features
 *  - suggests upgrades ONLY if needed
 */
export async function runAIUpgrade(existingConfig: string, plan: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  const upgradePrompt = `
You are the DevVelocity **AI Upgrade Engine** (GPT-5.1-Pro).

Your task:
  - Analyze the existing infrastructure config
  - Modernize it using 2025 best practices
  - Enforce the user's plan tier: ${plan}
  - Fix deprecated keys
  - Optimize cloud-init
  - Upgrade containerization & pipelines
  - Suggest improvements ONLY when needed
  - Keep JSON structure fully valid

Return JSON EXACTLY as:

{
  "updated_config": { ... },
  "changes": "bullet list of improvements",
  "upgrade_suggestions": "if plan upgrade is recommended",
  "warnings": "if any deprecated or risky patterns found"
}

Here is the old config:
\`\`\`json
${existingConfig}
\`\`\`
`;

  const response = await client.responses.create({
    model: "gpt-5.1-pro",
    temperature: 0.2,
    max_output_tokens: 5000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: upgradePrompt },
      { role: "user", content: "Analyze and upgrade this config now." },
    ],
  });

  const raw = response.output_text;
  if (!raw) throw new Error("AI returned no output.");

  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("Upgrade JSON parsing failed:", raw);
    throw new Error("Upgrade output was invalid JSON.");
  }

  return parsed;
}
