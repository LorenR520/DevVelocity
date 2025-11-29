// app/api/ai-builder/route.ts

import { NextResponse } from "next/server";
import { runBuilderEngine } from "@/server/ai/builder-engine";

/**
 * DevVelocity AI Builder
 * POST /api/ai-builder
 *
 * Accepts:
 *   { answers: { ... }, plan: "developer|startup|team|enterprise" }
 *
 * Returns:
 *   { ok: true, output: {...} }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.answers) {
      return NextResponse.json(
        { error: "Missing answers payload." },
        { status: 400 }
      );
    }

    // Run main AI builder engine
    const result = await runBuilderEngine(body.answers);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      output: result.output,
      caps: result.caps,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unexpected server error: " + err.message },
      { status: 500 }
    );
  }
}
