/**
 * DevVelocity AI Context Builder
 *
 * This file:
 *  - Fetches scraped provider docs
 *  - Builds full context object for the AI model
 *  - Applies plan tier limits
 *  - Includes pricing limits + automation caps
 *  - Normalizes all data for prompt.ts
 */

import { createClient } from "@supabase/supabase-js";
import pricing from "@/marketing/pricing.json";
import { getPlan, getAllowedCapabilities } from "./plan-logic";

export async function buildContext(answers: any, env: any) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  const planId = answers.plan || "developer";
  const planMeta = getPlan(planId);
  const caps = getAllowedCapabilities(planId);

  // -------------------------------------------
  // 1) Load scraped docs for all selected providers
  // -------------------------------------------

  const selectedProviders = Array.isArray(answers[0])
    ? answers[0]
    : [answers[0]];

  const docs: Record<string, string> = {};

  for (const provider of selectedProviders) {
    const key = provider.toLowerCase().trim();

    const { data } = await supabase
      .from("provider_docs")
      .select("content")
      .eq("provider", key)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    docs[key] = data?.content || "No documentation available.";
  }

  // -------------------------------------------
  // 2) Normalize user input for AI model
  // -------------------------------------------

  const normalized = {
    cloud_provider: answers[0],
    automation_goals: answers[1],
    selected_providers: selectedProviders,
    maintenance_level: answers[3],
    budget: answers[4],
    requested_security: answers[5],
    build_type: answers[6],
    project_description: answers[7],
    plan_tier: planId,
  };

  // -------------------------------------------
  // 3) Add plan tier caps
  // -------------------------------------------

  const tierCaps = {
    provider_limit: planMeta.providers,
    seat_limit: planMeta.seats_included,
    builder_tier: planMeta.builder,
    sso_level: planMeta.sso,
    limits: planMeta.limits,
    metered: planMeta.metered,
  };

  // -------------------------------------------
  // 4) Build final AI context
  // -------------------------------------------

  const context = {
    user_input: normalized,
    tier_caps: tierCaps,
    provider_docs: docs,
    allowed_capabilities: caps,
    timestamp: new Date().toISOString(),
  };

  return context;
}
