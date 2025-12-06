// app/api/billing/limits/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * BILLING LIMITS API
 * -------------------------------------------------------
 * POST /api/billing/limits
 *
 * Inputs:
 *  {
 *    orgId: string,
 *    plan: string
 *  }
 *
 * Returns:
 *  {
 *    allowed: boolean,
 *    upgrade_required: boolean,
 *    usage: { ... },
 *    limits: { ... },
 *    message?: string
 *  }
 *
 * Used by:
 *  - AI Builder execution
 *  - File creation
 *  - File download
 *  - Version restore
 *  - Regeneration pipeline
 */

export async function POST(req: Request) {
  try {
    const { orgId, plan } = await req.json();

    if (!orgId || !plan) {
      return NextResponse.json(
        { error: "Missing orgId or plan" },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // 1. Define plan-specific limits  
    // -------------------------------------------------------
    const PLAN_LIMITS: any = {
      developer: {
        pipelines: 5,
        provider_calls: 50,
        build_minutes: 15,
      },
      startup: {
        pipelines: 200,
        provider_calls: 2000,
        build_minutes: 500,
      },
      team: {
        pipelines: 1000,
        provider_calls: 8000,
        build_minutes: 2500,
      },
      enterprise: {
        pipelines: Infinity,
        provider_calls: Infinity,
        build_minutes: Infinity,
      },
    };

    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS["developer"];

    // -------------------------------------------------------
    // 2. Fetch usage for the current billing month
    // -------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: usageRows, error: usageErr } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("org_id", orgId)
      .gte("date", startOfMonth.toISOString());

    if (usageErr) {
      console.error("Usage fetch error:", usageErr);
      return NextResponse.json(
        { error: "Could not load usage data" },
        { status: 500 }
      );
    }

    // Aggregate usage
    const usage = {
      pipelines: usageRows?.reduce((sum, x) => sum + (x.pipelines_run || 0), 0),
      provider_calls: usageRows?.reduce(
        (sum, x) => sum + (x.provider_api_calls || 0),
        0
      ),
      build_minutes: usageRows?.reduce(
        (sum, x) => sum + (x.build_minutes || 0),
        0
      ),
    };

    // -------------------------------------------------------
    // 3. Check if user is within limits
    // -------------------------------------------------------
    let allowed = true;
    let upgrade_required = false;
    let message = undefined;

    if (
      usage.pipelines >= limits.pipelines ||
      usage.provider_calls >= limits.provider_calls ||
      usage.build_minutes >= limits.build_minutes
    ) {
      allowed = false;
      upgrade_required = plan !== "enterprise";
      message = "You have reached your usage limits for this billing cycle.";
    }

    return NextResponse.json({
      allowed,
      upgrade_required,
      limits,
      usage,
      message,
    });
  } catch (err: any) {
    console.error("Billing limits error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
