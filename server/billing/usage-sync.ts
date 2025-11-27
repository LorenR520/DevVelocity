import { createClient } from "@supabase/supabase-js";
import pricing from "@/marketing/pricing.json";

export async function syncUsage(env: any) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  console.log("🔄 Syncing usage...");

  // Fetch all active users
  const { data: users } = await supabase.auth.admin.listUsers();

  for (const user of users) {
    const planId = user.app_metadata?.plan;
    const plan = pricing.plans.find(p => p.id === planId);

    if (!plan) continue;

    // TODO: Replace this with actual pipeline/build usage
    const fakeUsage = Math.floor(Math.random() * 100); // placeholder

    const included =
      plan.usage_included ?? 50; // default usage limit

    const overage = fakeUsage > included
      ? fakeUsage - included
      : 0;

    // Store usage data
    await supabase
      .from("usage_logs")
      .insert({
        user_id: user.id,
        plan: planId,
        usage: fakeUsage,
        overage,
        period: new Date().toISOString().slice(0, 10),
      });

    console.log(`📊 Usage for ${user.email}: ${fakeUsage} units`);
  }

  console.log("✅ Usage sync complete");
}
