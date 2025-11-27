import { updateUserBillingFromLemon } from "../../server/billing/lemon-sync";
import { updateUserBillingFromStripe } from "../../server/billing/stripe-sync";
import { syncUsage } from "../../server/billing/usage-sync";

export default {
  async scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext) {
    console.log("🔄 Running DevVelocity Billing Sync...");

    try {
      console.log("→ Syncing Lemon Squeezy subscriptions...");
      await updateUserBillingFromLemon(env);
      console.log("✓ Lemon sync OK");
    } catch (err) {
      console.error("❌ Lemon sync error:", err);
    }

    try {
      console.log("→ Syncing Stripe subscriptions...");
      await updateUserBillingFromStripe(env);
      console.log("✓ Stripe sync OK");
    } catch (err) {
      console.error("❌ Stripe sync error:", err);
    }

    try {
      console.log("→ Syncing usage-based billing...");
      await syncUsage(env);
      console.log("✓ Usage sync OK");
    } catch (err) {
      console.error("❌ Usage sync error:", err);
    }

    console.log("✅ Billing sync complete.");
  },
};
