// app/api/files/update/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * UPDATE EXISTING SAVED FILE
 * --------------------------------------------------------
 * Required Inputs:
 *  {
 *    fileId: string,
 *    orgId: string,
 *    plan: string,
 *    newContent: string,
 *    userId: string
 *  }
 *
 * Behavior:
 *  - Developer tier → ❌ blocked
 *  - Startup / Team / Enterprise → allowed
 *  - Creates new version in file_version_history
 *  - Updates main file record
 *  - Logs usage
 */

export async function POST(req: Request) {
  try {
    const { fileId, orgId, plan, newContent, userId } = await req.json();

    if (!fileId || !orgId || !newContent || !userId) {
      return NextResponse.json(
        { error: "Missing required fields (fileId, orgId, newContent, userId)" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 1. Developer tier — blocked from editing
    // --------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to edit saved infrastructure files.",
          upgrade_required: true,
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 2. Supabase client (Service Role)
    // --------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // 3. Get current file data
    // --------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    const oldContent = file.content;

    // --------------------------------------------------
    // 4. Insert new version into file_version_history
    // --------------------------------------------------
    await supabase.from("file_version_history").insert({
      file_id: fileId,
      org_id: orgId,
      previous_content: oldContent,
      new_content: newContent,
      change_summary: "Manual update via File Portal",
    });

    // --------------------------------------------------
    // 5. Update main file record
    // --------------------------------------------------
    await supabase
      .from("files")
      .update({
        content: newContent,
        last_modified_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId);

    // --------------------------------------------------
    // 6. Meter usage
    // --------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 1,     // editing infra is treated as a pipeline event
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "File updated successfully",
    });
  } catch (err: any) {
    console.error("File update error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
