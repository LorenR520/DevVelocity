// app/api/files/metadata/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET METADATA FOR A FILE
 * -------------------------------------------------------
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
 *  - All paid tiers allowed (Developer, Startup, Team, Enterprise)
 *  - Ensures file belongs to org
 *  - Returns metadata only (not file content)
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

    // -----------------------------------------------------
    // Supabase (Admin client)
    // -----------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -----------------------------------------------------
    // Load file metadata (NOT content to save bandwidth)
    // -----------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select(`
        id,
        filename,
        description,
        org_id,
        created_at,
        updated_at,
        deleted_at,
        last_modified_by,
        version_count: file_version_history(count)
      `)
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    // -----------------------------------------------------
    // Developer tier CAN SEE metadata (paid tier)
    // Only blocked on: download, restore-version, update
    // -----------------------------------------------------

    return NextResponse.json({
      success: true,
      metadata: file,
      plan,
    });
  } catch (err: any) {
    console.error("Metadata route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
