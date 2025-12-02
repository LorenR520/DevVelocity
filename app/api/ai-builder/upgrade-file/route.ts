// app/api/ai-builder/upgrade-file/route.ts

import { NextResponse } from "next/server";
import { runAIUpgrade } from "@/server/ai/builder-engine";
import { createClient } from "@supabase/supabase-js";

/**
 * AI File Upgrade Endpoint
 * ---------------------------------------
 * Steps:
 *  1. Validate request (fileId + existingConfig)
 *  2. Fetch file + org
 *  3. Determine plan tier
 *  4. Run GPT-5.1-Pro Upgrade Engine
 *  5. Store version history
 *  6. Update live file content
 *  7. Meter usage (upgrade = 1 pipeline)
 *  8. Return final upgraded config
 */

export async function POST(req: Request) {
  try {
    const { fileId, existingConfig } = await req.json();

    if (!fileId || !existingConfig) {
      return NextResponse.json(
        { error: "Missing fileId or existingConfig" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------
    // Supabase Service Role — required for secure writes
    // ---------------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------
    // 1. Fetch file metadata
    // ---------------------------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const orgId = file.org_id;

    // ---------------------------------------------------
    // 2. Fetch org plan tier
    // ---------------------------------------------------
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("plan_id")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const plan = org.plan_id ?? "developer";

    // ---------------------------------------------------
    // 3. Run GPT-5.1-Pro Upgrade Engine
    // ---------------------------------------------------
    const upgraded = await runAIUpgrade(existingConfig, plan);

    const updatedContent = JSON.stringify(upgraded.updated_config, null, 2);

    // ---------------------------------------------------
    // 4. Insert version history
    // ---------------------------------------------------
    await supabase.from("file_version_history").insert({
      file_id: fileId,
      org_id: orgId,
      previous_content: existingConfig,
      new_content: updatedContent,
      change_summary: upgraded.changes,
    });

    // ---------------------------------------------------
    // 5. Update "latest" file content
    // ---------------------------------------------------
    await supabase
      .from("files")
      .update({
        content: updatedContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId);

    // ---------------------------------------------------
    // 6. Meter usage (AI upgrade = 1 pipeline run)
    // ---------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 1,
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    // ---------------------------------------------------
    // 7. Return upgraded file + metadata
    // ---------------------------------------------------
    return NextResponse.json({
      success: true,
      message: "File upgraded successfully",
      upgraded_config: upgraded.updated_config,
      changes: upgraded.changes,
      upgrade_suggestions: upgraded.upgrade_suggestions,
      warnings: upgraded.warnings,
      upgraded_raw: updatedContent,
    });
  } catch (err: any) {
    console.error("AI Upgrade Route Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
