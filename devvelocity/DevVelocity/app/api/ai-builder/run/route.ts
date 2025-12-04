import { NextResponse } from "next/server";

// If you're on Cloudflare → import Cloudflare AI
// If you're on Vercel → import OpenAI
// You can keep both, and we auto-select.

const useCloudflare = !!process.env.CF_ACCOUNT_ID;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // ⭐ AI MODEL SELECTION (tier-aware)
    // ---------------------------------------------
    const plan = "developer"; // can decode from user session later

    const modelMap: Record<string, string> = {
      developer: "gpt-4o-mini",
      startup: "gpt-4o",
      team: "gpt-4.1",
      enterprise: "gpt-4.1-pro"
    };

    const model = modelMap[plan] ?? "gpt-4o-mini";

    // ---------------------------------------------
    // ⭐ Cloudflare Runtime (Pages / Workers)
    // ---------------------------------------------
    if (useCloudflare) {
      const body = {
        model: `@cf/${model}`,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: "Generate the full architecture JSON." }
        ]
      };

      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const json = await cfRes.json();
      return NextResponse.json(json.result ?? json);
    }

    // ---------------------------------------------
    // ⭐ OpenAI Runtime (Vercel / Node)
    // ---------------------------------------------
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: "Generate the full architecture JSON." }
        ]
      }),
    });

    const json = await aiRes.json();

    try {
      // Return parsed JSON if LLM responded with JSON string
      const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
      return NextResponse.json(parsed);
    } catch {
      // Fallback: return raw content
      return NextResponse.json({
        raw: json.choices?.[0]?.message?.content ?? "",
      });
    }

  } catch (err: any) {
    console.error("AI Builder API ERROR:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
