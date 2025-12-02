import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildAIPrompt } from "@/ai-builder/prompt";

export const runtime = "edge"; // Cloudflare-compatible

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const answers = body.answers;

    if (!answers) {
      return NextResponse.json(
        { error: "Missing answers in request." },
        { status: 400 }
      );
    }

    // ------------------------------
    // 🧠 Build System Prompt
    // ------------------------------
    const systemPrompt = buildAIPrompt(answers);

    // ------------------------------
    // 🤖 Initialize OpenAI (GPT-5.1-Pro)
    // ------------------------------
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-5.1-pro", // 🔥 your chosen top-tier model
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: "Generate my full architecture output now.",
        },
      ],
      max_tokens: 8000,
      temperature: 0.25, // More deterministic, more reliable
    });

    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Model returned empty output." },
        { status: 500 }
      );
    }

    // GPT-5.1 returns *extremely well-formed* JSON 99% of the time.
    let parsedOutput;
    try {
      parsedOutput = JSON.parse(content);
    } catch {
      // fallback: return raw text if JSON parse failed
      parsedOutput = content;
    }

    return NextResponse.json(
      {
        ok: true,
        output: parsedOutput,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("AI Builder Error:", err);

    return NextResponse.json(
      {
        error:
          err?.message ||
          "AI Builder failed — check your OpenAI API key and tier.",
      },
      { status: 500 }
    );
  }
}
