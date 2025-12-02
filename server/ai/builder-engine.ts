import OpenAI from "openai";
import { buildAIPrompt } from "@/ai-builder/prompt";

// GPT-5.1-Pro client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Main DevVelocity Architecture Builder
 * Generates:
 *  - infra architecture
 *  - docker
 *  - cloud-init
 *  - pipelines
 *  - security model
 *  - maintenance
 *  - upgrade hints
 */
export async function runBuilderEngine(params: {
  answers: Record<number, any>;
}) {
  const { answers } = params;

  const systemPrompt = buildAIPrompt(answers);

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
            "Generate the complete infrastructure plan JSON according to the required format.",
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "";

    // Try to parse JSON safely
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      parsed = {
        error: "AI did not return valid JSON.",
        raw,
      };
    }

    return parsed;
  } catch (err: any) {
    console.error("runBuilderEngine error:", err);
    throw new Error("AI Builder engine failed.");
  }
}
