// cloudflare/cron/billing-sync.ts

import { updateUserBillingFromLemon } from "../../server/billing/lemon-sync";
import { updateUserBillingFromStripe } from "../../server/billing/stripe-sync";
import { syncUsage } from "../../server/billing/usage-sync";
import { billSeatOverages } from "../../server/billing/seats-bill";

// Cloudflare scheduled worker
export default {
  async scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext) {
    console.log("🔄 Running 15-minute billing sync...");

    try {
      // Lemon Squeezy → Supabase billing sync
      ctx.waitUntil(updateUserBillingFromLemon(env));
    } catch (err) {
      console.error("❌ Lemon billing sync failed:", err);
    }

    try {
      // Stripe → Supabase billing sync
      ctx.waitUntil(updateUserBillingFromStripe(env));
    } catch (err) {
      console.error("❌ Stripe billing sync failed:", err);
    }

    try {
      // Seat Overage Billing
      ctx.waitUntil(billSeatOverages(env));
    } catch (err) {
      console.error("❌ Seat overage billing failed:", err);
    }

    try {
      // Usage-based billing sync
      ctx.waitUntil(syncUsage(env));
    } catch (err) {
      console.error("❌ Usage sync failed:", err);
    }

    console.log("✅ Billing sync completed");

    return true;
  },
};
