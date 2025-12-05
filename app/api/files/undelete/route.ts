import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * UNDELETE / RESTORE SOFT-DELETED FILE
 * --------------------------------------------------------------
 * POST /api/files/undelete
 *
 * Inputs:
 *  {
 *    fileId: string,
 *    orgId: string,
 *    plan: string,
 *    userId: string
 *  }
 *
 * Behavior:
 *  - Developer ❌ cannot restore files
 *  - Startup / Team / Enterprise → full access
 *  - Ensures file belongs to org
 *  - Clears deleted_at timestamp
 *  - Logs activity (non-billable)
 *
 * Recommended UI:
 *  - Trash page
 *  - "Undo delete" snackbar
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

    // --------------------------------------------------------------
    // 1. Developer tier — BLOCKED
    // --------------------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to restore deleted files.",
          upgrade_required: true
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------------------
    // 2. Supabase Admin Client
    // --------------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------------------
    // 3. Confirm file exists + belongs to org
    // --------------------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("id, filename, deleted_at")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or access denied." },
        { status: 404 }
      );
    }

    if (!file.deleted_at) {
      return NextResponse.json(
        { error: "File is not deleted." },
        { status: 400 }
      );
    }

    // --------------------------------------------------------------
    // 4. Restore file
    // --------------------------------------------------------------
    const { error: restoreErr } = await supabase
      .from("files")
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
        last_modified_by: userId
      })
      .eq("id", fileId);

    if (restoreErr) {
      return NextResponse.json(
        { error: "Failed to restore file." },
        { status: 500 }
      );
    }

    // --------------------------------------------------------------
    // 5. Log file restoration (non-billable)
    // --------------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      restored_files: 1,
      date: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: "File successfully restored."
    });

  } catch (err: any) {
    console.error("Undelete API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
