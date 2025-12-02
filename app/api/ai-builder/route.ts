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
    // 🤖 Initialize OpenAI (GPT-4.1-Pro)
    // ------------------------------
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-pro", // ✔ your chosen model
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: "Generate my full architecture output now.",
        },
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });

    const output = completion.choices[0].message?.content || null;

    if (!output) {
      return NextResponse.json(
        { error: "Model produced no output." },
        { status: 500 }
      );
    }

    // ------------------------------
    // 🎉 Success
    // ------------------------------
    return NextResponse.json(
      {
        ok: true,
        output: JSON.parse(output), // GPT returns valid JSON
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("AI Builder Error:", err);

    return NextResponse.json(
      {
        error:
          err.message ??
          "AI Builder failed — ensure your OpenAI key and tier are configured.",
      },
      { status: 500 }
    );
  }
}
