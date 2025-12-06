import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET SINGLE TEMPLATE
 * --------------------------------------------------------
 * POST /api/templates/get
 *
 * Inputs:
 *  {
 *    templateId: string,
 *    orgId: string,
 *    plan: string
 *  }
 *
 * Behavior:
 *  - Checks tier permissions
 *  - Ensures template category allowed for plan
 *  - Returns template body + metadata
 *  - Supports enterprise-only templates
 */

export async function POST(req: Request) {
  try {
    const { templateId, orgId, plan } = await req.json();

    if (!templateId || !orgId || !plan) {
      return NextResponse.json(
        { error: "Missing templateId, orgId, or plan" },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // Supabase Admin Client (RLS bypass for template reads)
    // --------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------------
    // Load template
    // --------------------------------------------------------
    const { data: template, error } = await supabase
      .from("templates")
      .select(
        `
        id,
        name,
        category,
        provider,
        description,
        content,
        updated_at
      `
      )
      .eq("id", templateId)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // Access Permission Rules
    // --------------------------------------------------------
    const allowedCategories = {
      developer: ["base"],
      startup: ["base", "provider"],
      team: ["base", "provider", "advanced"],
      enterprise: ["base", "provider", "advanced", "enterprise"],
    };

    const planAllowed =
      allowedCategories[plan as keyof typeof allowedCategories] ?? ["base"];

    if (!planAllowed.includes(template.category)) {
      return NextResponse.json(
        {
          error: "Your plan does not include access to this template.",
          upgrade_required: true,
          required_category: template.category,
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------------
    // Serve the template to the client
    // --------------------------------------------------------
    return NextResponse.json({
      success: true,
      template,
    });
  } catch (err: any) {
    console.error("Template get API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
