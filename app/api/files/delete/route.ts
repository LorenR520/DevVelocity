import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * DELETE A USER FILE
 *
 * Rules:
 * - Must belong to user's org
 * - Prevent deleting if plan is "developer" (optional rule: they can’t restore, but can delete — your choice)
 * - Soft delete instead of hard delete
 * - Log usage event (delete = 1 API call)
 */

export async function POST(req: Request) {
  try {
    const { fileId, plan, orgId, userId } = await req.json();

    if (!fileId || !plan || !orgId || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // 1. Fetch file — ensure belongs to org
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

    // --------------------------------------------------
    // 2. Soft-delete file
    // --------------------------------------------------
    const { error: deleteErr } = await supabase
      .from("files")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", fileId)
      .eq("org_id", orgId);

    if (deleteErr) {
      return NextResponse.json(
        { error: "Failed to delete the file" },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 3. Log usage
    // --------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      user_id: userId,
      event_type: "file_delete",
      provider_api_calls: 1,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (err: any) {
    console.error("Delete file error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
