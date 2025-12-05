// app/api/files/undelete/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * UNDELETE FILE (Restore soft-deleted file)
 * ------------------------------------------------------------
 *
 * Required Inputs:
 *  {
 *    fileId: string,
 *    orgId: string,
 *    plan: string,
 *    userId: string
 *  }
 *
 * Behavior:
 *  - Developer → ❌ No undelete
 *  - Startup / Team / Enterprise → Restore allowed
 *  - Ensures file belongs to org
 *  - Clears deleted_at timestamp
 *  - Logs action & creates version entry
 */

export async function POST(req: Request) {
  try {
    const { fileId, orgId, plan, userId } = await req.json();

    // Validate required inputs
    if (!fileId || !orgId || !userId) {
      return NextResponse.json(
        { error: "Missing fileId, orgId, or userId" },
        { status: 400 }
      );
    }

    // Developer tier → cannot restore files
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to restore deleted files.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch target file
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or belongs to another organization" },
        { status: 404 }
      );
    }

    if (file.deleted_at === null) {
      return NextResponse.json(
        { error: "File is not deleted" },
        { status: 400 }
      );
    }

    // Restore the file
    const { error: restoreErr } = await supabase
      .from("files")
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
        last_modified_by: userId,
      })
      .eq("id", fileId);

    if (restoreErr) {
      return NextResponse.json(
        { error: "Failed to restore file" },
        { status: 500 }
      );
    }

    // Log undelete event in version history
    await supabase.from("file_version_history").insert({
      file_id: fileId,
      org_id: orgId,
      previous_content: null,
      new_content: null,
      change_summary: "File restored from deleted state",
      last_modified_by: userId,
    });

    // Usage logs
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
      message: "File successfully restored.",
    });
  } catch (err: any) {
    console.error("Undelete route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
