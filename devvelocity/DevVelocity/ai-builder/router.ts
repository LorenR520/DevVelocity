/**
 * DevVelocity — AI Builder Router
 *
 * This is the MASTER orchestrator.
 * It:
 *  - receives validated answers
 *  - applies tier gating (plan-logic.ts)
 *  - builds the AI prompt (prompt.ts)
 *  - generates maintenance plan (maintenance-generator.ts)
 *  - injects cloud intelligence (cloud-providers.ts)
 *  - injects network design (networking.ts)
 *  - formats the final payload
 *  - sends prompt to LLM (OpenAI or Anthropic)
 */

import { buildAIPrompt } from "./prompt";
import { getAllowedCapabilities } from "./plan-logic";
import { buildNetworkingLayer } from "./networking";
import { recommendCloudProvider } from "./cloud-providers";
import { generateMaintenancePlan } from "./maintenance-generator";

// --- Choose your LLM engine ---
const MODEL = process.env.AI_MODEL || "gpt-4o-mini"; // default low-cost tier

// Generic LLM call (supports OpenAI, Anthropic, Groq, etc.)
async function callAI(systemPrompt: string) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Missing API key for AI provider");
  }

  // --- If using OpenAI ---
  if (process.env.OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate architecture now." }
        ],
        temperature: 0.1,
        max_tokens: 6000,
      }),
    });

    const json = await res.json();
    return json.choices?.[0]?.message?.content;
  }

  // --- If Anthropic ---
  if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 6000,
        messages: [
          { role: "user", content: systemPrompt }
        ],
      }),
    });

    const json = await res.json();
    return json.content?.[0]?.text;
  }

  throw new Error("No supported LLM provider found.");
}

// ------------------------------------------------------------
// MAIN EXECUTION ENTRY — BUILD INFRASTRUCTURE OUTPUT
// ------------------------------------------------------------

export async function runAIBuild(answers: any) {

  // 1️⃣ Tier-limited capabilities
  const caps = getAllowedCapabilities(answers.plan);

  // 2️⃣ Cloud intelligence
  const cloudRecommendation = recommendCloudProvider(answers);

  // 3️⃣ Networking layer
  const networking = buildNetworkingLayer(answers);

  // 4️⃣ Maintenance layer
  const maintenance = generateMaintenancePlan(answers);

  // 5️⃣ Build full system-level prompt
  const prompt = buildAIPrompt({
    ...answers,
    caps,
    cloudRecommendation,
    networking,
    maintenance,
  });

  // 6️⃣ Run the LLM
  const raw = await callAI(prompt);

  // 7️⃣ Safely parse JSON output (LLMs sometimes add text)
  let parsed: any = null;

  try {
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
  } catch (err) {
    console.error("Failed to parse AI output:", err);
    parsed = {
      error: "Malformed output from AI model",
      raw,
    };
  }

  // 8️⃣ Final rich output payload
  return {
    plan: answers.plan,
    cloudRecommendation,
    networking,
    maintenance,
    caps,
    output: parsed,
  };
}
