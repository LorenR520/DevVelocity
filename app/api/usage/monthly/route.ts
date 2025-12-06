// app/api/usage/monthly/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * MONTHLY USAGE SUMMARY
 * ------------------------------------------------------------
 * POST /api/usage/monthly
 *
 * Inputs:
 *  {
 *    orgId: string,
 *    plan: string,
 *    cycleStart: string (ISO date)  ← Beginning of billing cycle
 *  }
 *
 * Behavior:
 *  - Developer → ❌ cannot access usage analytics
 *  - Startup / Team / Enterprise → full access
 *
 * Returns:
 *  - pipelines_run_this_cycle
 *  - provider_api_calls_this_cycle
 *  - build_minutes_this_cycle
 *  - file deletes / restores
 *  - template generation count
 *  - percentage toward plan limits
 */

export async function POST(req: Request) {
  try {
    const { orgId, plan, cycleStart } = await req.json();

    if (!orgId || !cycleStart) {
      return NextResponse.json(
        { error: "Missing orgId or cycleStart" },
        { status: 400 }
      );
    }

    // Developer plan cannot access usage breakdown
    if (plan === "developer") {
      return NextResponse.json(
        {
          upgrade_required: true,
          message: "Upgrade to view monthly usage analytics.",
        },
        { status: 403 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------------------------------------
    // Load all logs FROM cycleStart → now
    // ------------------------------------------------------------
    const { data: logs, error } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("org_id", orgId)
      .gte("date", cycleStart)
      .order("date", { ascending: false });

    if (error) {
      console.error("Monthly usage error:", error);
      return NextResponse.json(
        { error: "Failed to load monthly usage" },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // Plan limits (Startup / Team / Enterprise)
    // ------------------------------------------------------------
    const PLAN_LIMITS = {
      developer: { pipelines: 0, api: 0, minutes: 0 },
      startup: { pipelines: 100, api: 500, minutes: 300 },
      team: { pipelines: 500, api: 3000, minutes: 2000 },
      enterprise: {
        pipelines: 5000,
        api: 25000,
        minutes: 15000,
      },
    };

    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.developer;

    // ------------------------------------------------------------
    // Aggregate cycle totals
    // ------------------------------------------------------------
    const totals = {
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      deleted_files: 0,
      restored_files: 0,
      templates_generated: 0,
    };

    logs.forEach((log) => {
      totals.pipelines_run += log.pipelines_run ?? 0;
      totals.provider_api_calls += log.provider_api_calls ?? 0;
      totals.build_minutes += log.build_minutes ?? 0;
      totals.deleted_files += log.deleted_files ?? 0;
      totals.restored_files += log.restored_files ?? 0;
      totals.templates_generated += log.templates_generated ?? 0;
    });

    // ------------------------------------------------------------
    // Percentage toward limits
    // ------------------------------------------------------------
    const percent = {
      pipelines: Math.min(
        (totals.pipelines_run / limits.pipelines) * 100,
        100
      ),
      api: Math.min(
        (totals.provider_api_calls / limits.api) * 100,
        100
      ),
      minutes: Math.min(
        (totals.build_minutes / limits.minutes) * 100,
        100
      ),
    };

    return NextResponse.json({
      success: true,
      plan,
      orgId,
      cycleStart,
      totals,
      limits,
      percent,
      logs,
    });
  } catch (err: any) {
    console.error("Monthly usage API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
