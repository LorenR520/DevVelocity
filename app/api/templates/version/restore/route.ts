import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * RESTORE A TEMPLATE TO A PREVIOUS VERSION
 * ---------------------------------------------------------
 * POST /api/templates/version/restore
 *
 * Inputs:
 *  {
 *    templateId: string,
 *    versionId: string,
 *    orgId: string,
 *    plan: string,
 *    userId: string
 *  }
 *
 * Behavior:
 *  - Developer: ❌ cannot restore templates
 *  - Startup: can restore base + provider templates
 *  - Team: can restore base + provider + advanced
 *  - Enterprise: unlimited + track auto-sync
 *
 * Versioning:
 *  - Logs previous state
 *  - Applies restored content to main template record
 *  - Creates a new version entry documenting the restore
 */

export async function POST(req: Request) {
  try {
    const { templateId, versionId, orgId, plan, userId } = await req.json();

    if (!templateId || !versionId || !orgId || !userId) {
      return NextResponse.json(
        {
          error: "Missing required fields (templateId, versionId, orgId, userId)",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Permission Matrix
    // ---------------------------------------------------------
    const allowedCategories: Record<string, string[]> = {
      developer: [], // no template restore access
      startup: ["base", "provider"],
      team: ["base", "provider", "advanced"],
      enterprise: ["base", "provider", "advanced", "enterprise"],
    };

    const allowed = allowedCategories[plan] ?? [];

    if (allowed.length === 0) {
      return NextResponse.json(
        {
          error: "Upgrade required to restore template versions.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // Supabase Admin Client
    // ---------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------------
    // Load target template
    // ---------------------------------------------------------
    const { data: template, error: tplErr } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .eq("org_id", orgId)
      .single();

    if (tplErr || !template) {
      return NextResponse.json(
        { error: "Template not found or access denied" },
        { status: 404 }
      );
    }

    if (!allowed.includes(template.category)) {
      return NextResponse.json(
        {
          error: `Your plan does not allow restoring templates in category "${template.category}".`,
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // Load version entry to restore
    // ---------------------------------------------------------
    const { data: version, error: versionErr } = await supabase
      .from("template_versions")
      .select("*")
      .eq("id", versionId)
      .eq("template_id", templateId)
      .eq("org_id", orgId)
      .single();

    if (versionErr || !version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    const restoredContent = version.new_content;

    // ---------------------------------------------------------
    // Insert new version created by restore operation
    // ---------------------------------------------------------
    await supabase.from("template_versions").insert({
      template_id: templateId,
      org_id: orgId,
      previous_content: template.content,
      new_content: restoredContent,
      change_summary: `Restored version from ${version.created_at}`,
      last_modified_by: userId,
    });

    // ---------------------------------------------------------
    // Update main template
    // ---------------------------------------------------------
    await supabase
      .from("templates")
      .update({
        content: restoredContent,
        updated_at: new Date().toISOString(),
        last_modified_by: userId,
      })
      .eq("id", templateId);

    // ---------------------------------------------------------
    // Meter usage
    // ---------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 1, // restoring templates counts as pipeline action
      provider_api_calls: 0,
      build_minutes: 0,
      restored_template_versions: 1,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Template restored successfully",
    });
  } catch (err: any) {
    console.error("Template restore error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
