// app/api/files/diff/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { diffLines } from "diff";

/**
 * Diff Route
 * --------------------------------------------
 * Compares:
 *   - previous version content
 *   - new version content
 *
 * Restrictions:
 *   - Developer plan: ❌ No access
 *   - Startup/Team/Enterprise: ✅ Full access
 */

export async function POST(req: Request) {
  try {
    const { orgId, plan, oldContent, newContent } = await req.json();

    if (!orgId || !oldContent || !newContent) {
      return NextResponse.json(
        { error: "Missing orgId, oldContent, or newContent" },
        { status: 400 }
      );
    }

    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Diff Viewer is not available on the Developer plan. Upgrade required.",
        },
        { status: 403 }
      );
    }

    // -----------------------------
    // Generate Diff
    // -----------------------------
    const changes = diffLines(oldContent, newContent);

    const formatted = changes.map((c) => ({
      text: c.value,
      added: !!c.added,
      removed: !!c.removed,
    }));

    // -----------------------------
    // Optional: Log diff usage
    // -----------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from("usage_logs").insert({
      org_id: orgId,
      provider_api_calls: 0,
      pipelines_run: 0,
      build_minutes: 0,
      ai_builds: 0,
      ai_upgrades: 0,
      diffs_viewed: 1,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      diff: formatted,
    });
  } catch (err: any) {
    console.error("Diff route error:", err);
    return NextResponse.json(
      {
        error: err.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
