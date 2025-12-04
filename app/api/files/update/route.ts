import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * UPDATE EXISTING SAVED FILE
 * --------------------------------------------------------
 * Required Request Body:
 * {
 *   fileId: string,
 *   orgId: string,
 *   userId: string,
 *   plan: "developer" | "startup" | "team" | "enterprise",
 *   newContent: string
 * }
 *
 * Behavior:
 *  - Developer  → ❌ blocked
 *  - Startup    → ✔ allowed
 *  - Team       → ✔ allowed
 *  - Enterprise → ✔ allowed
 *
 * Actions:
 *  - Validates org ownership
 *  - Saves previous content to file_version_history
 *  - Updates main file content
 *  - Logs 1 pipeline event to usage_logs
 */

export async function POST(req: Request) {
  try {
    const { fileId, orgId, userId, plan, newContent } = await req.json();

    // --------------------------------------------------
    // Validate required fields
    // --------------------------------------------------
    if (!fileId || !orgId || !userId || !newContent) {
      return NextResponse.json(
        {
          error:
            "Missing required fields (fileId, orgId, userId, newContent)",
        },
        { status: 400 }
      );
    }

    const tier = plan ?? "developer";

    // --------------------------------------------------
    // Developer — block editing
    // --------------------------------------------------
    if (tier === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to edit infrastructure files.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // Supabase admin client
    // --------------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,               // internal secure URL
      process.env.SUPABASE_SERVICE_ROLE_KEY!   // bypass RLS
    );

    // --------------------------------------------------
    // Fetch current file and validate org ownership
    // --------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or belongs to another organization." },
        { status: 404 }
      );
    }

    const oldContent = file.content ?? "";

    // --------------------------------------------------
    // Insert version history entry
    // --------------------------------------------------
    const { error: versionErr } = await supabase
      .from("file_version_history")
      .insert({
        file_id: fileId,
        org_id: orgId,
        previous_content: oldContent,
        new_content: newContent,
        change_summary: "File updated through DevVelocity File Portal",
        last_modified_by: userId,
      });

    if (versionErr) {
      console.error("Version create error:", versionErr);
      return NextResponse.json(
        { error: "Failed to create version history entry." },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // Update main file record
    // --------------------------------------------------
    const { error: updateErr } = await supabase
      .from("files")
      .update({
        content: newContent,
        updated_at: new Date().toISOString(),
        last_modified_by: userId,
      })
      .eq("id", fileId);

    if (updateErr) {
      console.error("Update file error:", updateErr);
      return NextResponse.json(
        { error: "Failed to update main file record." },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // Meter usage: editing counts as a pipeline event
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
      message: "File updated successfully.",
    });
  } catch (err: any) {
    console.error("File update error:", err);
    return NextResponse.json(
      {
        error: err.message ?? "Internal server error",
      },
      { status: 500 }
    );
  }
}
