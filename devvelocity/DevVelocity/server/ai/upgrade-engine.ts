import OpenAI from "openai";
import { buildAIPrompt } from "@/ai-builder/prompt";

/**
 * DevVelocity File Upgrade Engine
 *
 * This engine reads a *pasted old file*, analyzes it,
 * determines what components are outdated, and regenerates
 * an updated version using GPT-5.1-Pro.
 *
 * It enforces plan limitations and includes upgrade hints.
 */

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function runUpgradeEngine(params: {
  originalFile: string;
  plan: string;
}) {
  const { originalFile, plan } = params;

  // ---------------------------
  // 🧠 Parse Old File JSON Safely
  // ---------------------------
  let parsedInput: any = null;

  try {
    parsedInput = JSON.parse(originalFile);
  } catch {
    parsedInput = {
      error: "Could not parse old file. Treating input as raw text.",
      raw: originalFile,
    };
  }

  // ---------------------------
  // 🧠 Create System Prompt
  // ---------------------------
  const systemPrompt = `
You are DevVelocity AI — GPT-5.1-Pro Edition.
Your job is to *upgrade old DevVelocity AI Builder output files*.

### Your responsibilities:
1. Identify outdated items in:
   - architecture
   - cloud-init
   - docker-compose
   - pipelines
   - security model
   - budget
   - maintenance plan
2. Apply DevVelocity plan limits:
   - provider caps
   - automation caps
   - security caps
   - SSO caps
   - builder tier limits
3. Suggest specific upgrade paths if limits are exceeded.
4. Preserve intent while modernizing the build.
5. Rewrite EVERYTHING using the latest DevVelocity AI standard.

### Input File:
${JSON.stringify(parsedInput, null, 2)}

### Plan Tier:
${plan}

### Output Requirements:
Respond ONLY with valid JSON:

{
  "summary": "...",
  "architecture": "...",
  "cloud_init": "...",
  "docker_compose": "...",
  "pipelines": { ... },
  "maintenance_plan": "...",
  "sso_recommendations": "...",
  "security_model": "...",
  "budget_projection": "...",
  "upgrade_paths": "...",
  "next_steps": "..."
}

### Rules:
- NEVER output placeholders.
- ALWAYS modernize the output.
- ALWAYS enforce plan limits.
- ALWAYS give upgrade suggestions when needed.
- ALWAYS produce runnable cloud-init + docker-compose.
- ALWAYS validate JSON correctness.
`;


  // ---------------------------
  // 🧠 Run GPT-5.1-Pro
  // ---------------------------
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-5.1-pro",
      temperature: 0.1,
      max_tokens: 6000,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Upgrade this DevVelocity architecture file. Apply all modern recommendations and rebuild the entire output.",
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        error: "AI did not return valid JSON.",
        raw,
      };
    }

    return parsed;
  } catch (err: any) {
    console.error("runUpgradeEngine error:", err);
    throw new Error("Upgrade Engine failed.");
  }
}
