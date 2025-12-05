import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET RAW FILE CONTENT (for editor + AI regeneration)
 * -----------------------------------------------------------
 * POST /api/files/content
 *
 * Inputs:
 *  {
 *    fileId: string,
 *    orgId: string,
 *    plan: string
 *  }
 *
 * Behavior:
 *  - Developer tier → ❌ cannot load content for editing or regenerating
 *  - Startup / Team / Enterprise → full content access
 *  - Ensures file belongs to the correct org
 */

export async function POST(req: Request) {
  try {
    const { fileId, orgId, plan } = await req.json();

    // ------------------------------------------------------
    // Validate input
    // ------------------------------------------------------
    if (!fileId || !orgId) {
      return NextResponse.json(
        { error: "Missing fileId or orgId" },
        { status: 400 }
      );
    }

    // ------------------------------------------------------
    // Developer tier is *blocked* from loading full content
    // ------------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to view file content.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------------
    // Supabase Admin Client
    // ------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------------------------------
    // Load full file record
    // ------------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select(
        `
        id,
        filename,
        content,
        created_at,
        updated_at,
        org_id,
        last_modified_by
      `
      )
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    // If file not found / belongs to another org
    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or unauthorized" },
        { status: 404 }
      );
    }

    // ------------------------------------------------------
    // Return structured content
    // ------------------------------------------------------
    return NextResponse.json({
      id: file.id,
      filename: file.filename,
      content: file.content,
      created_at: file.created_at,
      updated_at: file.updated_at,
      last_modified_by: file.last_modified_by,
    });

  } catch (err: any) {
    console.error("File content API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
