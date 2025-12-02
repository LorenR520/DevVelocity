import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildAIPrompt } from "@/ai-builder/prompt";
import { rateLimitCheck } from "@/server/rate-limit";

// ------------------------------
// 🔐 GPT-5.1-PRO Client
// ------------------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ------------------------------
// POST /api/ai-builder
// ------------------------------
export async function POST(req: Request) {
  try {
    const { answers } = await req.json();

    if (!answers) {
      return NextResponse.json(
        { error: "Missing questionnaire answers." },
        { status: 400 }
      );
    }

    // ------------------------------
    // 🔐 Rate Limit
    // ------------------------------
    const rateExceeded = await rateLimitCheck("ai-builder");
    if (rateExceeded) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    // ------------------------------
    // 🧠 Build System Prompt
    // ------------------------------
    const systemPrompt = buildAIPrompt(answers);

    // ------------------------------
    // 🤖 GPT-5.1-PRO Call
    // ------------------------------
    const response = await client.chat.completions.create({
      model: "gpt-5.1-pro",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Generate my complete infrastructure architecture following the JSON format.",
        },
      ],
      temperature: 0.2,
      max_tokens: 9000,
      response_format: { type: "json_object" },
    });

    // ------------------------------
    // Parse JSON Output
    // ------------------------------
    let output: any = null;
    try {
      output = JSON.parse(response.choices[0].message.content || "{}");
    } catch (err) {
      return NextResponse.json(
        { error: "AI returned invalid JSON." },
        { status: 500 }
      );
    }

    // ------------------------------
    // Success Response
    // ------------------------------
    return NextResponse.json(
      {
        success: true,
        output,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}
