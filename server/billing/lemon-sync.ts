// server/billing/lemon-sync.ts

import { createClient } from "@supabase/supabase-js";

export async function updateUserBillingFromLemon(env: any) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY || !env.LEMON_API_KEY) {
    console.error("❌ Missing required environment variables for Lemon Sync.");
    return false;
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  const endpoint = "https://api.lemonsqueezy.com/v1/subscriptions";

  let next = endpoint;
  let synced = 0;

  while (next) {
    const res = await fetch(next, {
      headers: {
        Authorization: `Bearer ${env.LEMON_API_KEY}`,
        Accept: "application/vnd.api+json",
      },
    });

    if (!res.ok) {
      console.error(`❌ Lemon API error: ${res.status}`);
      return false;
    }

    const json = await res.json();
    const subs = json.data || [];

    for (const s of subs) {
      const attr = s.attributes;

      const userId = attr.user_id; // your custom metadata passed at checkout
      const status = attr.status;
      const variantId = attr.variant_id;

      if (!userId) {
        console.warn("⚠️ Lemon subscription missing user_id metadata. Skipping.");
        continue;
      }

      // Write to Supabase user metadata
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "lemonsqueezy",
          plan: variantId,
          status,
        },
      });

      if (error) {
        console.error("❌ Supabase update failed:", error);
      } else {
        synced++;
      }
    }

    // Lemon pagination
    next = json.links?.next || null;
  }

  console.log(`🍋 LemonSync: Updated ${synced} subscription records.`);
  return true;
}
