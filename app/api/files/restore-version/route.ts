import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * RESTORE A PREVIOUS FILE VERSION
 * ---------------------------------------------------
 * Tier Access:
 *  - Developer → No access
 *  - Startup / Team / Enterprise → allowed
 *
 * Steps:
 *  1. Validate request
 *  2. Verify file + version belong to org
 *  3. Replace current file content
 *  4. Log restore into file_version_history
 *  5. Meter usage
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

    // --------------------------------------------------
    // Developer tier cannot restore versions
    // --------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to restore file versions.",
          upgrade_required: true,
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // Supabase
    // --------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // Validate file exists + belongs to org
    // --------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("id, org_id, content, filename")
      .eq("id", fileId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (file.org_id !== orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // --------------------------------------------------
    // Fetch version to restore
    // --------------------------------------------------
    const { data: version, error: versionErr } = await supabase
      .from("file_version_history")
      .select("id, new_content, created_at, change_summary")
      .eq("id", versionId)
      .eq("org_id", orgId)
      .eq("file_id", fileId)
      .single();

    if (versionErr || !version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    const restoredContent = version.new_content;

    // --------------------------------------------------
    // Update the current file with restored content
    // --------------------------------------------------
    await supabase
      .from("files")
      .update({
        content: restoredContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId);

    // --------------------------------------------------
    // Log restore as a new version record
    // --------------------------------------------------
    await supabase.from("file_version_history").insert({
      file_id: fileId,
      org_id: orgId,
      previous_content: file.content,
      new_content: restoredContent,
      change_summary: `Restored to version ${versionId} from ${version.created_at}`,
    });

    // --------------------------------------------------
    // Meter Usage (Restore = 1 pipeline usage)
    // --------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 1,
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      restored: true,
      message: `Restored to version ${versionId}`,
      filename: file.filename,
      content: restoredContent,
    });
  } catch (err: any) {
    console.error("Restore-version API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
