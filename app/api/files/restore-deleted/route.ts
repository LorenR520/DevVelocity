// app/api/files/restore-deleted/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * RESTORE A SOFT-DELETED FILE
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
 *  - Developer → allowed (because restore is not heavy infra)
 *  - Startup / Team / Enterprise → allowed
 *  - Ensures file belongs to org
 *  - Clears deleted_at timestamp
 *  - Logs restore event
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
    // Supabase Admin client
    // --------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // Load deleted file
    // --------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    if (!file.deleted_at) {
      return NextResponse.json(
        { error: "File is not deleted" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Restore the file (undelete)
    // --------------------------------------------------
    const { error: updateErr } = await supabase
      .from("files")
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
        last_modified_by: userId
      })
      .eq("id", fileId);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to restore file" },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // Log usage (non-billable)
    // --------------------------------------------------
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
      message: "File restored successfully"
    });
  } catch (err: any) {
    console.error("Restore-deleted route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
