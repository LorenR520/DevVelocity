// app/api/files/archive/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * ARCHIVE FILE (Cold Storage)
 * -------------------------------------------------------------
 * POST /api/files/archive
 *
 * Inputs:
 *  {
 *    fileId: string,
 *    orgId: string,
 *    userId: string,
 *    plan: string
 *  }
 *
 * Behavior:
 *  - Developer ❌ cannot archive
 *  - Startup ❌ cannot archive
 *  - Team ✅ can archive
 *  - Enterprise ✅ can archive
 *
 *  - Moves file to "archived" state (soft-archive, not deletion)
 *  - File stays readable but cannot be edited unless restored
 *  - Version history preserved
 *  - Logged in usage_logs for audit/compliance
 */

export async function POST(req: Request) {
  try {
    const { fileId, orgId, userId, plan } = await req.json();

    if (!fileId || !orgId || !userId) {
      return NextResponse.json(
        { error: "Missing fileId, orgId, or userId" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Tier validation
    // ---------------------------------------------------------
    if (plan === "developer" || plan === "startup") {
      return NextResponse.json(
        {
          error: "Archiving is available only on Team and Enterprise plans.",
          upgrade_required: true
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // Admin Supabase Client
    // ---------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------------
    // Confirm file belongs to org
    // ---------------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("id, filename, org_id")
      .eq("id", fileId)
      .single();

    if (fileErr || !file || file.org_id !== orgId) {
      return NextResponse.json(
        { error: "File not found or unauthorized" },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // Already archived?
    // ---------------------------------------------------------
    if (file.archived_at) {
      return NextResponse.json(
        { error: "File is already archived" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Archive the file
    // ---------------------------------------------------------
    const { error: archiveErr } = await supabase
      .from("files")
      .update({
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_modified_by: userId
      })
      .eq("id", fileId);

    if (archiveErr) {
      return NextResponse.json(
        { error: "Failed to archive file" },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // Insert into usage_logs (audit trail)
    // ---------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      archived_files: 1,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `File "${file.filename}" archived successfully`
    });
  } catch (err: any) {
    console.error("Archive route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
