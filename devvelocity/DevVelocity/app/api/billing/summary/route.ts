import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Billing Summary API
 * ----------------------------
 * Returns:
 *  - org plan
 *  - usage totals (pipelines, api calls, build minutes)
 *  - estimated monthly cost
 *  - next billing date
 *  - upgrade recommendation
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

    // -------------------------------------------
    // Fetch Org + Billing Plan
    // -------------------------------------------
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("plan_id, billing_cycle_start")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const plan = org.plan_id ?? "developer";

    // -------------------------------------------
    // Load pricing.json (local import)
    // -------------------------------------------
    const pricing = await import("@/marketing/pricing.json");
    const planMeta = pricing.plans.find((p: any) => p.id === plan);

    // -------------------------------------------
    // Fetch usage totals for the billing period
    // -------------------------------------------
    const cycleStart = org.billing_cycle_start;
    const now = new Date().toISOString();

    const { data: usage, error: usageErr } = await supabase
      .from("usage_logs")
      .select("pipelines_run, provider_api_calls, build_minutes")
      .eq("org_id", orgId)
      .gte("date", cycleStart)
      .lte("date", now);

    if (usageErr) {
      return NextResponse.json(
        { error: "Failed to load usage" },
        { status: 500 }
      );
    }

    // Sum totals
    const totals = {
      pipelines: usage.reduce((sum, u) => sum + (u.pipelines_run || 0), 0),
      api_calls: usage.reduce((sum, u) => sum + (u.provider_api_calls || 0), 0),
      minutes: usage.reduce((sum, u) => sum + (u.build_minutes || 0), 0),
    };

    // -------------------------------------------
    // Estimate billing cost
    // -------------------------------------------
    const included = planMeta.limits;

    const overPipelines = Math.max(0, totals.pipelines - included.pipelines_per_month);
    const overApi = Math.max(0, totals.api_calls - included.api_calls_per_month);
    const overMinutes = Math.max(0, totals.build_minutes - included.build_minutes);

    const estimatedOverage =
      overPipelines * planMeta.pricing.extra_pipeline +
      overApi * planMeta.pricing.extra_api_call +
      overMinutes * planMeta.pricing.extra_build_minute;

    const estimatedTotal = planMeta.pricing.base + estimatedOverage;

    // -------------------------------------------
    // Generate upgrade suggestion
    // -------------------------------------------
    let suggestion = null;

    if (overPipelines > 10 || overApi > 500 || overMinutes > 50) {
      suggestion = `You are exceeding your ${plan} plan. Consider upgrading to ${planMeta.upgrade_to}.`;
    }

    return NextResponse.json({
      plan,
      plan_meta: planMeta,
      cycle_start: cycleStart,
      totals,
      estimated_total: estimatedTotal.toFixed(2),
      suggestion,
    });

  } catch (err: any) {
    console.error("Billing summary error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
