import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * DELETE TEMPLATE (Soft Delete)
 * ---------------------------------------------------------
 * POST /api/templates/delete
 *
 * Inputs:
 *  {
 *    templateId: string,
 *    orgId: string,
 *    plan: string,
 *    userId: string
 *  }
 *
 * Behavior:
 *  - Developer → can delete ONLY "base" templates
 *  - Startup → can delete base + provider templates
 *  - Team → can delete base + provider + advanced
 *  - Enterprise → can delete anything
 *
 *  - Soft delete only (deleted_at timestamp)
 *  - Version history remains intact
 */

export async function POST(req: Request) {
  try {
    const { templateId, orgId, plan, userId } = await req.json();

    if (!templateId || !orgId || !userId) {
      return NextResponse.json(
        { error: "Missing templateId, orgId, or userId" },
        { status: 400 }
      );
    }

    // ------------------------------
    // PLAN RULES
    // ------------------------------
    const allowedCategories: Record<string, string[]> = {
      developer: ["base"],
      startup: ["base", "provider"],
      team: ["base", "provider", "advanced"],
      enterprise: ["base", "provider", "advanced", "enterprise"],
    };

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------
    // 1. Load template
    // ------------------------------
    const { data: template, error: loadErr } = await supabase
      .from("templates")
      .select("id, org_id, category, name")
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
    // 2. Permission check
    // ------------------------------
    const permitted = allowedCategories[plan];

    if (!permitted.includes(template.category)) {
      return NextResponse.json(
        {
          error: `Your ${plan} plan cannot delete templates in category "${template.category}"`,
          allowed_categories: permitted,
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // ------------------------------
    // Already deleted?
    // ------------------------------
    if (template.deleted_at) {
      return NextResponse.json(
        { error: "Template already deleted" },
        { status: 400 }
      );
    }

    // ------------------------------
    // 3. Soft delete template
    // ------------------------------
    const { error: deleteErr } = await supabase
      .from("templates")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
      })
      .eq("id", templateId);

    if (deleteErr) {
      return NextResponse.json(
        { error: "Failed to delete template" },
        { status: 500 }
      );
    }

    // ------------------------------
    // 4. Log deletion
    // ------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      deleted_templates: 1,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Template "${template.name}" deleted successfully.`,
    });
  } catch (err: any) {
    console.error("Template delete error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
