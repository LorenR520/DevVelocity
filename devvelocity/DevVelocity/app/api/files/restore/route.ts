import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * RESTORE A PREVIOUS VERSION OF A FILE
 * --------------------------------------
 * For Startup, Team, Enterprise tiers.
 *
 * Steps:
 * 1. Validate fileId, versionId, orgId, plan
 * 2. Ensure plan !== developer
 * 3. Load file + version ensuring they're part of the same org
 * 4. Update the current file content to the previous version
 * 5. Insert new version history entry
 * 6. Meter usage (restore counts as 1 pipeline)
 */

export async function POST(req: Request) {
  try {
    const { fileId, versionId, orgId, plan } = await req.json();

    if (!fileId || !versionId || !orgId) {
      return NextResponse.json(
        { error: "Missing fileId, versionId, or orgId" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------
    // Developer tier has NO access to restore
    // ---------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        { error: "Upgrade required to restore previous versions." },
        { status: 403 }
      );
    }

    // ---------------------------------------------------
    // Supabase client (Admin)
    // ---------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------
    // Fetch target file
    // ---------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or belongs to another org" },
        { status: 404 }
      );
    }

    // ---------------------------------------------------
    // Fetch the version being restored
    // ---------------------------------------------------
    const { data: version, error: versionErr } = await supabase
      .from("file_version_history")
      .select("*")
      .eq("id", versionId)
      .eq("org_id", orgId)
      .single();

    if (versionErr || !version) {
      return NextResponse.json(
        { error: "Version not found or belongs to another org" },
        { status: 404 }
      );
    }

    const restoredContent = version.previous_content;

    // ---------------------------------------------------
    // Insert a NEW version entry documenting the restore
    // ---------------------------------------------------
    await supabase.from("file_version_history").insert({
      file_id: fileId,
      org_id: orgId,
      previous_content: file.content, // what existed before restore
      new_content: restoredContent, // what we restored to
      change_summary: `Restored version from ${version.created_at}`,
      last_modified_by: "system-restore",
    });

    // ---------------------------------------------------
    // Update main file content
    // ---------------------------------------------------
    await supabase
      .from("files")
      .update({
        content: restoredContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId);

    // ---------------------------------------------------
    // Meter usage: restoring = 1 pipeline action
    // ---------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 1,
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Version restored successfully",
    });
  } catch (err: any) {
    console.error("Restore route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
