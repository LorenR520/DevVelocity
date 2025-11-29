// app/api/ai-builder/route.ts

import { NextResponse } from "next/server";
import { runBuilderEngine } from "@/server/ai/builder-engine";

/**
 * AI Infrastructure Builder
 * ---------------------------------
 * Receives the questionnaire answers and
 * generates the infrastructure plan.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.answers) {
      return NextResponse.json(
        { error: "Missing answers payload" },
        { status: 400 }
      );
    }

    const plan = body.answers.plan ?? "developer";

    const result = await runBuilderEngine({
      mode: "build",
      answers: body.answers,
      plan,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "AI build failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      output: result.output,
      upgradeHints: result.upgradeHints || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
