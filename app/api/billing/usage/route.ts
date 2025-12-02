import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * BILLING USAGE API
 * ------------------------------------
 * Returns monthly aggregated usage:
 *  - pipelines_run
 *  - provider_api_calls
 *  - build_minutes
 *  - ai_builds
 *  - ai_upgrades
 * 
 * Supports:
 *  - Startup
 *  - Team
 *  - Enterprise
 * 
 * Developer tier → not allowed, returns upgrade message.
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

    // --------------------------------------------------
    // Developer tier = restricted
    // --------------------------------------------------
    if (plan === "developer") {
      return NextResponse.json({
        usage: {
          pipelines_run: 0,
          provider_api_calls: 0,
          build_minutes: 0,
          ai_builds: 0,
          ai_upgrades: 0,
        },
        message: "Upgrade required to view monthly usage.",
      });
    }

    // --------------------------------------------------
    // Supabase client (admin access)
    // --------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --------------------------------------------------
    // Fetch usage logs for this organization
    // --------------------------------------------------
    const { data: logs, error: logsErr } = await supabase
      .from("usage_logs")
      .select(
        `
        id,
        pipelines_run,
        provider_api_calls,
        build_minutes,
        date
      `
      )
      .eq("org_id", orgId)
      .gte("date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .order("date", { ascending: true });

    if (logsErr) {
      return NextResponse.json(
        { error: "Failed to load usage logs" },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // Aggregate monthly values
    // --------------------------------------------------
    let totalPipelines = 0;
    let totalProviderCalls = 0;
    let totalMinutes = 0;

    logs?.forEach((row) => {
      totalPipelines += row.pipelines_run ?? 0;
      totalProviderCalls += row.provider_api_calls ?? 0;
      totalMinutes += row.build_minutes ?? 0;
    });

    // --------------------------------------------------
    // AI usage is counted via pipelines (per your design)
    // --------------------------------------------------
    const aiBuilds = totalPipelines; 
    const aiUpgrades = 0; // upgrades counted separately in future if needed

    return NextResponse.json({
      usage: {
        pipelines_run: totalPipelines,
        provider_api_calls: totalProviderCalls,
        build_minutes: totalMinutes,
        ai_builds: aiBuilds,
        ai_upgrades: aiUpgrades,
      },
    });
  } catch (err: any) {
    console.error("Billing usage error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
