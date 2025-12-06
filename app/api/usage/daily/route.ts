// app/api/usage/daily/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * DAILY USAGE BREAKDOWN
 * --------------------------------------------------------
 * POST /api/usage/daily
 *
 * Inputs:
 *  {
 *    orgId: string,
 *    plan: string,
 *    days: number // e.g., 30 days
 *  }
 *
 * Behavior:
 *  - Developer → no access
 *  - Startup / Team / Enterprise → full access
 *
 * Output:
 *  - date → aggregated totals
 *  - pipelines_run
 *  - provider_api_calls
 *  - build_minutes
 *  - templates_generated
 *
 * Used for:
 *  - Daily usage charts
 *  - Trend analysis
 *  - Detecting abnormal spikes
 */

export async function POST(req: Request) {
  try {
    const { orgId, plan, days } = await req.json();

    if (!orgId || !days) {
      return NextResponse.json(
        { error: "Missing orgId or days" },
        { status: 400 }
      );
    }

    // Developer tier cannot view usage analytics
    if (plan === "developer") {
      return NextResponse.json(
        {
          upgrade_required: true,
          message: "Upgrade to Startup to view usage analytics.",
        },
        { status: 403 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------------------------------------
    // Calculate the date range (last X days)
    // ------------------------------------------------------------
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    // ------------------------------------------------------------
    // Fetch all usage logs
    // ------------------------------------------------------------
    const { data: logs, error } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("org_id", orgId)
      .gte("date", since.toISOString())
      .order("date", { ascending: true });

    if (error) {
      console.error("Daily usage error:", error);
      return NextResponse.json(
        { error: "Failed to load daily usage" },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------
    // Aggregate by DAY
    // ------------------------------------------------------------
    const daily: any = {};

    logs.forEach((log) => {
      const date = log.date.split("T")[0]; // YYYY-MM-DD

      if (!daily[date]) {
        daily[date] = {
          pipelines_run: 0,
          provider_api_calls: 0,
          build_minutes: 0,
          templates_generated: 0,
        };
      }

      daily[date].pipelines_run += log.pipelines_run ?? 0;
      daily[date].provider_api_calls += log.provider_api_calls ?? 0;
      daily[date].build_minutes += log.build_minutes ?? 0;
      daily[date].templates_generated += log.templates_generated ?? 0;
    });

    // Convert to array for charts
    const result = Object.entries(daily).map(([date, values]) => ({
      date,
      ...values,
    }));

    return NextResponse.json({
      success: true,
      days,
      orgId,
      data: result,
    });
  } catch (err: any) {
    console.error("Daily usage API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
