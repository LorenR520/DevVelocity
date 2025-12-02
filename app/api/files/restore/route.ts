import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * RESTORE FILE VERSION
 *
 * Rules:
 * - Developer tier cannot restore older versions.
 * - Must check org ownership.
 * - Creates a new version entry after restoring.
 * - Writes usage_logs entry for billing/usage tracking.
 * - Returns the restored content for UI update.
 */

export async function POST(req: Request) {
  try {
    const { fileId, versionId, plan, orgId, userId } = await req.json();

    if (!fileId || !versionId || !plan || !orgId || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // 🔒 Developer tier cannot restore files
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Your plan does not include restoring previous versions.",
          upgrade: true,
          upgradeMessage:
            "Upgrade to Startup or higher to enable version restore.",
        },
        { status: 403 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // 1. Load the version to restore
    // --------------------------------------------------
    const { data: version, error: versionErr } = await supabase
      .from("file_version_history")
      .select("*")
      .eq("id", versionId)
      .eq("org_id", orgId)
      .single();

    if (versionErr || !version) {
      return NextResponse.json(
        { error: "Version not found or access denied" },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 2. Update the main file with restored content
    // --------------------------------------------------
    const { error: updateErr } = await supabase
      .from("files")
      .update({
        content: version.content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)
      .eq("org_id", orgId);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to restore file" },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 3. Create a new version entry (post-restore snapshot)
    // --------------------------------------------------
    await supabase.from("file_version_history").insert({
      org_id: orgId,
      file_id: fileId,
      content: version.content,
      restored_from: versionId,
      created_at: new Date().toISOString(),
    });

    // --------------------------------------------------
    // 4. Log usage (RESTORE = billable event)
    // --------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      user_id: userId,
      event_type: "file_restore",
      build_minutes: 0,
      pipelines_run: 0,
      provider_api_calls: 1, // counts toward API usage
      created_at: new Date().toISOString(),
    });

    // --------------------------------------------------
    // 5. Return restored content back to UI
    // --------------------------------------------------
    return NextResponse.json({
      success: true,
      restoredContent: version.content,
      versionId,
    });
  } catch (err: any) {
    console.error("Restore error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
