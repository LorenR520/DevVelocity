// server/ai/builder-engine.ts

import OpenAI from "openai";
import { buildAIPrompt } from "@/ai-builder/prompt";
import { getAllowedCapabilities } from "@/ai-builder/plan-logic";

// Cloudflare supports the official OpenAI client:
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Main entrypoint for generating infrastructure builds.
 * This is the core engine behind DevVelocity AI.
 */
export async function runBuilderEngine(answers: Record<number, any>) {
  try {
    // -----------------------------------------------
    // 1. Enforce plan limits
    // -----------------------------------------------
    const plan = answers.plan ?? "developer";
    const caps = getAllowedCapabilities(plan);

    // -----------------------------------------------
    // 2. Build the system prompt
    // -----------------------------------------------
    const systemPrompt = buildAIPrompt(answers);

    // -----------------------------------------------
    // 3. Call OpenAI with full JSON mode
    // -----------------------------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4.1", // Cloudflare-compatible model
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Generate a full infrastructure plan using my inputs: ${JSON.stringify(
            answers
          )}`,
        },
      ],
    });

    const text = completion.choices[0].message?.content;

    if (!text) {
      return {
        ok: false,
        error: "AI returned no content.",
      };
    }

    // -----------------------------------------------
    // 4. Parse JSON (model is instructed to output valid JSON)
    // -----------------------------------------------
    let output: any = null;
    try {
      output = JSON.parse(text);
    } catch (err: any) {
      return {
        ok: false,
        error: "Invalid JSON returned from AI.",
        raw: text,
      };
    }

    // -----------------------------------------------
    // 5. Return result to API route
    // -----------------------------------------------
    return {
      ok: true,
      output,
      caps,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message,
    };
  }
}
