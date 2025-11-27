// server/billing/usage-sync.ts

import { createClient } from "@supabase/supabase-js";
import pricing from "@/marketing/pricing.json";

export async function syncUsage(env: any) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  console.log("🔄 Running usage meter sync...");

  // Fetch all orgs
  const { data: orgs, error: orgErr } = await supabase
    .from("organizations")
    .select("*");

  if (orgErr || !orgs) {
    console.error("Failed to load organizations:", orgErr);
    return;
  }

  for (const org of orgs) {
    const plan = pricing.plans.find((p) => p.id === org.plan_id);

    if (!plan) continue;

    const { data: usage, error: usageErr } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("org_id", org.id)
      .gte("date", org.current_cycle_start);

    if (usageErr) {
      console.error("Error fetching usage:", usageErr);
      continue;
    }

    const totalBuildMinutes =
      usage?.reduce((sum, u) => sum + u.build_minutes, 0) ?? 0;

    const totalPipelines =
      usage?.reduce((sum, u) => sum + u.pipelines_run, 0) ?? 0;

    const totalApiCalls =
      usage?.reduce((sum, u) => sum + u.provider_api_calls, 0) ?? 0;

    // Hard-coded limits (you can move to pricing.json later)
    const overBuild = Math.max(0, totalBuildMinutes - 1000);
    const overPipelines = Math.max(0, totalPipelines - 200);
    const overApi = Math.max(0, totalApiCalls - 50000);

    if (overBuild === 0 && overPipelines === 0 && overApi === 0) continue;

    const buildCharge = overBuild * 0.02;
    const pipelineCharge = overPipelines * 0.15;
    const apiCharge = overApi * 0.0001;

    const amount = buildCharge + pipelineCharge + apiCharge;

    await supabase.from("billing_events").insert({
      org_id: org.id,
      type: "usage_overage",
      amount,
      details: {
        over_build_minutes: overBuild,
        over_pipelines: overPipelines,
        over_api_calls: overApi,
        total_build_minutes: totalBuildMinutes,
        total_pipelines: totalPipelines,
        total_api_calls: totalApiCalls,
      },
    });

    await supabase
      .from("organizations")
      .update({
        pending_overage_amount:
          (org.pending_overage_amount ?? 0) + amount,
      })
      .eq("id", org.id);
  }

  console.log("✅ Usage sync completed");
}
