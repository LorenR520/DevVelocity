// server/ai/rate-limit.ts

/**
 * DevVelocity AI — Rate Limiting Engine
 * ---------------------------------------------------------
 * Ensures:
 *   ✓ Per-plan AI request limits
 *   ✓ Per-org cooldowns
 *   ✓ Anti-abuse throttling
 *   ✓ Smooth GPT-5.1 cost control
 */

import { createClient } from "@supabase/supabase-js";

// Maximum AI requests allowed per plan (per hour)
const PLAN_HOURLY_LIMITS = {
  developer: 10,     // paid, but limited
  startup: 50,
  team: 200,
  enterprise: Infinity,
};

// Cooldown window (in milliseconds)
const WINDOW = 60 * 60 * 1000; // 1 hour

export async function applyRateLimit(
  orgId: string,
  planId: string
): Promise<{
  allowed: boolean;
  reason?: string;
  remaining?: number;
}> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const limit = PLAN_HOURLY_LIMITS[planId] ?? PLAN_HOURLY_LIMITS["developer"];

  // Enterprise has no rate limit
  if (limit === Infinity) {
    return { allowed: true, remaining: Infinity };
  }

  const now = Date.now();
  const windowStart = new Date(now - WINDOW).toISOString();

  // ---------------------------------------------
  // Count requests in the last hour
  // ---------------------------------------------
  const { data: recent, error } = await supabase
    .from("ai_request_logs")
    .select("id, created_at")
    .eq("org_id", orgId)
    .gte("created_at", windowStart);

  if (error) {
    console.error("Rate limit read error:", error);
    return {
      allowed: false,
      reason: "Internal rate limit error",
    };
  }

  const used = recent?.length ?? 0;
  const remaining = limit - used;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `Hourly AI limit reached for your plan (${planId}).`,
      remaining: 0,
    };
  }

  // ---------------------------------------------
  // Log the new request
  // ---------------------------------------------
  await supabase.from("ai_request_logs").insert({
    org_id: orgId,
    created_at: new Date().toISOString(),
  });

  return {
    allowed: true,
    remaining,
  };
}
