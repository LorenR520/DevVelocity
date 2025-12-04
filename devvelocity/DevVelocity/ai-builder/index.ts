/**
 * DevVelocity AI Builder — Master Execution Engine
 *
 * This file:
 *  - Builds AI context (user answers + plan + provider docs)
 *  - Injects into the system prompt
 *  - Calls the AI model
 *  - Logs usage to Supabase (per-org)
 *  - Handles errors & tier enforcement
 */

import { buildContext } from "./context-builder";
import { buildAIPrompt } from "./prompt";
import { getAllowedCapabilities } from "./plan-logic";
import { createClient } from "@supabase/supabase-js";

export async function runAIBuild(answers: any, env: any) {
  try {
    // -----------------------------------------------------
    // 1) Build full AI context from all data sources
    // -----------------------------------------------------
    const context = await buildContext(answers, env);

    // -----------------------------------------------------
    // 2) Build the actual system prompt
    // -----------------------------------------------------
    const prompt = buildAIPrompt({
      ...answers,
      caps: context.tier_caps,
      provider_docs: context.provider_docs,
    });

    // -----------------------------------------------------
    // 3) Prepare OpenAI / ChatGPT client
    // -----------------------------------------------------
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        error:
          "Missing OpenAI API key. Add OPENAI_API_KEY to your environment variables.",
      };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: prompt,
          },
        ],
        temperature: 0.2,
      }),
    });

    const output = await response.json();

    if (!output.choices || !output.choices[0]) {
      return { error: "AI model returned no response." };
    }

    const parsed = safeJson(output.choices[0].message.content);

    // -----------------------------------------------------
    // 4) Log usage in Supabase (AI credits + history)
    // -----------------------------------------------------
    await logBuild(context, parsed, env);

    return { output: parsed };
  } catch (err: any) {
    console.error("AI Builder Error:", err);
    return { error: err.message || "AI Builder Engine Failed" };
  }
}

/**
 * Safely parse JSON from AI
 */
function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return {
      error: "Failed to parse AI output",
      raw: text,
    };
  }
}

/**
 * Log build request in Supabase
 */
async function logBuild(context: any, output: any, env: any) {
  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    await supabase.from("ai_build_logs").insert([
      {
        plan: context.user_input.plan_tier,
        providers: context.user_input.selected_providers,
        build_type: context.user_input.build_type,
        maintenance: context.user_input.maintenance_level,
        output,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (e) {
    console.error("Failed to log AI build:", e);
  }
}
