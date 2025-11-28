// app/api/ai-builder/route.ts

import { NextResponse } from "next/server";
import { buildAIPrompt } from "@/ai-builder/prompt";
import { getAllowedCapabilities } from "@/ai-builder/plan-logic";

// If using OpenAI:
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const answers = body.answers;

    if (!answers) {
      return NextResponse.json(
        { error: "Missing answers payload" },
        { status: 400 }
      );
    }

    const plan = answers.plan ?? "developer";

    // ----------------------------------------
    // 🔐 Enforce tier limitations safely
    // ----------------------------------------
    const caps = getAllowedCapabilities(plan);

    // Protects backend from invalid user-selected values
    function sanitize() {
      const safe = { ...answers };

      // Providers constraint
      if (caps.providers !== "unlimited") {
        if (Array.isArray(answers[2])) {
          safe[2] = answers[2].slice(0, caps.providers);
        }
      }

      // Automation constraint
      if (answers[1] && caps.automation.ci_cd === "basic") {
        safe[1] = "basic";
      }

      // Security constraint
      if (answers[5] && answers[5] !== caps.sso) {
        safe[5] = caps.sso;
      }

      return safe;
    }

    const safeAnswers = sanitize();

    // ----------------------------------------
    // 🧠 Build Master System Prompt
    // ----------------------------------------
    const systemPrompt = buildAIPrompt(safeAnswers);

    // ----------------------------------------
    // 🤖 Run AI Model
    // ----------------------------------------
    const completion = await client.responses.create({
      model: "gpt-4.1",
      reasoning: { effort: "medium" },
      input: systemPrompt,
      max_output_tokens: 4000,
      temperature: 0.1,
    });

    const output = completion.output_text;

    // Try to parse JSON safely
    let parsed = null;
    try {
      parsed = JSON.parse(output);
    } catch (e) {
      // fallback → wrap into JSON
      parsed = { raw: output };
    }

    return NextResponse.json({
      success: true,
      output: parsed,
      tier: plan,
      caps,
    });
  } catch (err: any) {
    console.error("AI Builder Route Error:", err);

    return NextResponse.json(
      {
        error: err.message ?? "Internal AI Builder Error",
      },
      { status: 500 }
    );
  }
}
