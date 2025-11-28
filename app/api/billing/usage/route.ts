import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import pricing from "@/marketing/pricing.json";

// This API returns:
//  - Total usage for current cycle
//  - Plan limits
//  - Overage amounts (if any)
//  - Usage breakdown for charts

export async function GET(req: Request) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // ------------------------------
    // 1. Get current user session
    // ------------------------------
    const token =
      req.headers.get("Authorization")?.replace("Bearer ", "") ?? null;

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ------------------------------
    // 2. Load user’s organization
    // ------------------------------
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", user.app_metadata.org_id)
      .single();

    if (!org) {
      return NextResponse.json({ error: "Org not found" }, { status: 404 });
    }

    const plan = pricing.plans.find((p) => p.id === org.plan_id);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // ------------------------------
    // 3. Fetch usage logs for cycle
    // ------------------------------
    const { data: usageLogs } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("org_id", org.id)
      .gte("date", org.current_cycle_start)
      .order("date", { ascending: true });

    const usage = usageLogs ?? [];

    // Sum totals
    const totalBuildMinutes = usage.reduce(
      (s, u) => s + u.build_minutes,
      0
    );

    const totalPipelines = usage.reduce((s, u) => s + u.pipelines_run, 0);

    const totalApiCalls = usage.reduce((s, u) => s + u.provider_api_calls, 0);

    // ------------------------------
    // 4. Calculate overages
    // ------------------------------
    const overBuild = Math.max(
      0,
      totalBuildMinutes - plan.limits.build_minutes
    );

    const overPipelines = Math.max(0, totalPipelines - plan.limits.pipelines);

    const overApi = Math.max(0, totalApiCalls - plan.limits.api_calls);

    const amount =
      overBuild * plan.metered.build_minute_price +
      overPipelines * plan.metered.pipeline_price +
      overApi * plan.metered.api_call_price;

    // ------------------------------
    // 5. Return final response
    // ------------------------------
    return NextResponse.json({
      plan: plan.id,
      cycle_start: org.current_cycle_start,

      totals: {
        build_minutes: totalBuildMinutes,
        pipelines: totalPipelines,
        api_calls: totalApiCalls,
      },

      limits: {
        build_minutes: plan.limits.build_minutes,
        pipelines: plan.limits.pipelines,
        api_calls: plan.limits.api_calls,
      },

      overages: {
        build_minutes: overBuild,
        pipelines: overPipelines,
        api_calls: overApi,
        amount,
      },

      logs: usage,
    });
  } catch (err) {
    console.error("Usage API error:", err);
    return NextResponse.json(
      { error: "Internal error", details: String(err) },
      { status: 500 }
    );
  }
}
