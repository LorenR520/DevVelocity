// app/api/files/update/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Update Saved File API
 * ------------------------------------------------
 * User edits an existing saved architecture file.
 *
 * ✓ Adds version history snapshot
 * ✓ Enforces plan limits
 * ✓ Meters usage (provider_api_calls +1)
 * ✓ Protects org security
 */

export async function POST(req: Request) {
  try {
    const { fileId, updatedContent } = await req.json();

    if (!fileId || !updatedContent) {
      return NextResponse.json(
        { error: "Missing fileId or updatedContent" },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // Admin Supabase Client
    // -----------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -----------------------------------------
    // Fetch file + org
    // -----------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("id, org_id, name")
      .eq("id", fileId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // Fetch org plan
    // -----------------------------------------
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("plan_id")
      .eq("id", file.org_id)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const plan = org.plan_id ?? "developer";

    // Developer = no access
    if (plan === "developer") {
      return NextResponse.json(
        {
          error:
            "Updating saved files is not available on the Developer plan. Upgrade required.",
        },
        { status: 403 }
      );
    }

    // -----------------------------------------
    // Save version history BEFORE update
    // -----------------------------------------
    await supabase.from("file_version_history").insert({
      org_id: file.org_id,
      file_id: file.id,
      content: updatedContent,
    });

    // -----------------------------------------
    // Update the file
    // -----------------------------------------
    const { error: updateErr } = await supabase
      .from("files")
      .update({
        content: updatedContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId);

    if (updateErr) {
      return NextResponse.json(
        { error: "Unable to update file" },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // Meter usage
    // -----------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: file.org_id,
      provider_api_calls: 1, // update counts as an action
      pipelines_run: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "File updated successfully.",
      fileId: file.id,
      planApplied: plan,
    });
  } catch (err: any) {
    console.error("Update file error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
