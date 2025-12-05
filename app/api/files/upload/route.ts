import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * FILE UPLOAD (CREATE NEW FILE)
 * ---------------------------------------------------------
 * POST /api/files/upload
 *
 * Inputs:
 *  {
 *    orgId: string,
 *    plan: string,
 *    userId: string,
 *    filename: string,
 *    content: string
 *  }
 *
 * Behavior:
 *  - Developer → ❌ cannot upload/import files
 *  - Startup/Team/Enterprise → full access
 *  - Creates new file entry
 *  - Creates initial version history row
 *  - Logs usage
 */

export async function POST(req: Request) {
  try {
    const { orgId, plan, userId, filename, content } = await req.json();

    // ----------------------------
    // Validate inputs
    // ----------------------------
    if (!orgId || !userId || !filename || !content) {
      return NextResponse.json(
        { error: "Missing orgId, userId, filename, or content" },
        { status: 400 }
      );
    }

    // ----------------------------
    // Developer tier → blocked
    // ----------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to upload infrastructure files.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ----------------------------
    // Supabase admin client
    // ----------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ----------------------------
    // Create file row
    // ----------------------------
    const { data: newFile, error: createErr } = await supabase
      .from("files")
      .insert({
        org_id: orgId,
        filename,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_modified_by: userId,
      })
      .select("*")
      .single();

    if (createErr || !newFile) {
      return NextResponse.json(
        { error: "Failed to create file" },
        { status: 500 }
      );
    }

    // ----------------------------
    // Create initial version entry
    // ----------------------------
    await supabase.from("file_version_history").insert({
      file_id: newFile.id,
      org_id: orgId,
      previous_content: null,
      new_content: content,
      change_summary: "Initial file upload",
      last_modified_by: userId,
    });

    // ----------------------------
    // Log upload (non-billable)
    // ----------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      uploaded_files: 1,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      fileId: newFile.id,
      message: "File uploaded successfully",
    });
  } catch (err: any) {
    console.error("Upload route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
