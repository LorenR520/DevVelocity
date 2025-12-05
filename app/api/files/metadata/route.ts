import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * FILE METADATA ENDPOINT
 * -------------------------------------------------------------
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
 *  - Developer tier ❌ cannot view metadata for saved files
 *  - Startup / Team / Enterprise → full access
 *  - Returns:
 *      - filename
 *      - description
 *      - version count
 *      - created_at / updated_at
 *      - last_modified_by
 */

export async function POST(req: Request) {
  try {
    const { fileId, orgId, plan } = await req.json();

    // ---------------------------------------------------------
    // Validate
    // ---------------------------------------------------------
    if (!fileId || !orgId) {
      return NextResponse.json(
        { error: "Missing fileId or orgId" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Developer tier — BLOCKED
    // ---------------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to access file metadata.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // Supabase Admin Client
    // ---------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------------
    // Load file metadata
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
        deleted_at
      `
      )
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // Version count
    // ---------------------------------------------------------
    const { count: versionCount } = await supabase
      .from("file_version_history")
      .select("*", { count: "exact", head: true })
      .eq("file_id", fileId);

    return NextResponse.json({
      id: file.id,
      filename: file.filename,
      description: file.description,
      created_at: file.created_at,
      updated_at: file.updated_at,
      last_modified_by: file.last_modified_by,
      deleted_at: file.deleted_at,
      version_count: versionCount ?? 0,
    });

  } catch (err: any) {
    console.error("Metadata API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
