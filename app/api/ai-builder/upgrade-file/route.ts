// app/api/ai-builder/upgrade-file/route.ts

import { NextResponse } from "next/server";
import { runBuilderEngine } from "@/server/ai/builder-engine";

/**
 * POST /api/ai-builder/upgrade-file
 *
 * Accepts:
 *   {
 *     fileText: "<yaml, json, cloud-init, docker-compose...>",
 *     plan: "developer|startup|team|enterprise"
 *   }
 *
 * Returns:
 *   {
 *     ok: true,
 *     upgraded: "new improved file",
 *     suggestions: [...]
 *   }
 */

export async function POST(req: Request) {
  try {
    const { fileText, plan } = await req.json();

    if (!fileText) {
      return NextResponse.json(
        { error: "Missing fileText input." },
        { status: 400 }
      );
    }

    // Send through Builder Engine under "upgrade mode"
    const result = await runBuilderEngine({
      mode: "upgrade",
      fileText,
      plan: plan || "developer",
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      upgraded: result.output.upgraded,
      suggestions: result.output.suggestions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
