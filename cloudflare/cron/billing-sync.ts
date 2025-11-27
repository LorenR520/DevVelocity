// cloudflare/cron/billing-sync.ts

import { updateUserBillingFromLemon } from "../../server/billing/lemon-sync";
import { updateUserBillingFromStripe } from "../../server/billing/stripe-sync";
import { billSeatOverages } from "@/server/billing/seats-bill";

export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {

    console.log("🔄 Running 15-minute billing sync...");

    // Sync Lemon Squeezy subscriptions
    await updateUserBillingFromLemon(env);

    // Sync Stripe subscriptions
    await updateUserBillingFromStripe(env);
    await billSeatOverages(env);

    console.log("✅ Billing sync completed");
  }
};
