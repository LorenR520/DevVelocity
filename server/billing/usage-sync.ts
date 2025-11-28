// server/billing/usage-sync.ts

import { createClient } from "@supabase/supabase-js";
import pricingData from "@/marketing/pricing.json";

export async function syncUsage(env: any) {
  try {
    console.log("🔄 Running usage meter sync...");

    const supabase = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_KEY!);

    // 1. Load all organizations
    const { data: orgs, error: orgErr } = await supabase
      .from("organizations")
      .select("*");

    if (orgErr || !orgs) {
      console.error("❌ Failed to load organizations:", orgErr);
      return false;
    }

    // 2. Loop each org
    for (const org of orgs) {
      const plan = pricingData.plans.find((p) => p.id === org.plan_id);

      if (!plan) {
        console.warn(`⚠️ No pricing found for plan: ${org.plan_id}`);
        continue;
      }

      if (!org.current_cycle_start) {
        console.warn(`⚠️ Org ${org.id} missing current_cycle_start. Skipping.`);
        continue;
      }

      // 3. Fetch usage logs for the billing cycle
      const { data: usageLogs, error: usageErr } = await supabase
        .from("usage_logs")
        .select("*")
        .eq("org_id", org.id)
        .gte("date", org.current_cycle_start);

      if (usageErr) {
        console.error("❌ Error fetching usage:", usageErr);
        continue;
      }

      const logs = usageLogs ?? [];

      // 4. Aggregate usage metrics
      const totalBuildMinutes = logs.reduce(
        (sum, u) => sum + Number(u.build_minutes ?? 0),
        0
      );

      const totalPipelines = logs.reduce(
        (sum, u) => sum + Number(u.pipelines_run ?? 0),
        0
      );

      const totalApiCalls = logs.reduce(
        (sum, u) => sum + Number(u.provider_api_calls ?? 0),
        0
      );

      // 5. Hard-coded limits (move to pricing.json later)
      const LIMITS = {
        build_minutes: 1000, // monthly
        pipelines: 200, // monthly
        api_calls: 50000, // monthly
      };

      const overBuild = Math.max(0, totalBuildMinutes - LIMITS.build_minutes);
      const overPipelines = Math.max(0, totalPipelines - LIMITS.pipelines);
      const overApi = Math.max(0, totalApiCalls - LIMITS.api_calls);

      if (overBuild === 0 && overPipelines === 0 && overApi === 0) {
        continue; // nothing to charge
      }

      // 6. Rates for overage
      const buildRate = 0.02; // per minute
      const pipelineRate = 0.15; // per pipeline
      const apiRate = 0.0001; // per API call

      const buildCharge = overBuild * buildRate;
      const pipelineCharge = overPipelines * pipelineRate;
      const apiCharge = overApi * apiRate;

      const amount = Number(
        (buildCharge + pipelineCharge + apiCharge).toFixed(2)
      );

      // 7. Insert a billing event
      const { error: billErr } = await supabase.from("billing_events").insert({
        org_id: org.id,
        type: "usage_overage",
        amount,
        details: {
          plan: plan.id,
          over_build_minutes: overBuild,
          over_pipelines: overPipelines,
          over_api_calls: overApi,
          total_build_minutes: totalBuildMinutes,
          total_pipelines: totalPipelines,
          total_api_calls: totalApiCalls,
        },
      });

      if (billErr) {
        console.error("❌ Failed to insert billing event:", billErr);
        continue;
      }

      // 8. Add to pending overage
      const newPending =
        Number(org.pending_overage_amount ?? 0) + Number(amount);

      await supabase
        .from("organizations")
        .update({
          pending_overage_amount: newPending,
        })
        .eq("id", org.id);

      console.log(
        `📈 Overage billed → Org ${org.id} | Amount: $${amount} | New Pending: $${newPending}`
      );
    }

    console.log("✅ Usage sync completed.");
    return true;
  } catch (err) {
    console.error("❌ usage-sync crashed:", err);
    return false;
  }
}
