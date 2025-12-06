import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * UPDATE TEMPLATE
 * --------------------------------------------------------
 * POST /api/templates/update
 *
 * Inputs:
 *  {
 *    templateId: string,
 *    orgId: string,
 *    plan: string,
 *    userId: string,
 *    name?: string,
 *    description?: string,
 *    provider?: string,
 *    category?: string,
 *    content?: string
 *  }
 *
 * Rules:
 *  - Developer can ONLY update "base" templates
 *  - Startup/Team can update "provider" and "advanced"
 *  - Enterprise can update ANY category
 *  - Records changes in template_version_history
 */

export async function POST(req: Request) {
  try {
    const {
      templateId,
      orgId,
      plan,
      userId,
      name,
      description,
      provider,
      category,
      content,
    } = await req.json();

    if (!templateId || !orgId || !userId) {
      return NextResponse.json(
        { error: "Missing templateId, orgId, or userId" },
        { status: 400 }
      );
    }

    // ------------------------------
    // PLAN PERMISSIONS
    // ------------------------------
    const allowedCategories: Record<string, string[]> = {
      developer: ["base"],
      startup: ["base", "provider"],
      team: ["base", "provider", "advanced"],
      enterprise: ["base", "provider", "advanced", "enterprise"],
    };

    const permitted = allowedCategories[plan];

    if (category && !permitted.includes(category)) {
      return NextResponse.json(
        {
          error: `Your ${plan} plan cannot update templates in category: ${category}`,
          allowed_categories: permitted,
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ------------------------------
    // SUPABASE ADMIN CLIENT
    // ------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------
    // 1. Load template
    // ------------------------------
    const { data: template, error: loadErr } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .eq("org_id", orgId)
      .single();

    if (loadErr || !template) {
      return NextResponse.json(
        { error: "Template not found or access denied" },
        { status: 404 }
      );
    }

    // ------------------------------
    // 2. Build update payload
    // ------------------------------
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
      updated_by: userId,
    };

    if (name) updatePayload.name = name;
    if (description) updatePayload.description = description;
    if (provider) updatePayload.provider = provider;
    if (category) updatePayload.category = category;
    if (content) updatePayload.content = content;

    // ------------------------------
    // 3. Log previous version first
    // ------------------------------
    await supabase.from("template_version_history").insert({
      template_id: templateId,
      org_id: orgId,
      previous_name: template.name,
      previous_description: template.description,
      previous_category: template.category,
      previous_provider: template.provider,
      previous_content: template.content,
      new_name: name ?? template.name,
      new_description: description ?? template.description,
      new_category: category ?? template.category,
      new_provider: provider ?? template.provider,
      new_content: content ?? template.content,
      updated_by: userId,
    });

    // ------------------------------
    // 4. Perform template update
    // ------------------------------
    const { error: updateErr } = await supabase
      .from("templates")
      .update(updatePayload)
      .eq("id", templateId);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 }
      );
    }

    // ------------------------------
    // 5. Usage log
    // ------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      edited_templates: 1,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Template updated successfully",
    });
  } catch (err: any) {
    console.error("Template update error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
