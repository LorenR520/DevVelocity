import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * LIST TEMPLATES
 * --------------------------------------------------------
 * Inputs:
 *  {
 *    orgId: string,
 *    plan: string
 *  }
 *
 * Behavior:
 *  - Developer → access only free/default templates
 *  - Startup   → access extended templates
 *  - Team      → access advanced provider templates
 *  - Enterprise → access all + private templates
 *
 *  Template Categories:
 *   - base (always allowed)
 *   - provider (AWS, Azure, GCP, Cloudflare, Supabase…)
 *   - advanced (multi-cloud, ai-infra, pipelines)
 *   - enterprise (private, SOC2-ready, compliance)
 */

export async function POST(req: Request) {
  try {
    const { orgId, plan } = await req.json();

    if (!orgId || !plan) {
      return NextResponse.json(
        { error: "Missing orgId or plan" },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // Supabase Admin Client
    // --------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------------
    // Build template access rules
    // --------------------------------------------------------
    const accessLevels = {
      developer: ["base"], // minimal
      startup: ["base", "provider"],
      team: ["base", "provider", "advanced"],
      enterprise: ["base", "provider", "advanced", "enterprise"],
    };

    const allowedCategories =
      accessLevels[plan as keyof typeof accessLevels] ??
      ["base"];

    // --------------------------------------------------------
    // Fetch templates by allowed category list
    // --------------------------------------------------------
    const { data: templates, error } = await supabase
      .from("templates")
      .select(
        `
        id,
        name,
        category,
        description,
        provider,
        updated_at
      `
      )
      .in("category", allowedCategories)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Template fetch error:", error);
      return NextResponse.json(
        { error: "Failed to load templates" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan,
      allowed_categories: allowedCategories,
      templates: templates ?? [],
    });
  } catch (err: any) {
    console.error("Template list API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
