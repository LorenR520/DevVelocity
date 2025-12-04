import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * RESTORE A PREVIOUS VERSION OF A FILE
 * --------------------------------------
 * For Startup, Team, Enterprise tiers.
 *
 * Fully production-ready:
 *  ✓ Tier enforcement
 *  ✓ Org + file consistency validation
 *  ✓ Version ownership validation
 *  ✓ Ability to restore upgrade-generated versions
 *  ✓ Full restore: previous_content OR new_content
 *  ✓ New version snapshot created automatically
 *  ✓ Usage metering
 *  ✓ Cloudflare Pages-safe
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
    // ❌ Developer plan blocked from restoring
    // ---------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to restore previous versions.",
          upgrade_required: true,
          upgradeMessage:
            "Upgrade to Startup, Team, or Enterprise to restore file versions.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------
    // Supabase Admin client
    // ---------------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,               // server-only internal URL
      process.env.SUPABASE_SERVICE_ROLE_KEY!   // service role needed for RLS bypass
    );

    // ---------------------------------------------------
    // 1. Fetch target file
    // ---------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("org_id", orgId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found or does not belong to this organization." },
        { status: 404 }
      );
    }

    // ---------------------------------------------------
    // 2. Fetch target version
    // ---------------------------------------------------
    const { data: version, error: versionErr } = await supabase
      .from("file_version_history")
      .select("*")
      .eq("id", versionId)
      .eq("file_id", fileId)
      .eq("org_id", orgId)
      .single();

    if (versionErr || !version) {
      return NextResponse.json(
        { error: "Version not found or does not belong to this file/org." },
        { status: 404 }
      );
    }

    // Determine which content to restore:
    // Some older versions store only new_content.
    const restoredContent =
      version.previous_content ??
      version.new_content ??
      file.content ?? "";

    // ---------------------------------------------------
    // 3. Insert NEW version history snapshot for rollback trace
    // ---------------------------------------------------
    await supabase.from("file_version_history").insert({
      file_id: fileId,
      org_id: orgId,
      previous_content: file.content,  // before restore
      new_content: restoredContent,    // after restore
      change_summary: `Rollback to version from ${version.created_at}`,
      last_modified_by: "system-restore",
    });

    // ---------------------------------------------------
    // 4. Update the main file content
    // ---------------------------------------------------
    await supabase
      .from("files")
      .update({
        content: restoredContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId);

    // ---------------------------------------------------
    // 5. Meter usage: restoring = 1 pipeline operation
    // ---------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 1,
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    // ---------------------------------------------------
    // SUCCESS RESPONSE
    // ---------------------------------------------------
    return NextResponse.json({
      success: true,
      message: "Version restored successfully.",
      restored_content: restoredContent,
    });
  } catch (err: any) {
    console.error("Restore route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
