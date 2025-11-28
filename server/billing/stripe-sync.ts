// server/billing/stripe-sync.ts

/**
 * IMPORTANT:
 * Stripe official SDK does NOT work on Cloudflare Workers.
 * This uses the Stripe REST API directly via fetch().
 */

import { createClient } from "@supabase/supabase-js";

export async function updateUserBillingFromStripe(env: any) {
  if (!env.STRIPE_SECRET_KEY || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.error("❌ Missing STRIPE or SUPABASE environment variables.");
    return false;
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  let url =
    "https://api.stripe.com/v1/subscriptions?limit=100&expand[]=data.customer";

  let synced = 0;

  while (url) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      },
    });

    if (!res.ok) {
      console.error("❌ Stripe API error:", res.status);
      return false;
    }

    const data = await res.json();

    for (const sub of data.data || []) {
      const customer = sub.customer;
      if (!customer || !customer.metadata || !customer.metadata.userId) {
        console.warn("⚠️ Stripe subscription missing userId metadata. Skipping.");
        continue;
      }

      const userId = customer.metadata.userId;
      const status = sub.status;
      const priceId = sub.items?.data?.[0]?.price?.id;

      if (!priceId) {
        console.warn("⚠️ Stripe subscription missing priceId. Skipping.");
        continue;
      }

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "stripe",
          plan: priceId,
          status,
        },
      });

      if (error) {
        console.error("❌ Failed to update Supabase user:", error);
      } else {
        synced++;
      }
    }

    // Stripe pagination
    if (data.has_more && data.data.length > 0) {
      const lastId = data.data[data.data.length - 1].id;
      url = `https://api.stripe.com/v1/subscriptions?limit=100&starting_after=${lastId}&expand[]=data.customer`;
    } else {
      url = null;
    }
  }

  console.log(`💳 StripeSync: Updated ${synced} subscription records.`);
  return true;
}
