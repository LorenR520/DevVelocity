// server/ai/builder-engine.ts

/**
 * DevVelocity AI Builder Engine
 *
 * Provides two modes:
 *  - "build" → generate a fresh architecture from questionnaire answers
 *  - "upgrade" → update an older saved architecture file
 *
 * Works on Cloudflare Pages (no Node SDK dependencies).
 */

import { buildAIPrompt } from "@/ai-builder/prompt";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

interface BuilderRequest {
  mode: "build" | "upgrade";
  answers?: any;
  oldFile?: any;
  plan: string;
}

export async function runBuilderEngine(input: BuilderRequest) {
  try {
    let systemPrompt = "";
    let userPrompt = "";

    // --------------------------------------------
    // MODE: BUILD (normal questionnaire generation)
    // --------------------------------------------
    if (input.mode === "build") {
      systemPrompt = buildAIPrompt(input.answers || {});
      userPrompt = "Generate the architecture based on the answers.";
    }

    // --------------------------------------------
    // MODE: UPGRADE (pasted older file)
    // --------------------------------------------
    if (input.mode === "upgrade") {
      systemPrompt = `
You are DevVelocity AI Upgrade Engine.

Your job is to analyze an older DevVelocity architecture file and:

- detect outdated cloud-init
- detect old docker-compose patterns
- modernize CI/CD pipelines
- update best practices per provider
- enforce the user's plan tier limits
- recommend when their architecture exceeds their plan
- produce a brand new architecture (same JSON layout)
- NEVER remove required sections
- ALWAYS produce runnable code
- ALWAYS optimize for the original architecture's intent

Plan Tier: ${input.plan}

Old File:
${JSON.stringify(input.oldFile, null, 2)}

If the file is missing sections, rebuild them automatically.
If the build exceeds tier limits, downgrade it AND recommend an upgrade.
`;

      userPrompt = "Upgrade and regenerate this architecture now.";
    }

    // --------------------------------------------
    // Execute edge-compatible OpenAI call
    // --------------------------------------------
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        ok: false,
        error: "OPENAI_API_KEY is missing.",
      };
    }

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const txt = await response.text();
      return {
        ok: false,
        error: "OpenAI API error: " + txt,
      };
    }

    const data = await response.json();
    const output = JSON.parse(data.choices[0].message.content);

    // --------------------------------------------
    // Done
    // --------------------------------------------
    return {
      ok: true,
      output,
      upgradeHints: output?.upgrade_paths || [],
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message || "Builder Engine Error",
    };
  }
}
