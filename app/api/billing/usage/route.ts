// app/api/billing/usage/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * USAGE METRICS (Billing Dashboard)
 * -----------------------------------------------------------
 * POST /api/billing/usage
 *
 * Inputs:
 *  {
 *    orgId: string
 *  }
 *
 * Returns:
 *  {
 *    plan: string,
 *    cycle_start: string,
 *    cycle_end: string,
 *    metrics: {
 *        pipelines_run: number,
 *        provider_api_calls: number,
 *        build_minutes: number,
 *        deleted_files: number,
 *        renamed_files: number,
 *    },
 *    daily: [
 *        { date, pipelines_run, provider_api_calls, build_minutes }
 *    ]
 *  }
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

    // -----------------------------------------------------------
    // 1. Load organization plan + billing cycle
    // -----------------------------------------------------------
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

    // -----------------------------------------------------------
    // 2. Load ALL usage logs inside billing cycle
    // -----------------------------------------------------------
    const { data: logs, error: logsErr } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("org_id", orgId)
      .gte("date", org.cycle_start)
      .lte("date", org.cycle_end);

    if (logsErr) {
      console.error("Usage logs error:", logsErr);
      return NextResponse.json(
        { error: "Failed to load usage logs" },
        { status: 500 }
      );
    }

    // -----------------------------------------------------------
    // 3. Aggregate metrics
    // -----------------------------------------------------------
    const totals = {
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      deleted_files: 0,
      renamed_files: 0,
    };

    const dailyMap: Record<string, any> = {};

    for (const log of logs) {
      const day = log.date.split("T")[0];

      if (!dailyMap[day]) {
        dailyMap[day] = {
          date: day,
          pipelines_run: 0,
          provider_api_calls: 0,
          build_minutes: 0,
        };
      }

      totals.pipelines_run += log.pipelines_run ?? 0;
      totals.provider_api_calls += log.provider_api_calls ?? 0;
      totals.build_minutes += log.build_minutes ?? 0;
      totals.deleted_files += log.deleted_files ?? 0;
      totals.renamed_files += log.renamed_files ?? 0;

      dailyMap[day].pipelines_run += log.pipelines_run ?? 0;
      dailyMap[day].provider_api_calls += log.provider_api_calls ?? 0;
      dailyMap[day].build_minutes += log.build_minutes ?? 0;
    }

    const daily = Object.values(dailyMap).sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({
      orgId,
      plan,
      cycle_start: org.cycle_start,
      cycle_end: org.cycle_end,
      metrics: totals,
      daily,
    });
  } catch (err: any) {
    console.error("Billing usage API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
