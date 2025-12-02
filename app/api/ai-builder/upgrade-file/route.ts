import { NextResponse } from "next/server";
import { buildUpgradePrompt } from "@/ai-builder/upgrade-prompt";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/ai-builder/upgrade-file
 * Upgrades an old JSON file using AI + enforces tier/plan limits.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { oldContent, plan = "developer", fileId } = body;

    if (!oldContent) {
      return NextResponse.json(
        { error: "Missing oldContent." },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 🔐 Initialize Supabase Admin
    // -----------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -----------------------------------------
    // 🧠 Build the SYSTEM PROMPT
    // -----------------------------------------
    const systemPrompt = buildUpgradePrompt(oldContent, plan);

    // -----------------------------------------
    // 🤖 Initialize OpenAI GPT-4.1-Pro
    // -----------------------------------------
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-pro",  
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: oldContent },
      ],
      temperature: 0.2,
    });

    const upgraded = completion.choices?.[0]?.message?.content;

    if (!upgraded) {
      return NextResponse.json(
        { error: "AI did not return an upgraded file." },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // 🗂 Save as a NEW VERSION (version history)
    // -----------------------------------------
    if (fileId) {
      await supabase
        .from("file_version_history")
        .insert({
          file_id: fileId,
          org_id: null, // filled automatically via RLS if you enabled it
          old_content: oldContent,
          new_content: upgraded,
        });
    }

    // -----------------------------------------
    // 🧾 Metering charge: AI Upgrade Action
    // Adds cost to billing_events table
    // -----------------------------------------
    await supabase.from("billing_events").insert({
      org_id: null, // RLS fills it in 
      type: "ai_file_upgrade",
      amount: 0.005, // 0.5¢ per upgrade (you can change)
      details: { fileId },
    });

    return NextResponse.json({
      upgraded,
      message: "Upgrade successful",
    });

  } catch (err: any) {
    console.error("Upgrade error:", err);
    return NextResponse.json(
      { error: err.message || "Upgrade failed" },
      { status: 500 }
    );
  }
}
