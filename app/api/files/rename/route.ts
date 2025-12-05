import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * RENAME FILE (PRODUCTION READY)
 * ---------------------------------------------------------
 * Behavior:
 *  - Developer → ❌ cannot rename files
 *  - Startup / Team / Enterprise → full access
 *  - Preserves file extension unless user specifies a new one
 *  - Validates org ownership
 *  - Writes rename event into version history
 *  - Writes activity to usage logs
 */

export async function POST(req: Request) {
  try {
    const { fileId, orgId, newName, plan, userId } = await req.json();

    if (!fileId || !orgId || !newName || !userId) {
      return NextResponse.json(
        { error: "Missing fileId, orgId, newName, or userId" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Developer tier → BLOCKED
    // ---------------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to rename files.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // Supabase (service role)
    // ---------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------------
    // Load file to validate ownership + old name
    // ---------------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("id, filename, org_id")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // Normalize new filename + preserve extension
    // ---------------------------------------------------------
    const oldName = file.filename;

    const hasExt = oldName.includes(".");
    const userIncludedExt = newName.includes(".");

    let finalName = newName.trim();

    // If old file had extension and user didn't include one → preserve original ext
    if (hasExt && !userIncludedExt) {
      const ext = oldName.split(".").pop();
      finalName = `${finalName}.${ext}`;
    }

    // Basic cleanup (optional)
    finalName = finalName.replace(/\s+/g, "-"); // remove spaces
    finalName = finalName.replace(/[^a-zA-Z0-9._-]/g, ""); // sanitize

    // ---------------------------------------------------------
    // Update filename
    // ---------------------------------------------------------
    const { error: updateErr } = await supabase
      .from("files")
      .update({
        filename: finalName,
        last_modified_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)
      .eq("org_id", orgId);

    if (updateErr) {
      console.error("Rename update error:", updateErr);
      return NextResponse.json(
        { error: "Failed to rename file" },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // Version History Log
    // ---------------------------------------------------------
    await supabase.from("file_version_history").insert({
      file_id: fileId,
      org_id: orgId,
      previous_content: null,
      new_content: null,
      change_summary: `Renamed file from "${oldName}" to "${finalName}"`,
      last_modified_by: userId,
    });

    // ---------------------------------------------------------
    // Usage Log
    // ---------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      renamed_files: 1,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "File renamed successfully",
      newName: finalName,
    });
  } catch (err: any) {
    console.error("Rename route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
