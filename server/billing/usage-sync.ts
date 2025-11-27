// server/billing/usage-sync.ts

import { createClient } from "@supabase/supabase-js";
import pricing from "@/marketing/pricing.json";

export async function syncUsage(env: any) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  console.log("🔄 Running usage meter sync...");

  // Get all organizations with a plan
  const { data: orgs } = await supabase.from("organizations").select("*");

  if (!orgs) return;

  for (const org of orgs) {
    const plan = (pricing as any).plans.find((p:any) => p.id === org.plan_id);

    if (!plan) continue;

    // Fetch usage in the last billing cycle
    const { data: usage } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("org_id", org.id)
      .gte("date", org.current_cycle_start);

    const totalBuildMinutes = usage?.reduce(
      (sum: number, log: any) => sum + log.build_minutes,
      0
    ) ?? 0;

    const totalPipelines = usage?.reduce(
      (sum: number, log: any) => sum + log.pipelines_run,
      0
    ) ?? 0;

    const totalApiCalls = usage?.reduce(
      (sum: number, log: any) => sum + log.provider_api_calls,
      0
    ) ?? 0;

    // Compare usage to plan limits
    const overBuildMinutes = Math.max(0, totalBuildMinutes - 1000);
    const overPipelines = Math.max(0, totalPipelines - 200);
    const overApiCalls = Math.max(0, totalApiCalls - 50000);

    // If nothing exceeded → skip
    if (overBuildMinutes === 0 && overPipelines === 0 && overApiCalls === 0)
      continue;

    // Calculate charges
    const buildCharge = overBuildMinutes * 0.02;
    const pipelineCharge = overPipelines * 0.15;
    const apiCharge = overApiCalls * 0.0001;

    const totalCharge = buildCharge + pipelineCharge + apiCharge;

    // Record overage event
    await supabase.from("billing_events").insert({
      org_id: org.id,
      type: "usage_overage",
      amount: totalCharge,
      details: {
        overBuildMinutes,
        overPipelines,
        overApiCalls,
      },
    });

    console.log(`⚠️ Usage Overages Found for ${org.id} → $${totalCharge}`);

    // Add to org billing queue
    await supabase
      .from("organizations")
      .update({
        pending_overage_amount:
          (org.pending_overage_amount ?? 0) + totalCharge,
      })
      .eq("id", org.id);
  }

  console.log("✅ Usage sync complete");
}
