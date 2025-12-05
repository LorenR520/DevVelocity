import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

/**
 * LIST VERSION HISTORY FOR A FILE
 * ----------------------------------------------------------
 * Used by:
 *  - Version History modal
 *  - Restore Version UI
 *  - Diff viewer to select versions
 *
 * Security:
 *  - Developer tier blocked
 *  - Returns ONLY metadata + content hashes (never full content)
 *  - Ensures file + versions belong to the user's organization
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

    // ----------------------------------------------------------
    // 1. Developer tier blocked entirely
    // ----------------------------------------------------------
    if (tier === "developer") {
      return NextResponse.json(
        {
          versions: [],
          upgrade_required: true,
          message: "Version history is available on Startup, Team, and Enterprise plans.",
        },
        { status: 403 }
      );
    }

    // ----------------------------------------------------------
    // 2. Supabase Admin client
    // ----------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ----------------------------------------------------------
    // 3. Verify file belongs to the org
    // ----------------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("id")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    // ----------------------------------------------------------
    // 4. Get version history entries
    // ----------------------------------------------------------
    const { data: versions, error: versionsErr } = await supabase
      .from("file_version_history")
      .select(`
        id,
        file_id,
        created_at,
        previous_content,
        new_content,
        change_summary,
        last_modified_by,
        audit_modified_reason,
        audit_modified_ip
      `)
      .eq("file_id", fileId)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (versionsErr) {
      console.error("Version list load error:", versionsErr);
      return NextResponse.json(
        { error: "Failed to load version history" },
        { status: 500 }
      );
    }

    // ----------------------------------------------------------
    // 5. Remove raw content (NEVER expose via this endpoint)
    //    Replace with SHA256 hashes for frontend diff selectors
    // ----------------------------------------------------------
    const cleaned = versions.map((v) => {
      const prevHash = crypto
        .createHash("sha256")
        .update(v.previous_content ?? "")
        .digest("hex");

      const newHash = crypto
        .createHash("sha256")
        .update(v.new_content ?? "")
        .digest("hex");

      return {
        id: v.id,
        file_id: v.file_id,
        created_at: v.created_at,
        change_summary: v.change_summary,
        last_modified_by: v.last_modified_by,

        previous_hash: prevHash,
        new_hash: newHash,

        ...(tier === "enterprise"
          ? {
              audit_modified_reason: v.audit_modified_reason,
              audit_modified_ip: v.audit_modified_ip,
            }
          : {}),
      };
    });

    return NextResponse.json({
      success: true,
      versions: cleaned,
    });
  } catch (err: any) {
    console.error("Version history error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
