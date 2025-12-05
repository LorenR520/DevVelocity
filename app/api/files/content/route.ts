import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET FILE CONTENT (FAST LOOKUP)
 * --------------------------------------------------------
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
 *  - Developer → ❌ cannot open files
 *  - Returns:
 *      - filename
 *      - content
 *      - updated_at
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
    // 1. Developer Tier → blocked from file access
    // -----------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to open saved infrastructure files.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // -----------------------------------------------------
    // 2. Supabase Admin Client
    // -----------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -----------------------------------------------------
    // 3. Fetch the file content
    // -----------------------------------------------------
    const { data: file, error } = await supabase
      .from("files")
      .select("filename, content, updated_at, org_id")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (error || !file) {
      return NextResponse.json(
        { error: "File not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      filename: file.filename,
      content: file.content,
      updated_at: file.updated_at,
    });
  } catch (err: any) {
    console.error("File content API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
