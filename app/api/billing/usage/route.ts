// app/api/billing/usage/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Billing Usage API
 * ----------------------------
 * Returns:
 *  - daily usage logs
 *  - cumulative monthly totals
 *  - plan-tier limits for comparison
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

    // ----------------------------
    // Supabase Admin Client
    // ----------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ----------------------------
    // Fetch the last 30 days of usage
    // ----------------------------
    const { data: logs, error } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("org_id", orgId)
      .gte("date", new Date(Date.now() - 30 * 86400000).toISOString())
      .order("date", { ascending: false });

    if (error) {
      console.error("Usage query error:", error);
      return NextResponse.json(
        { error: "Failed to load usage logs" },
        { status: 500 }
      );
    }

    // ----------------------------
    // Plan Tier Limits
    // ----------------------------
    const planLimits: any = {
      developer: {
        build_minutes: 200,
        pipelines_run: 20,
        provider_api_calls: 1000,
      },
      startup: {
        build_minutes: 2000,
        pipelines_run: 200,
        provider_api_calls: 50000,
      },
      team: {
        build_minutes: 5000,
        pipelines_run: 1000,
        provider_api_calls: 200000,
      },
      enterprise: {
        build_minutes: 20000,
        pipelines_run: 10000,
        provider_api_calls: 1000000,
      },
    };

    const limits = planLimits[plan] ?? planLimits.developer;

    // ----------------------------
    // Return consolidated usage
    // ----------------------------
    return NextResponse.json({
      logs: logs ?? [],
      limits,
    });
  } catch (err: any) {
    console.error("Billing usage route error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
