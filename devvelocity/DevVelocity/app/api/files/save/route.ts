// app/api/files/save/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * SAVE NEW INFRASTRUCTURE FILE
 * --------------------------------------------------------
 * Permissions:
 *  - Developer → ❌ Blocked (forces upgrade)
 *  - Startup / Team / Enterprise → ✅ Allowed
 *
 * Expected Input:
 *  {
 *    orgId: string,
 *    plan: string,
 *    filename: string,
 *    description?: string,
 *    content: string,
 *    userId: string
 *  }
 */

export async function POST(req: Request) {
  try {
    const { orgId, plan, filename, description, content, userId } =
      await req.json();

    if (!orgId || !filename || !content || !userId) {
      return NextResponse.json(
        { error: "Missing required fields (orgId, filename, content, userId)" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Developer tier → ❌ No access to file saving
    // --------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to save infrastructure files.",
          upgrade_required: true,
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // Supabase Admin Client (Service Role)
    // --------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // CREATE FILE RECORD
    // --------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .insert({
        org_id: orgId,
        filename,
        description: description ?? null,
        content,
        last_modified_by: userId,
      })
      .select()
      .single();

    if (fileErr || !file) {
      console.error("Create file error:", fileErr);
      return NextResponse.json(
        { error: "Failed to save file" },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // INSERT INITIAL VERSION (#1)
    // --------------------------------------------------
    await supabase.from("file_version_history").insert({
      file_id: file.id,
      org_id: orgId,
      previous_content: null, // initial
      new_content: content,
      change_summary: "Initial file save",
    });

    // --------------------------------------------------
    // USAGE TRACKING (Build = 1 activity)
    // --------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 1,
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      fileId: file.id,
      message: "File saved successfully.",
    });
  } catch (err: any) {
    console.error("Save-file route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
