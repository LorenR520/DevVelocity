// app/api/ai-builder/upgrade-file/route.ts

import { NextResponse } from "next/server";
import { runBuilderEngine } from "@/server/ai/builder-engine";

/**
 * POST /api/ai-builder/upgrade-file
 *
 * Accepts a pasted old DevVelocity file and attempts to:
 *  - parse it
 *  - validate structure
 *  - detect outdated configs
 *  - regenerate an updated architecture
 *  - enforce plan tier limits
 *  - suggest upgrades if needed
 */

export async function POST(req: Request) {
  try {
    const { fileContent, plan } = await req.json();

    if (!fileContent || typeof fileContent !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid fileContent." },
        { status: 400 }
      );
    }

    const safePlan = plan || "developer";

    // ---------------------------------------
    // STEP 1 — Try to parse the pasted JSON
    // ---------------------------------------
    let parsed;
    try {
      parsed = JSON.parse(fileContent);
    } catch {
      return NextResponse.json(
        {
          error:
            "The file you provided is not valid JSON. Please paste a full valid DevVelocity build file.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------
    // STEP 2 — Detect the structure (old versions allowed)
    // ---------------------------------------
    const coreSections = [
      "summary",
      "architecture",
      "cloud_init",
      "docker_compose",
      "pipelines",
      "security_model",
      "budget_projection",
      "maintenance_plan",
    ];

    const hasMinimumStructure = coreSections.some((k) => parsed[k]);

    if (!hasMinimumStructure) {
      return NextResponse.json(
        {
          error:
            "The file does not appear to be a DevVelocity-generated architecture file.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------
    // STEP 3 — Run the AI upgrade engine
    // ---------------------------------------
    const result = await runBuilderEngine({
      mode: "upgrade",
      oldFile: parsed,
      plan: safePlan,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // ---------------------------------------
    // STEP 4 — Return upgraded architecture
    // ---------------------------------------
    return NextResponse.json({
      ok: true,
      output: result.output,
      upgradeHints: result.upgradeHints || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
