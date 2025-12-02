import { NextResponse } from "next/server";
import { generateArchitecture } from "@/server/ai/builder-engine";

export const runtime = "edge";

/**
 * DevVelocity — AI Builder API
 * -------------------------------------
 * Receives the questionnaire answers from the UI,
 * applies tier logic in the engine,
 * and returns a full GPT-5.1-Pro architecture plan.
 */

export async function POST(req: Request) {
  try {
    const { answers } = await req.json();

    if (!answers) {
      return NextResponse.json(
        { error: "Missing answers payload." },
        { status: 400 }
      );
    }

    // Run AI Builder Engine → GPT-5.1-Pro
    const output = await generateArchitecture(answers);

    if (output?.error) {
      return NextResponse.json(
        { error: output.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ output }, { status: 200 });
  } catch (err: any) {
    console.error("AI Builder Route Error:", err);

    return NextResponse.json(
      { error: err?.message ?? "AI Builder failed" },
      { status: 500 }
    );
  }
}
