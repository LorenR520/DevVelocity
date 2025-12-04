// app/api/files/version-list/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET VERSION HISTORY FOR A FILE
 * --------------------------------------------------------
 * Permissions:
 *  - Developer → ❌ No access
 *  - Startup / Team / Enterprise → ✅ Allowed
 *
 * Returns:
 *  - version id
 *  - previous_content (optional, for diffs)
 *  - new_content (optional)
 *  - change_summary
 *  - created_at
 *  - restored_from (if applicable)
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

    // --------------------------------------------------
    // Developer plan cannot access version history
    // --------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          versions: [],
          message: "Upgrade required to access version history.",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // Supabase Client (service role)
    // --------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // Confirm file belongs to org
    // --------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("id, org_id, filename")
      .eq("id", fileId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    if (file.org_id !== orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // Fetch full version history
    // --------------------------------------------------
    const { data: versions, error: versionErr } = await supabase
      .from("file_version_history")
      .select(`
        id,
        file_id,
        org_id,
        previous_content,
        new_content,
        change_summary,
        created_at
      `)
      .eq("file_id", fileId)
      .order("created_at", { ascending: false });

    if (versionErr) {
      console.error("Version list error:", versionErr);
      return NextResponse.json(
        { error: "Failed to load version history" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      fileId,
      filename: file.filename,
      versions: versions || [],
    });
  } catch (err: any) {
    console.error("Version-list API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
