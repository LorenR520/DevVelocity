import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * FILE VERSION LIST
 * ------------------------------
 * Returns *all* previous versions of a file.
 *
 * Tier Rules:
 *  - developer → ❌ blocked
 *  - startup/team/enterprise → ✅ allowed
 *
 * Safety:
 *  - Requires orgId + fileId
 *  - Ensures file belongs to org
 *  - Excludes deleted entries
 */

export async function POST(req: Request) {
  try {
    const { fileId, orgId, plan } = await req.json();

    if (!fileId || !orgId) {
      return NextResponse.json(
        { error: "Missing fileId or orgId" },
        { status: 400 }
      );
    }

    const tier = plan ?? "developer";

    // -------------------------------------------------------
    // 🚫 Developer plan has NO access to File Portal
    // -------------------------------------------------------
    if (tier === "developer") {
      return NextResponse.json(
        {
          versions: [],
          upgrade_required: true,
          message:
            "Upgrade to Startup to unlock version history and file restoration.",
        },
        { status: 403 }
      );
    }

    // -------------------------------------------------------
    // Supabase service role client (required for RLS bypass +
    // selecting across file + version tables)
    // -------------------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -------------------------------------------------------
    // 1. Verify file exists + belongs to org
    // -------------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("id, org_id, deleted_at")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    if (file.deleted_at) {
      return NextResponse.json(
        { error: "This file has been deleted." },
        { status: 410 }
      );
    }

    // -------------------------------------------------------
    // 2. Load version history (most recent → oldest)
    // -------------------------------------------------------
    const { data: versions, error: verErr } = await supabase
      .from("file_version_history")
      .select(
        `
          id,
          file_id,
          org_id,
          previous_content,
          new_content,
          change_summary,
          created_at
        `
      )
      .eq("file_id", fileId)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (verErr) {
      console.error("Version history load error:", verErr);
      return NextResponse.json(
        { error: "Failed to load version history" },
        { status: 500 }
      );
    }

    // -------------------------------------------------------
    // 3. Sanitize + format versions for UI
    // -------------------------------------------------------
    const formatted = (versions ?? []).map((v) => ({
      id: v.id,
      file_id: v.file_id,
      created_at: v.created_at,
      change_summary: v.change_summary,
      previous_content: v.previous_content,
      new_content: v.new_content,
    }));

    return NextResponse.json({
      versions: formatted,
      upgrade_required: false,
    });
  } catch (err: any) {
    console.error("version-list error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
