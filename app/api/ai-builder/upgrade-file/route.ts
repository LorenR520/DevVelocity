import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildAIPrompt } from "@/ai-builder/prompt";

export const runtime = "edge"; // Cloudflare Pages compatible

/**
 * This endpoint upgrades older architecture files, scripts, or templates.
 * It uses:
 *  - GPT-5.1-Pro (top tier)
 *  - Full plan constraints
 *  - Current AI builder logic
 *  - Automatic modernization + corrections
 */

export async function POST(req: Request) {
  try {
    const { fileContent, plan } = await req.json();

    if (!fileContent) {
      return NextResponse.json(
        { error: "Missing fileContent in request." },
        { status: 400 }
      );
    }

    // ------------------------------
    // 🧠 Build system prompt for upgrade
    // ------------------------------
    const systemPrompt = `
You are DevVelocity AI — GPT-5.1-Pro.

Your job is to UPGRADE an old architecture file by:

1. Updating it to **modern DevOps best practices**
2. Enforcing **plan tier constraints**
3. Checking for **deprecated features**
4. Suggesting **optional upgrades**
5. Improving:
   - cloud-init
   - docker-compose
   - pipelines
   - networking
   - automation
   - security
   - scaling
6. Keeping the customer's INFRA VALID and runnable

Rewrite the architecture fully and output **clean JSON**:

{
  "summary": "...",
  "architecture": "...",
  "cloud_init": "...",
  "docker_compose": "...",
  "pipelines": { ... },
  "networking": "...",
  "maintenance_plan": "...",
  "security_model": "...",
  "upgrade_recommendations": "...",
  "next_steps": "..."
}

Respond with complete JSON. Never output explanations.
Plan Tier: ${plan ?? "developer"}
`;

    // ------------------------------
    // 🤖 GPT-5.1-Pro call
    // ------------------------------
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-5.1-pro",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Here is the outdated file. Please modernize and upgrade it:\n\n${fileContent}`,
        },
      ],
      max_tokens: 8000,
      temperature: 0.25,
    });

    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Model returned empty output." },
        { status: 500 }
      );
    }

    let parsedOutput;
    try {
      parsedOutput = JSON.parse(content);
    } catch {
      parsedOutput = content; // fallback as raw text
    }

    return NextResponse.json(
      {
        ok: true,
        output: parsedOutput,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Upgrade-file error:", err);
    return NextResponse.json(
      {
        error:
          err?.message ??
          "Upgrade-file endpoint failed. Check your API key and JSON formatting.",
      },
      { status: 500 }
    );
  }
}
