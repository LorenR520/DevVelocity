import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildUpgradePrompt } from "@/ai-builder/upgrade-prompt";
import { rateLimitCheck } from "@/server/rate-limit";

// ----------------------------------
// 🔐 GPT-5.1-PRO Client
// ----------------------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ----------------------------------
// POST /api/ai-builder/upgrade-file
// ----------------------------------
export async function POST(req: Request) {
  try {
    const { fileContent, plan } = await req.json();

    if (!fileContent) {
      return NextResponse.json(
        { error: "Missing file content to upgrade." },
        { status: 400 }
      );
    }

    // ----------------------------------
    // 🔐 Rate Limit
    // ----------------------------------
    const rateExceeded = await rateLimitCheck("upgrade-file");
    if (rateExceeded) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    // ----------------------------------
    // 🧠 Build Upgrade Prompt
    // ----------------------------------
    const systemPrompt = buildUpgradePrompt(fileContent, plan);

    // ----------------------------------
    // 🤖 GPT-5.1-PRO Call
    // ----------------------------------
    const response = await client.chat.completions.create({
      model: "gpt-5.1-pro",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Analyze the pasted file and generate an updated version following modern DevOps architecture and JSON output format.",
        },
      ],
      temperature: 0.25,
      max_tokens: 9000,
      response_format: { type: "json_object" },
    });

    // ----------------------------------
    // Parse JSON Output
    // ----------------------------------
    let output: any = null;

    try {
      output = JSON.parse(response.choices[0].message.content || "{}");
    } catch (err) {
      return NextResponse.json(
        { error: "AI returned invalid JSON." },
        { status: 500 }
      );
    }

    // ----------------------------------
    // Success
    // ----------------------------------
    return NextResponse.json(
      { success: true, output },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}
