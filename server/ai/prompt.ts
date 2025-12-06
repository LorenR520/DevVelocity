/**
 * DevVelocity — AI Prompt Engine
 * ---------------------------------------------------------
 * Generates:
 *   ✓ Builder prompts
 *   ✓ Architecture upgrade prompts
 *   ✓ Provider expansion prompts
 *   ✓ Tier-aware instructions
 *
 * All prompts automatically adapt to the user's plan tier.
 */

import marketing from "@/marketing/pricing.json";
import { getPlan } from "./plan-logic";

/**
 * Build the main AI Builder prompt.
 */
export function buildAIPrompt(answers: any): string {
  const plan = getPlan(answers.plan ?? "developer");

  return `
You are DevVelocity — an autonomous multi-cloud infrastructure engine.

User Plan: ${plan?.name} (${answers.plan})
Provider: ${answers.provider}
Budget: ${answers.budget}
Experience Level: ${answers.experience}
Environment: ${answers.environment}
Region: ${answers.region}
Features: ${JSON.stringify(answers.features, null, 2)}

Your job:
1. Generate a full cloud architecture aligned with the customer's plan tier.
2. Respect the provider limit:
   - Developer: ${plan?.providers}
   - Startup: ${plan?.providers}
   - Team: ${plan?.providers}
   - Enterprise: unlimited
3. Respect plan automation capabilities.
4. Output ONLY a JSON object
