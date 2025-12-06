import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * UPDATE TEMPLATE METADATA
 * ---------------------------------------------------
 * POST /api/templates/update
 *
 * Inputs:
 *  {
 *    templateId: string,
 *    orgId: string,
 *    plan: string,
 *    name?: string,
 *    description?: string,
 *    category?: string,
 *    tags?: string[],
 *    userId: string
 *  }
 *
 * Rules:
 *  - Developer tier: ❌ cannot edit templates
 *  - Startup: can edit base + provider
 *  - Team: can edit base + provider + advanced
 *  - Enterprise: all categories allowed
 */

export async function POST(req: Request) {
  try {
    const { templateId, orgId, plan, name, description, category, tags, userId } =
      await req.json();

    if (!templateId || !orgId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields (templateId, orgId, userId)" },
        { status: 400 }
      );
    }

    // -----------------------------------------------------------
    // Permission Matrix (same across all templates)
    // -----------------------------------------------------------
    const allowedCategories: Record<string, string[]> = {
      developer: [], // developer cannot edit templates
      startup: ["base", "provider"],
      team: ["base", "provider", "advanced"],
      enterprise: ["base", "provider", "advanced", "enterprise"],
    };

    const allowed = allowedCategories[plan] ?? [];

    if (allowed.length === 0) {
      return NextResponse.json(
        {
          error: "Upgrade required to edit templates.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // -----------------------------------------------------------
    // Supabase Admin Client
    // -----------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -----------------------------------------------------------
    // Load Template + Validate Org
    // -----------------------------------------------------------
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

    // -----------------------------------------------------------
    // Validate Category Change Permission
    // -----------------------------------------------------------
    if (category && !allowed.includes(category)) {
      return NextResponse.json(
        {
          error: `Your plan does not allow assigning templates to category "${category}".`,
        },
        { status: 403 }
      );
    }

    // -----------------------------------------------------------
    // Perform Update
    // -----------------------------------------------------------
    const fieldsToUpdate: Record<string, any> = {};

    if (name) fieldsToUpdate.name = name;
    if (description) fieldsToUpdate.description = description;
    if (category) fieldsToUpdate.category = category;
    if (tags) fieldsToUpdate.tags = tags;

    fieldsToUpdate.updated_at = new Date().toISOString();
    fieldsToUpdate.last_modified_by = userId;

    const { error: updateErr } = await supabase
      .from("templates")
      .update(fieldsToUpdate)
      .eq("id", templateId);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 }
      );
    }

    // -----------------------------------------------------------
    // Activity Log
    // -----------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      updated_templates: 1,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Template metadata updated successfully",
    });
  } catch (err: any) {
    console.error("Template update error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
