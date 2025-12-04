import { NextResponse } from "next/server";
import { runAIBuild } from "@/server/ai/builder-engine";

export const runtime = "edge";

/**
 * AI Builder — Generate New Infrastructure Plan
 * POST /api/ai-builder
 */
export async function POST(req: Request) {
  try {
    // Validate incoming JSON
    let body: any = null;
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    // Ensure answers exist
    if (!body || typeof body !== "object" || !body.answers) {
      return NextResponse.json(
        { error: "Missing required field: 'answers'." },
        { status: 400 }
      );
    }

    // Run AI Builder output using GPT-5.1-Pro
    let result;
    try {
      result = await runAIBuild(body.answers);
    } catch (err: any) {
      console.error("Builder Engine Failure:", err);
      return NextResponse.json(
        { error: "AI Builder Engine failed to process the request." },
        { status: 500 }
      );
    }

    // If builder returned a failure
    if (!result || result.error) {
      return NextResponse.json(
        { error: result?.error ?? "Unknown AI generation error." },
        { status: 500 }
      );
    }

    // Successful output
    return NextResponse.json(
      { output: result },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Unhandled AI Builder Error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown server error." },
      { status: 500 }
    );
  }
}
