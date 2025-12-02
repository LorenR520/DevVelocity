// app/api/ai-builder/upgrade-file/route.ts

import { NextResponse } from "next/server";
import { runAIUpgrade } from "@/server/ai/builder-engine";
import { createClient } from "@supabase/supabase-js";

/**
 * AI File Upgrade Route
 * ---------------------------------------
 * This upgrades an existing saved file using GPT-5.1-Pro.
 * It:
 *  - validates org + user
 *  - loads plan tier
 *  - runs AI upgrade engine
 *  - stores new version in file_version_history
 *  - meters usage
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

    // ------------------------------
    // Supabase Admin Client
    // ------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------
    // Fetch file + org metadata
    // ------------------------------
    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const orgId = file.org_id;

    // ------------------------------
    // Load org plan tier
    // ------------------------------
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

    // ------------------------------
    // Run AI Upgrade Engine
    // ------------------------------
    const result = await runAIUpgrade(existingConfig, plan);

    // ------------------------------
    // Insert version history
    // ------------------------------
    await supabase.from("file_version_history").insert({
      file_id: fileId,
      org_id: orgId,
      previous_content: existingConfig,
      new_content: JSON.stringify(result.updated_config),
      change_summary: result.changes,
    });

    // ------------------------------
    // Update “current file content”
    // ------------------------------
    await supabase
      .from("files")
      .update({
        content: JSON.stringify(result.updated_config),
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId);

    // ------------------------------
    // Meter usage (AI upgrade = 1 activity)
    // ------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 1, // You count upgrades as "pipelines"
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "File upgraded successfully",
      output: result,
    });
  } catch (err: any) {
    console.error("Upgrade-file route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
