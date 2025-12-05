import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * CLONE FILE
 * ---------------------------------------------------------
 * POST /api/files/clone
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
 *  - Developer tier ❌ cannot clone files
 *  - Startup / Team / Enterprise → allowed
 *  - Creates a NEW file record with duplicated content
 *  - Adds version history entry documenting the clone
 *  - Logs usage event ("clone" counts as a pipeline action)
 */

export async function POST(req: Request) {
  try {
    const { fileId, orgId, plan, userId } = await req.json();

    // ---------------------------------------------------------
    // Validate inputs
    // ---------------------------------------------------------
    if (!fileId || !orgId || !userId) {
      return NextResponse.json(
        { error: "Missing fileId, orgId or userId" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Developer tier = blocked
    // ---------------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to clone files.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // Supabase Admin Client
    // ---------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------------
    // Load file to clone
    // ---------------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or unauthorized" },
        { status: 404 }
      );
    }

    const timestamp = new Date().toISOString();
    const clonedName = `${file.filename}-copy-${Date.now()}`;

    // ---------------------------------------------------------
    // Insert the new cloned file
    // ---------------------------------------------------------
    const { data: newFile, error: cloneErr } = await supabase
      .from("files")
      .insert({
        filename: clonedName,
        content: file.content,
        description: file.description,
        org_id: orgId,
        created_at: timestamp,
        updated_at: timestamp,
        last_modified_by: userId,
      })
      .select()
      .single();

    if (cloneErr || !newFile) {
      return NextResponse.json(
        { error: "Failed to clone file" },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // Add version history entry
    // ---------------------------------------------------------
    await supabase.from("file_version_history").insert({
      file_id: newFile.id,
      org_id: orgId,
      previous_content: null,
      new_content: file.content,
      change_summary: `Cloned from file ${file.filename}`,
      last_modified_by: userId,
    });

    // ---------------------------------------------------------
    // Log usage (clone = pipeline event)
    // ---------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 1,
      provider_api_calls: 0,
      build_minutes: 0,
      cloned_files: 1,
      date: timestamp,
    });

    return NextResponse.json({
      success: true,
      message: "File cloned successfully",
      newFileId: newFile.id,
      newFilename: clonedName,
    });
  } catch (err: any) {
    console.error("Clone file route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
