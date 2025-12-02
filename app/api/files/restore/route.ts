import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * RESTORE A PREVIOUS VERSION OF A FILE
 *
 * Required actions:
 *  - Validate auth
 *  - Prevent Developer tier from using this feature
 *  - Load the version content
 *  - Overwrite the main file
 *  - Save new version entry
 *  - Log billing usage for AI-based rebuilds
 */

export async function POST(req: Request) {
  try {
    const { fileId, versionId, plan } = await req.json();

    if (!fileId || !versionId || !plan) {
      return NextResponse.json(
        { error: "Missing fileId, versionId, or plan" },
        { status: 400 }
      );
    }

    // 🔒 Developer plan is not allowed to restore
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Your current plan does not support file restoration. Upgrade required.",
          upgrade: true
        },
        { status: 403 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // full access required
    );

    // Load version to restore
    const { data: version, error: versionErr } = await supabase
      .from("file_version_history")
      .select("*")
      .eq("id", versionId)
      .single();

    if (versionErr || !version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    // Update the file with the version content
    const { error: updateErr } = await supabase
      .from("files")
      .update({
        content: version.content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to restore version" },
        { status: 500 }
      );
    }

    // Insert new version entry to track the restore
    await supabase.from("file_version_history").insert({
      file_id: fileId,
      org_id: version.org_id,
      content: version.content,
      from_restore: true,
    });

    // BILLING: Record usage event
    await supabase.from("billing_events").insert({
      org_id: version.org_id,
      type: "file_restore",
      amount: 0.10, // 10¢ restore fee, or whatever you decide
      description: `Restored version ${versionId} into ${fileId}`,
    });

    return NextResponse.json({
      restored: true,
      message: "Version successfully restored",
      fileId,
      restoredVersionId: versionId,
    });
  } catch (err: any) {
    console.error("Restore error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
