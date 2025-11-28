import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildAIPrompt } from "@/ai-builder/prompt";
import pricing from "@/marketing/pricing.json";

export async function POST(req: Request) {
  try {
    const { fileContent, plan } = await req.json();

    if (!fileContent) {
      return NextResponse.json(
        { error: "Missing fileContent" },
        { status: 400 }
      );
    }

    // ----------------------------
    // 🧠 Extract metadata from file
    // ----------------------------

    const extracted = extractBuildMetadata(fileContent);

    // Create answers object for AI Builder reuse
    const answers: Record<number, any> = {
      0: extracted.cloud,
      1: extracted.automation,
      2: extracted.providers,
      3: extracted.maintenance,
      4: extracted.budget,
      5: extracted.security,
      6: extracted.buildType,
      7: extracted.project,
      plan: plan || "developer", // fallback
    };

    // Build the AI system prompt with new constraints
    const prompt = buildAIPrompt(answers);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    // ----------------------------------------------
    // 🧠 Send to OpenAI for NEW Build Regeneration
    // ----------------------------------------------
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            prompt +
            "\n\n# IMPORTANT\nUser provided an OLD file. You MUST detect outdated components and regenerate a fresh up-to-date architecture. Recommend upgrades if needed.\n",
        },
        {
          role: "user",
          content: fileContent,
        },
      ],
      temperature: 0.4,
    });

    const output =
      completion.choices?.[0]?.message?.content ||
      "AI failed to generate output.";

    return NextResponse.json({ output });
  } catch (err: any) {
    console.error("upgrade-file error", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Attempts to extract structure from old DevVelocity build files
 */
function extractBuildMetadata(file: string) {
  const safe = (pattern: RegExp, fallback: any) => {
    const found = file.match(pattern);
    return found ? found[1] : fallback;
  };

  return {
    cloud: safe(/Cloud Provider:\s*(.*)/i, "AWS"),
    automation: safe(/Automation:\s*(.*)/i, "basic"),
    providers: safe(/Providers:\s*\[(.*)\]/i, ["AWS"]),
    maintenance: safe(/Maintenance:\s*(.*)/i, "Minimal"),
    budget: safe(/Budget:\s*(.*)/i, "$25–$100"),
    security: safe(/Security:\s*(.*)/i, "basic"),
    buildType: safe(/Build Type:\s*(.*)/i, "API Backend"),
    project: safe(/Project Description:\s*([\s\S]*)/i, "General project"),
  };
}
