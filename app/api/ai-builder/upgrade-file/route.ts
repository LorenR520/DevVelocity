// app/api/ai-builder/upgrade-file/route.ts

import { NextResponse } from "next/server";
import { runBuilderEngine } from "@/server/ai/builder-engine";

/**
 * AI File Upgrade Endpoint
 * -------------------------------------------------------
 * Users paste an OLD infrastructure file (JSON).
 * We:
 *   - validate it
 *   - run tier checks
 *   - compare to latest template models
 *   - generate an improved + updated file
 *   - recommend plan upgrades if needed
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { file, plan } = body;

    if (!file) {
      return NextResponse.json(
        { error: "Missing file contents for upgrade" },
        { status: 400 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { error: "Missing plan tier" },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // Run upgrade mode inside the AI builder engine
    // ---------------------------------------------
    const result = await runBuilderEngine({
      mode: "upgrade",
      file,
      plan,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Upgrade failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      updated: result.output,        // New file
      upgradeHints: result.upgradeHints || [], // Upsell suggestions
      diff: result.diff || null,     // Optional: structured diff
    });
  } catch (err: any) {
    console.error("Upgrade file error:", err);
    return NextResponse.json(
      {
        error: err.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
