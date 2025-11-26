// server/billing/lemon-sync.ts

import { createClient } from "@supabase/supabase-js";

export async function updateUserBillingFromLemon(env: any) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  const apiKey = env.LEMON_API_KEY;

  const res = await fetch("https://api.lemonsqueezy.com/v1/subscriptions", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/vnd.api+json",
    },
  });

  const json = await res.json();
  const subs = json.data || [];

  for (const s of subs) {
    const userId = s.attributes.user_id;
    const status = s.attributes.status;
    const variantId = s.attributes.variant_id;

    await supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        billing_provider: "lemonsqueezy",
        plan: variantId,
        status,
      },
    });
  }

  return true;
}
