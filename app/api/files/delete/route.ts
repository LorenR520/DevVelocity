import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * DELETE FILE (Soft Delete)
 * ------------------------------------------------------------
 * Inputs:
 *  {
 *    fileId: string,
 *    orgId: string,
 *    plan: string,
 *    userId: string
 *  }
 *
 * Rules:
 *  - Developer → ❌ NO access
 *  - Startup / Team / Enterprise → ✔ allowed
 *
 * Behavior:
 *  - Validate file + org
 *  - Snapshot final version into version history
 *  - Soft-delete via deleted_at
 *  - Log deletion in usage logs
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

    // ------------------------------------------------------------
    // 1. Developer tier may NOT delete files
    // ------------------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to delete saved files.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------
    // 2. Supabase Admin Client (required)
    // ------------------------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,               // internal secure URL
      process.env.SUPABASE_SERVICE_ROLE_KEY!   // RLS bypass
    );

    // ------------------------------------------------------------
    // 3. Verify file belongs to the org
    // ------------------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or does not belong to your org." },
        { status: 404 }
      );
    }

    if (file.deleted_at) {
      return NextResponse.json(
        { error: "File already deleted." },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 4. Snapshot BEFORE deletion (critical)
    // ------------------------------------------------------------
    const snapshotContent = file.content ?? "";

    const { error: snapshotErr } = await supabase
      .from("file_version_history")
      .insert({
        file_id: fileId,
        org_id: orgId,
        previous_content: snapshotContent,
        new_content: snapshotContent,
        change_summary: "File soft-deleted",
        last_modified_by: userId,
      });

    if (snapshotErr) {
      console.error("Snapshot error:", snapshotErr);
      return NextResponse.json(
        { error: "Failed to snapshot file before deletion." },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // 5. Soft delete file
    // ------------------------------------------------------------
    const { error: deleteErr } = await supabase
      .from("files")
      .update({
        deleted_at: new Date().toISOString(),
        last_modified_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId);

    if (deleteErr) {
      console.error("Delete error:", deleteErr);
      return NextResponse.json(
        { error: "Failed to delete file." },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // 6. Log usage event
    // ------------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      deleted_files: 1,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "File soft-deleted successfully.",
    });

  } catch (err: any) {
    console.error("Delete file error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
