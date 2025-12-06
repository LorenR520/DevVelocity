import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * DUPLICATE TEMPLATE
 * ---------------------------------------------------------
 * POST /api/templates/duplicate
 *
 * Inputs:
 *  {
 *    templateId: string,
 *    orgId: string,
 *    plan: string,
 *    userId: string,
 *    newName?: string
 *  }
 *
 * Behavior:
 *  - Developer: ❌ cannot duplicate templates
 *  - Startup: can duplicate base + provider templates
 *  - Team: can duplicate base + provider + advanced
 *  - Enterprise: unlimited
 *
 * Metadata:
 *  - Copies:
 *      - content
 *      - description
 *      - category
 *      - language
 *      - providers list
 *  - Creates NEW template + initial version entry
 */

export async function POST(req: Request) {
  try {
    const { templateId, orgId, plan, userId, newName } = await req.json();

    if (!templateId || !orgId || !plan || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Permission Matrix
    // ---------------------------------------------------------
    const allowedCategories: Record<string, string[]> = {
      developer: [],
      startup: ["base", "provider"],
      team: ["base", "provider", "advanced"],
      enterprise: ["base", "provider", "advanced", "enterprise"],
    };

    const allowed = allowedCategories[plan] ?? [];

    if (allowed.length === 0) {
      return NextResponse.json(
        {
          error: "Upgrade required to duplicate templates.",
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
    // Load template to duplicate
    // ---------------------------------------------------------
    const { data: template, error: tplErr } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (tplErr || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (!allowed.includes(template.category)) {
      return NextResponse.json(
        {
          error: `Your plan does not allow duplicating templates from category "${template.category}".`,
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // Create duplicated template
    // ---------------------------------------------------------
    const duplicatedName =
      newName || `${template.name} (Copy ${Date.now()})`;

    const { data: newTemplate, error: insertErr } = await supabase
      .from("templates")
      .insert({
        org_id: orgId,
        name: duplicatedName,
        content: template.content,
        description: template.description,
        providers: template.providers,
        language: template.language,
        category: template.category,
        created_by: userId,
        last_modified_by: userId,
      })
      .select()
      .single();

    if (insertErr || !newTemplate) {
      return NextResponse.json(
        { error: "Failed to duplicate template" },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // Create initial version entry for duplicated template
    // ---------------------------------------------------------
    await supabase.from("template_versions").insert({
      template_id: newTemplate.id,
      org_id: orgId,
      previous_content: null,
      new_content: template.content,
      change_summary: `Template duplicated from ${template.name}`,
      last_modified_by: userId,
    });

    // ---------------------------------------------------------
    // Usage logs (counts as pipeline activity)
    // ---------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 1,
      provider_api_calls: 0,
      build_minutes: 0,
      duplicated_templates: 1,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Template duplicated",
      newTemplateId: newTemplate.id,
    });
  } catch (err: any) {
    console.error("Duplicate template error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
