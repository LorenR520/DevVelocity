// app/api/files/versions/get/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET FULL VERSION CONTENT
 * --------------------------------------------------------
 * For diffing, previewing, and restoring.
 *
 * Inputs (POST):
 *  {
 *    versionId: string,
 *    fileId: string,
 *    orgId: string,
 *    plan: string
 *  }
 *
 * Behavior:
 *  - Developer → ❌ blocked
 *  - Ensures version + file belong to org
 *  - Returns previous_content + new_content
 */

export async function POST(req: Request) {
  try {
    const { versionId, fileId, orgId, plan } = await req.json();

    if (!versionId || !fileId || !orgId) {
      return NextResponse.json(
        { error: "Missing versionId, fileId, or orgId" },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // Developer plan cannot load version content
    // ---------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to view version contents.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------
    // Supabase Admin Client
    // ---------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------
    // Verify file belongs to requesting org
    // ---------------------------------------------
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

    // ---------------------------------------------
    // Fetch the specific version entry
    // ---------------------------------------------
    const { data: version, error: versionErr } = await supabase
      .from("file_version_history")
      .select("*")
      .eq("id", versionId)
      .eq("file_id", fileId)
      .eq("org_id", orgId)
      .single();

    if (versionErr || !version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      fileId,
      versionId,
      filename: file.filename,
      created_at: version.created_at,
      previous_content: version.previous_content,
      new_content: version.new_content,
      change_summary: version.change_summary,
    });

  } catch (err: any) {
    console.error("Version GET API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
