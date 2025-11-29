// server/ai/builder-engine.ts

import OpenAI from "openai";
import { buildAIPrompt } from "@/ai-builder/prompt";

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ Missing OPENAI_API_KEY — AI Builder will fail until set.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function runAIBuild(answers: any) {
  try {
    // Build full DevVelocity system prompt
    const prompt = buildAIPrompt(answers);

    // Call OpenAI Completion
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

    const msg = response.choices?.[0]?.message?.content;

    if (!msg) {
      return {
        error: "AI returned no output",
      };
    }

    // AI returns JSON — parse and return
    let parsed;
    try {
      parsed = JSON.parse(msg);
    } catch (err) {
      return {
        error: "Failed to parse AI output as JSON",
        raw: msg,
      };
    }

    return {
      output: parsed,
    };
  } catch (err: any) {
    console.error("AI Builder Engine Error:", err);
    return {
      error: err.message || "Unknown AI error",
    };
  }
}
