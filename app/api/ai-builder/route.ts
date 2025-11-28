import { NextResponse } from "next/server";
import { buildAIPrompt } from "@/ai-builder/prompt";
import OpenAI from "openai";

// ------------------------------
// API Route: /api/ai-builder
// ------------------------------
export async function POST(req: Request) {
  try {
    const { answers } = await req.json();

    if (!answers) {
      return NextResponse.json(
        { error: "No answers received" },
        { status: 400 }
      );
    }

    // ---------------------------------------
    // Build prompt from questionnaire answers
    // ---------------------------------------
    const prompt = buildAIPrompt(answers);

    // ---------------------------------------
    // Initialize the AI model
    // (For now with OpenAI — pluggable later)
    // ---------------------------------------
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const completion = await client.chat.completions.create({
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

    const text = completion.choices[0].message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text, error: "Could not parse JSON output" };
    }

    return NextResponse.json({
      output: parsed,
    });
  } catch (err: any) {
    console.error("AI Builder API Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
