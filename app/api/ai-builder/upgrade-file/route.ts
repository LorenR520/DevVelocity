import { NextResponse } from "next/server";
import OpenAI from "openai";
import { rateLimitCheck } from "@/server/rate-limit";

// ------------------------------
// 🔐 OpenAI Client (GPT-5.1-PRO)
// ------------------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ------------------------------
// POST /api/ai-builder/upgrade-file
// ------------------------------
export async function POST(req: Request) {
  try {
    const { fileContent, plan } = await req.json();

    if (!fileContent) {
      return NextResponse.json(
        { error: "Missing fileContent input." },
        { status: 400 }
      );
    }

    // ------------------------------
    // 🔐 Rate Limiting
    // ------------------------------
    const rateExceeded = await rateLimitCheck("ai-upgrade-file");
    if (rateExceeded) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    // ------------------------------
    // 🧠 Build System Prompt
    // ------------------------------
    const systemPrompt = `
You are DevVelocity AI — an enterprise DevOps architect.

Your job is to analyze an OLD DevVelocity Infrastructure File and modernize it:

- apply up-to-date 2025 DevOps best practices  
- update cloud-init, docker-compose, and pipelines  
- refactor outdated patterns  
- improve automation and uptime  
- enhance security and SSO if allowed by plan  
- optimize multi-cloud or single-cloud selection  
- identify deprecated methods and replace with new ones  
- improve cost-efficiency  
- annotate improvements in comments  

# PLAN RESTRICTIONS
You MUST follow all feature limits for the user's plan: ${plan}

- Developer → 1 provider only, basic automation  
- Startup → up to 3 providers, advanced automation  
- Team → up to 7 providers, enterprise automation  
- Enterprise → unlimited providers, private automation, full security

NEVER exceed plan limits.
ALWAYS recommend upgrades if limitations prevent optimal output.

# INPUT FILE (OLD VERSION)
${fileContent}

# OUTPUT FORMAT (JSON EXACTLY)

{
  "summary": "...",
  "breaking_changes": [...],
  "improvements": [...],
  "updated_architecture": "...",
  "updated_cloud_init": "...",
  "updated_docker_compose": "...",
  "updated_pipelines": {
     "provider": "...",
     "automation": "..."
  },
  "security_upgrades": "...",
  "upgrade_recommendations": "...",
  "final_output_file": "..." 
}

Respond ONLY in JSON. Do not include backticks.
`;

    // ------------------------------
    // 🤖 GPT-5.1-PRO Call
    // ------------------------------
    const response = await client.chat.completions.create({
      model: "gpt-5.1-pro",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: "Analyze and upgrade the provided infrastructure file.",
        },
      ],
      max_tokens: 8000,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    // ------------------------------
    // Parse JSON Output
    // ------------------------------
    let output: any = null;
    try {
      output = JSON.parse(response.choices[0].message.content || "{}");
    } catch (err) {
      return NextResponse.json(
        { error: "AI returned invalid JSON format." },
        { status: 500 }
      );
    }

    // ------------------------------
    // Return Success
    // ------------------------------
    return NextResponse.json(
      {
        success: true,
        output,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}
