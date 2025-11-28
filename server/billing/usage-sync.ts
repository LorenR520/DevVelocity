// server/billing/usage-sync.ts

import { createClient } from "@supabase/supabase-js";
import pricingData from "@/marketing/pricing.json";

interface Plan {
  id: string;
  name: string;
  price: number;
  providers: number | string;
  updates: string;
  builder: string;
  sso: string;
  seats_included: number | string;
  seat_price: number | string;
}

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

    // 2. Iterate org-by-org and apply usage logic
    for (const org of orgs) {
      const plan: Plan | undefined = pricingData.plans.find(
        (p: Plan) => p.id === org.plan_id
      );

      if (!plan) {
        console.warn(`⚠️ No pricing rule found for plan "${org.plan_id}"`);
        continue;
      }

      // 3. Ensure org has a cycle start
      if (!org.current_cycle_start) {
        console.warn(`⚠️ No current cycle start set for org ${org.id}. Skipping.`);
        continue;
      }

      // 4. Get usage logs within billing cycle window
      const { data: usageLogs, error: usageErr } = await supabase
        .from("usage_logs")
        .select("*")
        .eq("org_id", org.id)
        .gte("date", org.current_cycle_start);

      if (usageErr) {
        console.error("❌ Error fetching usage logs:", usageErr);
        continue;
      }

      // Usage might be empty but still valid
      const logs = usageLogs ?? [];

      // 5. Summaries for metering
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

      // 6. Hard-coded limits — move into pricing.json later
      const LIMITS = {
        build_minutes: 1000,
        pipelines: 200,
        api_calls: 50000,
      };

      const overBuild = Math.max(0, totalBuildMinutes - LIMITS.build_minutes);
      const overPipelines = Math.max(
        0,
        totalPipelines - LIMITS.pipelines
      );
      const overApi = Math.max(0, totalApiCalls - LIMITS.api_calls);

      if (overBuild === 0 && overPipelines === 0 && overApi === 0) {
        continue; // No overages
      }

      // 7. Pricing coefficients (should move to pricing.json later)
      const buildRate = 0.02; // per minute
      const pipelineRate = 0.15;
      const apiRate = 0.0001;

      const buildCharge = overBuild * buildRate;
      const pipelineCharge = overPipelines * pipelineRate;
      const apiCharge = overApi * apiRate;

      const amount = Number(
        (buildCharge + pipelineCharge + apiCharge).toFixed(2)
      );

      // 8. Insert billing event
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
        console.error("❌ billing_events insert failed:", billErr);
      }

      // 9. Update pending overage
      const newPending =
        Number(org.pending_overage_amount ?? 0) + Number(amount);

      await supabase
        .from("organizations")
        .update({
          pending_overage_amount: newPending,
        })
        .eq("id", org.id);

      console.log(
        `📈 Overage billed → Org: ${org.id} | $${amount} | New Pending: $${newPending}`
      );
    }

    console.log("✅ Usage sync completed");
    return true;
  } catch (err) {
    console.error("❌ usage-sync.ts crashed:", err);
    return false;
  }
}
