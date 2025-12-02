// app/api/files/delete/route.ts

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
 * Behavior:
 *  - Developer → ❌ blocked
 *  - Startup / Team / Enterprise → allowed
 *  - Soft delete only (deleted_at timestamp)
 *  - File remains in DB for recovery + version history stays intact
 *  - Usage logged
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

    // --------------------------------------------------
    // 1. Developer Tier — BLOCKED
    // --------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to delete saved infrastructure files.",
          upgrade_required: true,
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 2. Supabase Admin Client
    // --------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // 3. Load file to verify org ownership
    // --------------------------------------------------
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

    // Already deleted?
    if (file.deleted_at) {
      return NextResponse.json(
        { error: "File already deleted" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. Perform soft-delete
    // --------------------------------------------------
    const { error: deleteErr } = await supabase
      .from("files")
      .update({
        deleted_at: new Date().toISOString(),
        last_modified_by: userId,
      })
      .eq("id", fileId)
      .eq("org_id", orgId);

    if (deleteErr) {
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 5. Log deletion as activity
    // --------------------------------------------------
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
      message: "File deleted successfully (soft delete applied).",
    });
  } catch (err: any) {
    console.error("Delete file error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
