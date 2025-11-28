import { NextResponse } from "next/server";
import { runAIBuilder } from "@/ai-builder/router";

/**
 * API Route: /api/ai-builder
 *
 * Accepts the user's questionnaire answers
 * Runs the AI Builder pipeline
 * Returns the full infrastructure blueprint
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.answers) {
      return NextResponse.json(
        { error: "Missing 'answers' payload" },
        { status: 400 }
      );
    }

    // Run devvelocity AI build pipeline
    const result = await runAIBuilder(body.answers);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: result.plan,
      capabilities: result.capabilities,
      output: result.output,
    });
  } catch (err: any) {
    console.error("AI Builder API Error:", err);

    return NextResponse.json(
      {
        error: err.message || "AI builder failed unexpectedly",
      },
      { status: 500 }
    );
  }
}
