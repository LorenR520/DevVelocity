import OpenAI from "openai";
import { buildAIPrompt } from "@/ai-builder/prompt";

export const runtime = "edge";

// ------------------------------
// Initialize GPT-5.1-Pro Client
// ------------------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * ============================================================
 * AI BUILDER ENGINE
 * - Generates brand-new infra architecture
 * ============================================================
 */
export async function runAIBuild(answers: any) {
  try {
    const prompt = buildAIPrompt(answers);

    const completion = await client.chat.completions.create({
      model: "gpt-5.1-pro",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are DevVelocity AI, a senior DevOps architect.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const output = completion.choices[0].message?.content;
    if (!output) {
      return { error: "AI returned no output." };
    }

    return JSON.parse(output);
  } catch (err: any) {
    console.error("AI Builder Error:", err);
    return { error: err.message ?? "AI builder failed." };
  }
}

/**
 * ============================================================
 * UPGRADE EXISTING FILE ENGINE
 * - Accepts pasted JSON / YAML / text infra
 * - Auto-corrects
 * - Modernizes
 * - Re-generates missing components
 * - Suggests upgrades
 * ============================================================
 */
export async function upgradeExistingFile({
  plan,
  fileContent,
}: {
  plan: string;
  fileContent: string;
}) {
  try {
    const systemPrompt = `
You are DevVelocity AI — a DevOps architect who upgrades outdated infra files.

Your responsibilities:
- detect format (JSON, YAML, text, cloud-init, pipelines, docker-compose)
- correct syntax
- rewrite into a modern unified DevVelocity format
- regenerate cloud-init
- regenerate docker-compose
- regenerate pipelines
- enforce plan tier limits
- suggest upgrades
- document breaking changes
- return clean JSON ALWAYS

Rules:
1. NEVER output invalid JSON.
2. NEVER output markdown.
3. ALWAYS output valid DevVelocity structure.
4. ALWAYS modernize best practices.
5. ALWAYS enforce plan tier limits.
6. ALWAYS include upgrade recommendations when features exceed the plan.
`;

    const userPrompt = `
PLAN TIER: ${plan}
------------------------------------
USER PASTED FILE:
------------------------------------
${fileContent}
------------------------------------

Return JSON matching:

{
  "upgraded_file": "...",
  "architecture": "...",
  "cloud_init": "...",
  "docker_compose": "...",
  "pipelines": "...",
  "changes_applied": "...",
  "upgrade_suggestions": "...",
  "warnings": "..."
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-5.1-pro",
      response_format: { type: "json_object" },
      temperature: 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const output = completion.choices[0].message?.content;
    if (!output) {
      return { error: "AI returned no output" };
    }

    return JSON.parse(output);
  } catch (err: any) {
    console.error("Upgrade Engine Error:", err);
    return { error: err.message ?? "Upgrade engine failed." };
  }
}
