// app/api/usage/get/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET ORG USAGE LOGS
 * ------------------------------------------------------
 * Returns:
 * - Daily usage logs
 * - Monthly totals
 * - Tier-specific limits
 * - Upgrade recommendations
 *
 * Visible to:
 * - Startup
 * - Team
 * - Enterprise
 *
 * Hidden from:
 * - Developer (returns upgrade notice)
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

    // Developer tier cannot view usage history
    if (plan === "developer") {
      return NextResponse.json({
        usage: [],
        totals: {},
        upgrade_required: true,
        message:
          "Upgrade to Startup, Team, or Enterprise to unlock usage analytics.",
      });
    }

    // ------------------------------
    // Supabase Admin Client
    // ------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------
    // 1. Fetch Raw Logs
    // ------------------------------
    const { data: logs, error: logsErr } = await supabase
      .from("usage_logs")
      .select(`
        id,
        org_id,
        date,
        pipelines_run,
        provider_api_calls,
        build_minutes
      `)
      .eq("org_id", orgId)
      .order("date", { ascending: false });

    if (logsErr) {
      return NextResponse.json(
        { error: "Unable to load usage logs" },
        { status: 500 }
      );
    }

    // ------------------------------
    // 2. Calculate Totals
    // ------------------------------
    const totals = logs.reduce(
      (acc, row) => {
        acc.pipelines_run += row.pipelines_run ?? 0;
        acc.provider_api_calls += row.provider_api_calls ?? 0;
        acc.build_minutes += row.build_minutes ?? 0;
        return acc;
      },
      {
        pipelines_run: 0,
        provider_api_calls: 0,
        build_minutes: 0,
      }
    );

    // ------------------------------
    // 3. Apply Tier Rules
    // ------------------------------
    const tierLimits: Record<string, any> = {
      startup: {
        max_build_minutes: 500,
        max_pipelines: 100,
        max_provider_calls: 1000,
      },
      team: {
        max_build_minutes: 2000,
        max_pipelines: 500,
        max_provider_calls: 5000,
      },
      enterprise: {
        max_build_minutes: Infinity,
        max_pipelines: Infinity,
        max_provider_calls: Infinity,
      },
    };

    const limits = tierLimits[plan] ?? tierLimits["startup"];

    // ------------------------------
    // 4. Upgrade Recommendation Engine
    // ------------------------------
    const recommendations: string[] = [];

    if (totals.pipelines_run >= limits.max_pipelines * 0.9) {
      recommendations.push(
        "You're approaching your monthly pipeline limit — consider upgrading."
      );
    }

    if (totals.build_minutes >= limits.max_build_minutes * 0.9) {
      recommendations.push(
        "Build minutes usage is near the limit. Upgrade recommended."
      );
    }

    if (totals.provider_api_calls >= limits.max_provider_calls * 0.9) {
      recommendations.push(
        "API call volume is nearing its cap. Team tier may be more suitable."
      );
    }

    return NextResponse.json({
      usage: logs,
      totals,
      limits,
      recommendations,
      upgrade_required: false,
    });
  } catch (err: any) {
    console.error("Usage get error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
