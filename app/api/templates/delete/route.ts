// app/api/templates/delete/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * DELETE TEMPLATE (SOFT DELETE)
 * ----------------------------------------------------------
 * Inputs:
 *  {
 *    templateId: string,
 *    orgId: string,
 *    plan: string,
 *    userId: string
 *  }
 *
 * Behavior:
 *  - Developer → ❌ blocked (no template editing)
 *  - Startup / Team / Enterprise → allowed
 *  - Soft delete only (deleted_at timestamp)
 *  - Template remains restorable
 *  - Logs deletion as non-billable usage event
 */

export async function POST(req: Request) {
  try {
    const { templateId, orgId, plan, userId } = await req.json();

    // --------------------------------------------------
    // Validate required fields
    // --------------------------------------------------
    if (!templateId || !orgId || !userId) {
      return NextResponse.json(
        { error: "Missing templateId, orgId, or userId" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Developer plan → blocked
    // --------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json(
        {
          error: "Upgrade required to delete templates.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // Supabase (service role)
    // --------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // Verify template exists + belongs to org
    // --------------------------------------------------
    const { data: template, error: templateErr } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .eq("org_id", orgId)
      .single();

    if (templateErr || !template) {
      return NextResponse.json(
        { error: "Template not found or unauthorized" },
        { status: 404 }
      );
    }

    // Already deleted?
    if (template.deleted_at) {
      return NextResponse.json(
        { error: "Template already deleted" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Soft delete template
    // --------------------------------------------------
    const { error: deleteErr } = await supabase
      .from("templates")
      .update({
        deleted_at: new Date().toISOString(),
        last_modified_by: userId,
      })
      .eq("id", templateId)
      .eq("org_id", orgId);

    if (deleteErr) {
      return NextResponse.json(
        { error: "Failed to delete template" },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // Log deletion (non-billable event)
    // --------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      deleted_templates: 1,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully (soft deleted).",
    });
  } catch (err: any) {
    console.error("Template delete error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
