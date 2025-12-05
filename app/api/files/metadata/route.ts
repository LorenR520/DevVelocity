import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET FILE METADATA (NO CONTENT)
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
 *  - Developer tier = ❌ blocked
 *  - Startup / Team / Enterprise = full access
 *  - Returns:
 *      - filename
 *      - description
 *      - updated_at
 *      - created_at
 *      - version_count
 *      - last_modified_by
 *
 *  - Does NOT return file content (security)
 *  - Uses RLS + explicit org check
 */

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { fileId, orgId, plan } = await req.json();

    if (!fileId || !orgId) {
      return NextResponse.json(
        { error: "Missing fileId or orgId" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------
    // 1. Developer tier cannot see metadata
    // ---------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to access file metadata.",
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------
    // 2. Fetch metadata with strict org validation
    // ---------------------------------------------------
    const { data, error } = await supabase
      .from("files")
      .select(
        `
        id,
        filename,
        description,
        created_at,
        updated_at,
        last_modified_by,
        version_count: file_version_history(count)
      `
      )
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    // ---------------------------------------------------
    // 3. Return safe metadata (NO content)
    // ---------------------------------------------------
    return NextResponse.json({
      success: true,
      metadata: data,
    });
  } catch (err: any) {
    console.error("Metadata route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
