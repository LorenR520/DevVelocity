import { buildAIPrompt } from "@/ai-builder/prompt";
import { getAllowedCapabilities } from "@/ai-builder/plan-logic";
import OpenAI from "openai";

/**
 * Core AI Engine for DevVelocity
 * This takes user answers → validates by plan → generates infra plan
 */

export async function runAIBuild(answers: Record<number, any>) {
  try {
    // -----------------------------
    // 1. Validate tier limitations
    // -----------------------------
    const plan = answers.plan ?? "developer";
    const caps = getAllowedCapabilities(plan);

    // Attach validated capabilities for runtime context
    answers._validatedCapabilities = caps;

    // -----------------------------
    // 2. Build the system prompt
    // -----------------------------
    const systemPrompt = buildAIPrompt(answers);

    // -----------------------------
    // 3. Initialize OpenAI client
    // -----------------------------
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    // -----------------------------
    // 4. Call the model
    // -----------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // best value/speed model for infra output
      temperature: 0.2,
      max_tokens: 3500,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
      ],
    });

    const raw = completion.choices[0].message?.content?.trim() ?? "";

    // -----------------------------
    // 5. Parse JSON output safely
    // -----------------------------
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("❌ Failed to parse JSON:", err, raw);

      return {
        error: "AI output was not valid JSON. Please try again.",
        raw,
      };
    }

    // -----------------------------
    // 6. Final Output
    // -----------------------------
    return {
      success: true,
      output: parsed,
    };
  } catch (err: any) {
    console.error("❌ AI Builder Engine Error:", err);

    return {
      error: err.message ?? "Unexpected error running AI Builder.",
    };
  }
}
