// app/api/files/restore-deleted/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * RESTORE A SOFT-DELETED FILE
 * ----------------------------------------------------------
 * POST /api/files/restore-deleted
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
 *  - ALL PAID TIERS (Developer → Enterprise) may restore
 *  - Ensures file belongs to the org
 *  - Sets deleted_at = null
 *  - Logs restoration event
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

    // -----------------------------------------------------
    // ⚠️ All tiers are paid (Developer is NOT free)
    // Therefore, restore is ALWAYS allowed
    // -----------------------------------------------------

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -----------------------------------------------------
    // 1. Fetch file and confirm org ownership
    // -----------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or does not belong to this org" },
        { status: 404 }
      );
    }

    // File is not deleted?
    if (!file.deleted_at) {
      return NextResponse.json(
        { error: "File is not deleted" },
        { status: 400 }
      );
    }

    // -----------------------------------------------------
    // 2. Restore the file
    // -----------------------------------------------------
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

    // -----------------------------------------------------
    // 3. Log restoration as an activity record
    // -----------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      restored_files: 1,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "File restored successfully",
    });
  } catch (err: any) {
    console.error("Restore-deleted route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
