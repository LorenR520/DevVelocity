// app/api/ai/builder/route.ts

import { NextResponse } from "next/server";
import { buildRecommendation } from "@/server/ai/recommendations";
import { generateTemplate } from "@/server/ai/builder-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      provider,
      budget,
      experience,
      environment,
      region,
      features,
      org_id,
    } = body;

    if (!provider || !budget || !experience) {
      return NextResponse.json(
        { error: "Missing required builder inputs." },
        { status: 400 }
      );
    }

    // 1. AI module selection
    const recommended = await buildRecommendation({
      provider,
      budget,
      experience,
      environment,
      region,
      features,
    });

    // 2. AI template generation (bash/cloud-init/YAML)
    const template = await generateTemplate({
      provider,
      recommended,
      environment,
      region,
    });

    return NextResponse.json({
      success: true,
      provider,
      recommended,
      template,
    });
  } catch (err: any) {
    console.error("AI Builder Error:", err);
    return NextResponse.json(
      { error: err.message ?? "AI Builder failed" },
      { status: 500 }
    );
  }
}
