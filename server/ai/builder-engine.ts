import OpenAI from "openai";
import { buildAIPrompt } from "@/ai-builder/prompt";

export const runtime = "edge";

/**
 * DevVelocity — AI Builder Engine
 * -----------------------------------
 * This file powers the AI generation for:
 *  - new infrastructure builds
 *  - automation generation
 *  - cloud-init
 *  - docker-compose
 *  - pipelines
 *  - maintenance plans
 *  - networking
 *  - security
 *  - upgrade recommendations
 *
 * Model: GPT-5.1-Pro (full unrestricted capabilities)
 */

export async function generateArchitecture(answers: Record<string, any>) {
  try {
    // Validate answers exist
    if (!answers || Object.keys(answers).length === 0) {
      throw new Error("Missing answers payload for AI Builder.");
    }

    // Construct system prompt based on user answers
    const systemPrompt = buildAIPrompt(answers);

    // Initialize GPT-5.1-Pro client
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    // Run the model
    const completion = await client.chat.completions.create({
      model: "gpt-5.1-pro",
      temperature: 0.15,
      max_tokens: 9000,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: "Generate the full architecture output now.",
        },
      ],
    });

    const result = completion.choices?.[0]?.message?.content;

    if (!result) {
      throw new Error("Empty model output.");
    }

    // Try parsing into JSON (preferred format)
    try {
      const parsed = JSON.parse(result);
      return parsed;
    } catch {
      // fallback raw output — better than failing
      return result;
    }
  } catch (err: any) {
    console.error("AI Builder Engine Error:", err);

    return {
      error: err?.message ?? "Unknown AI engine error",
    };
  }
}
