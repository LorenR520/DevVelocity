// app/api/templates/restore/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * RESTORE A SOFT-DELETED TEMPLATE
 * ----------------------------------------------------------------
 * Inputs:
 *  {
 *    templateId: string,
 *    orgId: string,
 *    plan: string,
 *    userId: string
 *  }
 *
 * Behavior:
 *  - Developer tier → ❌ cannot restore templates
 *  - Startup / Team / Enterprise → full access
 *  - Restores deleted_at to null
 *  - Logs restore event
 */

export async function POST(req: Request) {
  try {
    const { templateId, orgId, plan, userId } = await req.json();

    // --------------------------------------------------
    // Validate inputs
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
          error: "Upgrade required to restore templates.",
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // Supabase service-role client
    // --------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // Verify template belongs to org
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

    if (!template.deleted_at) {
      return NextResponse.json(
        { error: "Template is not deleted" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Restore the template
    // --------------------------------------------------
    const { error: restoreErr } = await supabase
      .from("templates")
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
        last_modified_by: userId,
      })
      .eq("id", templateId)
      .eq("org_id", orgId);

    if (restoreErr) {
      return NextResponse.json(
        { error: "Failed to restore template" },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // Log restore as activity (non-billable)
    // --------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      templates_restored: 1,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Template restored successfully.",
    });
  } catch (err: any) {
    console.error("Template restore error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
