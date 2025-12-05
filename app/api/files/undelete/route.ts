import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * UNDELETE FILE (Restore Soft Delete)
 * ---------------------------------------------------------------
 * Inputs:
 *  {
 *    fileId: string,
 *    orgId: string,
 *    plan: string,
 *    userId: string
 *  }
 *
 * Behavior:
 *  - Developer tier ❌ cannot restore files
 *  - Startup / Team / Enterprise → allowed
 *  - Restores soft-deleted file (sets deleted_at = null)
 *  - Preserves version history
 *  - Logs usage
 */

export async function POST(req: Request) {
  try {
    const { fileId, orgId, plan, userId } = await req.json();

    if (!fileId || !orgId || !userId) {
      return NextResponse.json(
        { error: "Missing fileId, orgId, or userId" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------
    // 1. Developer tier → blocked
    // ---------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to restore deleted files.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------
    // 2. Supabase service-role client
    // ---------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------
    // 3. Verify file exists + belongs to org
    // ---------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    // Check if file is deleted
    if (!file.deleted_at) {
      return NextResponse.json(
        { error: "File is not deleted" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------
    // 4. Restore file
    // ---------------------------------------------------
    const { error: restoreErr } = await supabase
      .from("files")
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
        last_modified_by: userId,
      })
      .eq("id", fileId)
      .eq("org_id", orgId);

    if (restoreErr) {
      return NextResponse.json(
        { error: "Failed to restore file" },
        { status: 500 }
      );
    }

    // ---------------------------------------------------
    // 5. Log restoration in version history
    // ---------------------------------------------------
    await supabase.from("file_version_history").insert({
      file_id: fileId,
      org_id: orgId,
      previous_content: null,
      new_content: null,
      change_summary: "File restored from trash",
      last_modified_by: userId,
    });

    // ---------------------------------------------------
    // 6. Log usage (non-billable)
    // ---------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      restored_files: 1,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "File restored successfully",
    });
  } catch (err: any) {
    console.error("Undelete file error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
