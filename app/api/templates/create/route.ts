import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * CREATE NEW TEMPLATE
 * --------------------------------------------------------
 * POST /api/templates/create
 *
 * Inputs:
 *  {
 *    name: string,
 *    description: string,
 *    category: "base" | "provider" | "advanced" | "enterprise",
 *    provider: string | null,
 *    content: string,
 *    orgId: string,
 *    plan: string,
 *    userId: string
 *  }
 *
 * Behavior:
 *  - All paid tiers (Developer → Enterprise) can create templates
 *  - Developer tier = limited to BASE templates only
 *  - Startup/Team = can create provider + advanced templates
 *  - Enterprise = can create ANY category (including enterprise-only)
 *  - Saves template to DB
 *  - Logs activity
 */

export async function POST(req: Request) {
  try {
    const {
      name,
      description,
      category,
      provider,
      content,
      orgId,
      plan,
      userId,
    } = await req.json();

    // --------------------------------------------------------
    // Validate input
    // --------------------------------------------------------
    if (!name || !content || !orgId || !plan || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // Category Permissions
    // --------------------------------------------------------
    const allowedByPlan = {
      developer: ["base"],
      startup: ["base", "provider"],
      team: ["base", "provider", "advanced"],
      enterprise: ["base", "provider", "advanced", "enterprise"],
    };

    const planAllowed = allowedByPlan[plan as keyof typeof allowedByPlan];

    if (!planAllowed.includes(category)) {
      return NextResponse.json(
        {
          error: `Your plan cannot create templates in category: ${category}`,
          allowed_categories: planAllowed,
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------------
    // Supabase service-role client
    // --------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------------
    // Insert new template
    // --------------------------------------------------------
    const { data, error } = await supabase.from("templates").insert({
      name,
      description,
      category,
      provider,
      content,
      org_id: orgId,
      created_by: userId,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Template create error:", error);
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      );
    }

    // --------------------------------------------------------
    // Activity Log
    // --------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      created_templates: 1,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Template created successfully",
      templateId: data?.[0]?.id,
    });
  } catch (err: any) {
    console.error("Template create internal error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
