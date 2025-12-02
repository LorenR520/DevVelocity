// server/ai/rate-limit.ts

/**
 * DevVelocity AI Rate Limiter
 * ------------------------------------------
 * Prevents unlimited use abuse while allowing:
 *  - higher limits for bigger plans
 *  - near-unrestricted access for enterprise
 *  - per-minute safety throttle
 *  - tracked usage in Supabase billing_events
 *
 * This protects your OpenAI bill.
 */

import { createClient } from "@supabase/supabase-js";

export async function applyRateLimit(orgId: string, plan: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // -----------------------------------
  // PLAN LIMITS PER MINUTE
  // -----------------------------------
  const limits: Record<string, any> = {
    developer: { perMinute: 2, maxDaily: 25 },
    startup:   { perMinute: 5, maxDaily: 120 },
    team:      { perMinute: 12, maxDaily: 400 },
    enterprise:{ perMinute: 9999, maxDaily: 999999 }
  };

  const cap = limits[plan] || limits.developer;

  // -----------------------------------
  // Check last 1 minute usage
  // -----------------------------------
  const { data: recent, error: recentErr } = await supabase
    .from("billing_events")
    .select("*")
    .eq("org_id", orgId)
    .eq("type", "ai_usage")
    .gte("created_at", new Date(Date.now() - 60_000).toISOString());

  if (recentErr) {
    console.error("Rate limit check error:", recentErr);
    return { allowed: true };
  }

  if (recent && recent.length >= cap.perMinute) {
    return {
      allowed: false,
      reason: `Rate limit exceeded. Your plan allows ${cap.perMinute} requests per minute.`,
    };
  }

  // -----------------------------------
  // Check daily limit
  // -----------------------------------
  const { data: daily, error: dailyErr } = await supabase
    .from("billing_events")
    .select("*")
    .eq("org_id", orgId)
    .eq("type", "ai_usage")
    .gte(
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    );

  if (dailyErr) {
    console.error("Daily limit error:", dailyErr);
    return { allowed: true };
  }

  if (daily && daily.length >= cap.maxDaily) {
    return {
      allowed: false,
      reason: `Daily AI usage limit reached for ${plan} plan.`,
    };
  }

  // -----------------------------------
  // If allowed → record usage
  // -----------------------------------
  await supabase.from("billing_events").insert({
    org_id: orgId,
    type: "ai_usage",
    amount: 1,
    details: { note: "AI Builder request" },
  });

  return { allowed: true };
}
