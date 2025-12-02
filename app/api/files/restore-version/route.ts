import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * RESTORE an old version of a file
 * -----------------------------------------
 * Steps:
 * 1. Validate payload
 * 2. Load version entry
 * 3. Verify organization + plan
 * 4. Insert current file into version history (archival)
 * 5. Replace file content with version content
 * 6. Meter usage
 */

export async function POST(req: Request) {
  try {
    const { versionId, orgId, plan } = await req.json();

    if (!versionId || !orgId) {
      return NextResponse.json(
        { error: "Missing versionId or orgId" },
        { status: 400 }
      );
    }

    // Developer tier blocked
    if (plan === "developer") {
      return NextResponse.json(
        { error: "Your plan does not support restoring saved file versions." },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------
    // Supabase client
    // ------------------------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------------------------------------
    // Load version entry (must belong to same org)
    // ------------------------------------------------------------
    const { data: version, error: versionErr } = await supabase
      .from("file_version_history")
      .select(
        `
        id,
        file_id,
        org_id,
        new_content,
        created_at
      `
      )
      .eq("id", versionId)
      .eq("org_id", orgId)
      .single();

    if (versionErr || !version) {
      return NextResponse.json(
        { error: "Version not found or not accessible." },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------
    // Load the current file record
    // ------------------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("id, content, org_id")
      .eq("id", version.file_id)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "Parent file not found." },
        { status: 404 }
      );
    }

    // Security check: version must belong to same org as file
    if (file.org_id !== version.org_id) {
      return NextResponse.json(
        { error: "Unauthorized restore attempt." },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------
    // Insert current version into history BEFORE overwriting
    // ------------------------------------------------------------
    await supabase.from("file_version_history").insert({
      file_id: file.id,
      org_id: file.org_id,
      previous_content: file.content,
      new_content: file.content,
      change_summary: "Archived previous state before restore",
    });

    // ------------------------------------------------------------
    // Replace main file content with the selected version
    // ------------------------------------------------------------
    await supabase
      .from("files")
      .update({
        content: version.new_content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", file.id);

    // ------------------------------------------------------------
    // Meter usage (restore = 1 pipeline op)
    // ------------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: file.org_id,
      pipelines_run: 1,
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Version successfully restored.",
    });
  } catch (err: any) {
    console.error("Restore version error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
