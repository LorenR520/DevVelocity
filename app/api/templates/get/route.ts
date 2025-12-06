import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET SINGLE TEMPLATE
 * ---------------------------------------------------
 * POST /api/templates/get
 *
 * Inputs:
 *  {
 *    templateId: string,
 *    orgId: string,
 *    plan: string
 *  }
 *
 * Returns:
 *  - Full template object
 *  - Blocks access based on plan/category rules
 */

export async function POST(req: Request) {
  try {
    const { templateId, orgId, plan } = await req.json();

    if (!templateId || !orgId) {
      return NextResponse.json(
        { error: "Missing templateId or orgId" },
        { status: 400 }
      );
    }

    // ----------------------------------------------------
    // PERMISSIONS — allowed categories per paid tier
    // ----------------------------------------------------
    const allowedCategories: Record<string, string[]> = {
      developer: ["base"],
      startup: ["base", "provider"],
      team: ["base", "provider", "advanced"],
      enterprise: ["base", "provider", "advanced", "enterprise"],
    };

    const allowed = allowedCategories[plan] ?? ["base"];

    // ----------------------------------------------------
    // Supabase Admin Client
    // ----------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ----------------------------------------------------
    // Load Template
    // ----------------------------------------------------
    const { data: template, error } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: "Template not found or unauthorized" },
        { status: 404 }
      );
    }

    // ----------------------------------------------------
    // Validate category access
    // ----------------------------------------------------
    if (!allowed.includes(template.category)) {
      return NextResponse.json(
        {
          error: `Your plan does not grant access to ${template.category} templates.`,
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (err: any) {
    console.error("Template GET error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
