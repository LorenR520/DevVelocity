import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateDiff } from "@/server/files/diff-engine";

/**
 * DIFF API ROUTE
 * --------------------------------------
 * POST body:
 * {
 *   "fileId": string,
 *   "versionA": number | null,
 *   "versionB": number | null,
 *   "plan": string
 * }
 *
 * Behavior:
 * - Developer tier → blocked (upgrade required)
 * - If versionA/B missing → compares latest vs previous
 * - Returns structured diff for the UI component
 */

export async function POST(req: Request) {
  try {
    const { fileId, versionA, versionB, plan } = await req.json();

    if (!fileId) {
      return NextResponse.json(
        { error: "Missing fileId" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 1. Tier Enforcement — Developer cannot use diff system
    // ---------------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required",
          message: "Diff comparisons are available for Startup, Team, and Enterprise plans.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // 2. Supabase client (service role)
    // ---------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------------
    // 3. Load ALL versions of this file
    // ---------------------------------------------------------
    const { data: versions, error: versionErr } = await supabase
      .from("file_version_history")
      .select("id, new_content, previous_content, created_at")
      .eq("file_id", fileId)
      .order("created_at", { ascending: true });

    if (versionErr || !versions) {
      return NextResponse.json(
        { error: "Unable to load file version history." },
        { status: 500 }
      );
    }

    if (versions.length < 1) {
      return NextResponse.json(
        { error: "No versions found for this file." },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // 4. Determine which versions to compare
    // ---------------------------------------------------------
    const versionAIndex =
      typeof versionA === "number"
        ? versionA
        : versions.length - 2 >= 0
        ? versions.length - 2
        : 0;

    const versionBIndex =
      typeof versionB === "number"
        ? versionB
        : versions.length - 1;

    const base = versions[versionAIndex]?.new_content;
    const target = versions[versionBIndex]?.new_content;

    if (!base || !target) {
      return NextResponse.json(
        {
          error: "Invalid version indexes",
          message: "Requested versions do not exist.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 5. Generate the diff using your engine
    // ---------------------------------------------------------
    const diff = generateDiff(base, target);

    return NextResponse.json({
      success: true,
      fileId,
      versionA: versionAIndex,
      versionB: versionBIndex,
      diff,
    });
  } catch (err: any) {
    console.error("DIFF API Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
