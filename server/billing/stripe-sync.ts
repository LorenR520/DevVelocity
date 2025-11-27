// server/billing/stripe-sync.ts

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function updateUserBillingFromStripe(env: any) {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  const subscriptions = await stripe.subscriptions.list({
    status: "all",
    expand: ["data.customer"],
  });

  for (const sub of subscriptions.data) {
    const customer = sub.customer as any;
    const userId = customer.metadata.userId;

    await supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        billing_provider: "stripe",
        plan: sub.items.data[0].price.id,
        status: sub.status,
      },
    });
  }

  return true;
}
