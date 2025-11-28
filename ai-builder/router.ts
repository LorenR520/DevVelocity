import { buildAIPrompt } from "./prompt";
import { getAllowedCapabilities } from "./plan-logic";
import OpenAI from "openai";

/**
 * AI Builder Router
 * Handles:
 *  - answer validation
 *  - tier limitations
 *  - building final system prompt
 *  - calling OpenAI
 *  - returning full infra blueprint
 */

export async function runAIBuilder(answers: Record<number, any>) {
  try {
    // ----------------------------------------
    // 1. Validate required fields
    // ----------------------------------------
    const required = ["cloud", "automation", "providers", "budget", "project"];
    const missing = required.filter((r) => !(r in answers));

    if (missing.length > 0) {
      return {
        error: `Missing required fields: ${missing.join(", ")}`,
      };
    }

    // ----------------------------------------
    // 2. Read plan tier from session or answers
    // ----------------------------------------
    const plan = answers.plan || "developer";
    const caps = getAllowedCapabilities(plan);

    // ----------------------------------------
    // 3. Enforce provider limits
    // ----------------------------------------
    let validatedProviders = answers.providers || [];
    if (caps.providers !== "unlimited" && validatedProviders.length > caps.providers) {
      validatedProviders = validatedProviders.slice(0, caps.providers);
    }

    // ----------------------------------------
    // 4. Enforce security + SSO limits
    // ----------------------------------------
    let security = answers.security;
    if (caps.sso === "none" && security?.includes("sso")) {
      security = "email_only";
    }

    // ----------------------------------------
    // 5. Prepare final validated answer object
    // ----------------------------------------
    const finalAnswers = {
      ...answers,
      plan,
      providers: validatedProviders,
      security,
    };

    // ----------------------------------------
    // 6. Build system prompt (AI brain)
    // ----------------------------------------
    const systemPrompt = buildAIPrompt(finalAnswers);

    // ----------------------------------------
    // 7. OpenAI call
    // ----------------------------------------
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const response = await client.chat.completions.create({
      model: "gpt-4.1", // or your enterprise model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the full infrastructure output now." }
      ],
      temperature: 0.2,
      max_tokens: 6000,
    });

    const text = response.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text, error: "AI output was not valid JSON" };
    }

    // ----------------------------------------
    // 8. Return AI output for UI consumption
    // ----------------------------------------
    return {
      success: true,
      plan,
      capabilities: caps,
      output: parsed,
    };

  } catch (err: any) {
    console.error("AI Builder Router Error:", err);
    return {
      error: err.message || "AI Builder failed",
    };
  }
}
