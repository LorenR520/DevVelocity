import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * RENAME FILE
 * ---------------------------------------------------------
 * POST /api/files/rename
 *
 * Inputs:
 *  {
 *    fileId: string,
 *    orgId: string,
 *    newName: string,
 *    plan: string,
 *    userId: string
 *  }
 *
 * Behavior:
 *  - Developer tier ❌ cannot rename files
 *  - Startup / Team / Enterprise → full access
 *  - Ensures file belongs to org
 *  - Updates filename only
 *  - Logs activity
 */

export async function POST(req: Request) {
  try {
    const { fileId, orgId, newName, plan, userId } = await req.json();

    // ---------------------------------------------------------
    // Validate input
    // ---------------------------------------------------------
    if (!fileId || !orgId || !newName || !userId) {
      return NextResponse.json(
        { error: "Missing fileId, orgId, newName, or userId" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Developer tier → blocked
    // ---------------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to rename files.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // Supabase (service role for metadata update)
    // ---------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------------
    // Load file to ensure it exists + belongs to org
    // ---------------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("id, filename")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // Update filename ONLY
    // ---------------------------------------------------------
    const { error: updateErr } = await supabase
      .from("files")
      .update({
        filename: newName,
        updated_at: new Date().toISOString(),
        last_modified_by: userId,
      })
      .eq("id", fileId)
      .eq("org_id", orgId);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to rename file" },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // Record rename in version log
    // ---------------------------------------------------------
    await supabase.from("file_version_history").insert({
      file_id: fileId,
      org_id: orgId,
      previous_content: null,
      new_content: null,
      change_summary: `Renamed from "${file.filename}" to "${newName}"`,
      last_modified_by: userId,
    });

    // ---------------------------------------------------------
    // Activity Log (non-billable)
    // ---------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      renamed_files: 1,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "File renamed successfully",
    });
  } catch (err: any) {
    console.error("Rename route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
