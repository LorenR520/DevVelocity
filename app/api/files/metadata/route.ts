import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET FILE METADATA
 * ---------------------------------------------------------
 * POST /api/files/metadata
 *
 * Inputs:
 *  {
 *    fileId: string,
 *    orgId: string,
 *    plan: string
 *  }
 *
 * Behavior:
 *  - Developer → ❌ no access to metadata
 *  - Startup / Team / Enterprise → full access
 *  - Confirms file belongs to org
 *  - Returns:
 *      - filename
 *      - description
 *      - created_at
 *      - updated_at
 *      - version_count
 *      - last_modified_by
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

    // ---------------------------------------------------------
    // Developer Tier — BLOCKED
    // ---------------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to view file metadata.",
          upgrade_required: true
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // Supabase admin client
    // ---------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------------
    // Fetch file + version count
    // ---------------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select(
        `
        id,
        filename,
        description,
        org_id,
        created_at,
        updated_at,
        last_modified_by,
        version_history:file_version_history(count)
      `
      )
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or access denied." },
        { status: 404 }
      );
    }

    // Normalize count result
    const versionCount = file.version_history?.[0]?.count ?? 0;

    return NextResponse.json({
      success: true,
      file: {
        id: file.id,
        filename: file.filename,
        description: file.description,
        created_at: file.created_at,
        updated_at: file.updated_at,
        last_modified_by: file.last_modified_by,
        version_count: versionCount
      }
    });

  } catch (err: any) {
    console.error("Metadata API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
