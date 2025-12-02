import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * DELETE a saved file (Soft Delete Only)
 * ---------------------------------------------------
 * Tier Rules:
 *   - Developer → NO access (must upgrade)
 *   - Startup / Team / Enterprise → full delete access
 *
 * Behavior:
 *   - Marks deleted_at timestamp
 *   - Keeps file_version_history intact
 *   - Logs usage activity
 */

export async function POST(req: Request) {
  try {
    const { fileId, orgId, plan, userId } = await req.json();

    if (!fileId || !orgId) {
      return NextResponse.json(
        { error: "Missing fileId or orgId" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Developer plan cannot delete files
    // --------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to delete saved files.",
          upgrade_required: true,
        },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // Check file belongs to org
    // --------------------------------------------------
    const { data: file, error: loadErr } = await supabase
      .from("files")
      .select("id, org_id")
      .eq("id", fileId)
      .single();

    if (loadErr || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    if (file.org_id !== orgId) {
      return NextResponse.json(
        { error: "Unauthorized: file does not belong to this org" },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // Soft-delete file
    // --------------------------------------------------
    const { error: deleteErr } = await supabase
      .from("files")
      .update({
        deleted_at: new Date().toISOString(),
        last_modified_by: userId ?? null,
      })
      .eq("id", fileId);

    if (deleteErr) {
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // Log usage activity
    // --------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
      fileId,
    });
  } catch (err: any) {
    console.error("Delete file error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
