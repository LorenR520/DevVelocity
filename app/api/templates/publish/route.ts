import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * PUBLISH A NEW TEMPLATE
 * ---------------------------------------------------------
 * POST /api/templates/publish
 *
 * Inputs:
 *  {
 *    orgId: string,
 *    plan: string,
 *    userId: string,
 *    name: string,
 *    description: string,
 *    content: string,
 *    isPublic: boolean
 *  }
 *
 * Rules:
 *  - Developer ❌ cannot publish templates
 *  - Startup / Team / Enterprise → full access
 *  - Saves template + creates initial version entry
 *  - Usage logged (1 template publish = 1 action)
 */

export async function POST(req: Request) {
  try {
    const { orgId, plan, userId, name, description, content, isPublic } =
      await req.json();

    // ---------------------------------------------------------
    // Validate input
    // ---------------------------------------------------------
    if (!orgId || !userId || !name || !content) {
      return NextResponse.json(
        { error: "Missing required fields (orgId, name, content, userId)" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Developer tier is BLOCKED
    // ---------------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to publish templates.",
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
    // Prevent duplicate template names in the same org
    // ---------------------------------------------------------
    const { data: existing } = await supabase
      .from("templates")
      .select("id")
      .eq("name", name)
      .eq("org_id", orgId)
      .limit(1);

    if (existing?.length) {
      return NextResponse.json(
        { error: "A template with this name already exists." },
        { status: 409 }
      );
    }

    // ---------------------------------------------------------
    // Insert template record
    // ---------------------------------------------------------
    const { data: template, error: insertErr } = await supabase
      .from("templates")
      .insert({
        org_id: orgId,
        name,
        description: description ?? "",
        content,
        created_by: userId,
        is_public: !!isPublic,
      })
      .select()
      .single();

    if (insertErr || !template) {
      return NextResponse.json(
        { error: "Failed to publish template" },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // Create initial version entry
    // ---------------------------------------------------------
    await supabase.from("template_version_history").insert({
      template_id: template.id,
      org_id: orgId,
      content,
      change_summary: "Initial publish",
      last_modified_by: userId,
    });

    // ---------------------------------------------------------
    // Log usage action
    // ---------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      templates_published: 1,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      templateId: template.id,
      message: "Template published successfully",
    });
  } catch (err: any) {
    console.error("Template publish error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
