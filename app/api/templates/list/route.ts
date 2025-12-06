import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * LIST TEMPLATES FOR TEMPLATE BUILDER
 * --------------------------------------------------------------
 * POST /api/templates/list
 *
 * Inputs:
 *  {
 *    orgId: string,
 *    plan: "developer" | "startup" | "team" | "enterprise"
 *  }
 *
 * Returns:
 *  - Templates user is allowed to see based on plan category rules
 *  - Base templates always visible
 */

export async function POST(req: Request) {
  try {
    const { orgId, plan } = await req.json();

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing orgId" },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // PERMISSIONS PER PLAN
    // --------------------------------------------------------
    const allowedCategories: Record<string, string[]> = {
      developer: ["base"],
      startup: ["base", "provider"],
      team: ["base", "provider", "advanced"],
      enterprise: ["base", "provider", "advanced", "enterprise"],
    };

    const categories = allowedCategories[plan] ?? ["base"];

    // --------------------------------------------------------
    // Supabase Client (service role to allow org-wide visibility)
    // --------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------------
    // Fetch templates based on allowed categories
    // --------------------------------------------------------
    const { data: templates, error } = await supabase
      .from("templates")
      .select(
        `
        id,
        name,
        description,
        category,
        provider,
        org_id,
        created_at,
        updated_at
        `
      )
      .eq("org_id", orgId)
      .in("category", categories)
      .is("deleted_at", null)
      .order("category", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Template list error:", error);
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan,
      allowed_categories: categories,
      templates: templates ?? [],
    });

  } catch (err: any) {
    console.error("Templates LIST error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
