// app/api/billing/limits/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * BILLING LIMITS API
 * ------------------------------------------------------------
 * Returns:
 *  - plan information
 *  - usage remaining
 *  - hard limits
 *  - upgrade flags
 *
 * Used by:
 *  - Dashboard (top banner)
 *  - AI builder upgrade gates
 *  - File Portal access control
 *  - Usage graph + cycle bars
 *
 * Logic:
 *  - Developer → restricted, minimal limits
 *  - Startup   → basic limits
 *  - Team      → higher limits
 *  - Enterprise→ unlimited mode
 */

export async function POST(req: Request) {
  try {
    const { orgId } = await req.json();

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing orgId" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------------------------------------
    // 1. Load org billing details
    // ------------------------------------------------------------
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("plan_id, cycle_start, cycle_end")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const plan = org.plan_id ?? "developer";

    // ------------------------------------------------------------
    // 2. Load usage totals for current cycle
    // ------------------------------------------------------------
    const { data: usage } = await supabase
      .from("usage_logs")
      .select(`
        pipelines_run,
        provider_api_calls,
        build_minutes
      `)
      .eq("org_id", orgId)
      .gte("date", org.cycle_start)
      .lte("date", org.cycle_end);

    // Aggregate usage
    const totals = {
      pipelines: usage?.reduce((a, b) => a + (b.pipelines_run || 0), 0) ?? 0,
      api_calls: usage?.reduce((a, b) => a + (b.provider_api_calls || 0), 0) ?? 0,
      minutes: usage?.reduce((a, b) => a + (b.build_minutes || 0), 0) ?? 0,
    };

    // ------------------------------------------------------------
    // 3. Define plan limits  
    // ------------------------------------------------------------
    const limits: any = {
      developer: {
        pipelines: 5,
        ai_calls: 20,
        downloads: 0,
        restore: false,
        edit_files: false,
        file_portal: false,
      },
      startup: {
        pipelines: 100,
        ai_calls: 500,
        downloads: true,
        restore: true,
        edit_files: true,
        file_portal: true,
      },
      team: {
        pipelines: 500,
        ai_calls: 2500,
        downloads: true,
        restore: true,
        edit_files: true,
        file_portal: true,
      },
      enterprise: {
        pipelines: Infinity,
        ai_calls: Infinity,
        downloads: true,
        restore: true,
        edit_files: true,
        file_portal: true,
      },
    };

    const planLimits = limits[plan];

    // ------------------------------------------------------------
    // 4. Determine remaining usage
    // ------------------------------------------------------------
    const remaining = {
      pipelines:
        planLimits.pipelines === Infinity
          ? Infinity
          : Math.max(0, planLimits.pipelines - totals.pipelines),

      ai_calls:
        planLimits.ai_calls === Infinity
          ? Infinity
          : Math.max(0, planLimits.ai_calls - totals.api_calls),
    };

    // Determine if upgrade banner should show
    const upgrade_required =
      plan !== "enterprise" &&
      (remaining.pipelines <= 0 || remaining.ai_calls <= 0);

    return NextResponse.json({
      plan,
      cycle_start: org.cycle_start,
      cycle_end: org.cycle_end,

      usage: totals,
      limits: planLimits,
      remaining,

      upgrade_required,
      upgrade_message: upgrade_required
        ? "You are out of included usage for this plan. Upgrade to enable more pipelines + AI builds."
        : null,
    });
  } catch (err: any) {
    console.error("Billing limits error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
