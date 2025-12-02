import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * LIST VERSION HISTORY FOR A FILE
 * ---------------------------------------------------
 * Tier Access:
 *  - Developer → No access (must upgrade)
 *  - Startup / Team / Enterprise → allowed
 *
 * Returned:
 *  - version_id
 *  - previous_content
 *  - new_content
 *  - change_summary
 *  - created_at
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
    // Developer tier → no access
    // --------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          versions: [],
          message: "Upgrade required to view version history.",
          upgrade_required: true,
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // Supabase
    // --------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // Validate file belongs to org
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
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // Fetch version history
    // --------------------------------------------------
    const { data: versions, error: versionErr } = await supabase
      .from("file_version_history")
      .select(
        `
        id,
        previous_content,
        new_content,
        change_summary,
        created_at
      `
      )
      .eq("file_id", fileId)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (versionErr) {
      return NextResponse.json(
        { error: "Failed to load version history" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      fileId,
      filename: file.filename,
      versions: versions ?? [],
    });
  } catch (err: any) {
    console.error("Version list API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
