import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * SAVE NEW TEMPLATE VERSION
 * ---------------------------------------------------------
 * POST /api/templates/version/save
 *
 * Inputs:
 *  {
 *    templateId: string,
 *    orgId: string,
 *    plan: string,
 *    content: string,
 *    userId: string
 *  }
 *
 * Behavior:
 *  - Developer tier: ❌ cannot version templates
 *  - Startup: can version base + provider templates
 *  - Team: can version base + provider + advanced
 *  - Enterprise: unlimited
 *
 * Version History Tracks:
 *  - previous_content
 *  - new_content
 *  - change_summary
 *  - created_at
 */

export async function POST(req: Request) {
  try {
    const { templateId, orgId, plan, content, userId } = await req.json();

    if (!templateId || !orgId || !content || !userId) {
      return NextResponse.json(
        { error: "Missing templateId, orgId, content, or userId" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------
    // Permission Matrix
    // ---------------------------------------------------
    const allowedCategories: Record<string, string[]> = {
      developer: [], // cannot version templates
      startup: ["base", "provider"],
      team: ["base", "provider", "advanced"],
      enterprise: ["base", "provider", "advanced", "enterprise"],
    };

    const allowed = allowedCategories[plan] ?? [];

    if (allowed.length === 0) {
      return NextResponse.json(
        {
          error: "Upgrade required to save template versions.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------
    // Supabase Admin Client
    // ---------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------
    // Load the current template
    // ---------------------------------------------------
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
          error: `Your plan does not allow versioning templates in category "${template.category}".`,
        },
        { status: 403 }
      );
    }

    const oldContent = template.content;

    // ---------------------------------------------------
    // Insert new version entry
    // ---------------------------------------------------
    const { error: insertErr } = await supabase
      .from("template_versions")
      .insert({
        template_id: templateId,
        org_id: orgId,
        previous_content: oldContent,
        new_content: content,
        change_summary: "Template updated",
        last_modified_by: userId,
      });

    if (insertErr) {
      return NextResponse.json(
        { error: "Failed to save template version" },
        { status: 500 }
      );
    }

    // ---------------------------------------------------
    // Update main template content
    // ---------------------------------------------------
    await supabase
      .from("templates")
      .update({
        content,
        updated_at: new Date().toISOString(),
        last_modified_by: userId,
      })
      .eq("id", templateId);

    // ---------------------------------------------------
    // Meter usage
    // ---------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 1,
      provider_api_calls: 0,
      build_minutes: 0,
      saved_template_versions: 1,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Template version saved successfully",
    });
  } catch (err: any) {
    console.error("Template version save error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
