// app/api/ai-builder/upgrade-file/route.ts

import { NextResponse } from "next/server";
import { upgradeArchitectureFile } from "@/server/ai/file-upgrader";
import { createClient } from "@supabase/ssr";
import { getPlan } from "@/ai-builder/plan-logic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { oldFile, plan, org_id } = body;

    if (!oldFile) {
      return NextResponse.json(
        { error: "No file provided for upgrade." },
        { status: 400 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { error: "Missing plan tier." },
        { status: 400 }
      );
    }

    // 🔐 Create supabase client via cookies (Cloudflare-safe)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return req.headers.get("Cookie") || "";
          },
        },
      }
    );

    // -----------------------------------------------
    // validate user session + org_id
    // -----------------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    if (!org_id) {
      return NextResponse.json(
        { error: "Missing organization ID." },
        { status: 400 }
      );
    }

    // -----------------------------------------------
    // Validate plan
    // -----------------------------------------------
    const planInfo = getPlan(plan);
    if (!planInfo) {
      return NextResponse.json(
        { error: "Invalid plan tier." },
        { status: 400 }
      );
    }

    // -----------------------------------------------
    // Perform upgrade using AI
    // -----------------------------------------------
    const result = await upgradeArchitectureFile(oldFile, plan);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // -----------------------------------------------
    // Log activity usage (counts against plan)
    // -----------------------------------------------
    await supabase
      .from("ai_activity_log")
      .insert({
        org_id,
        user_id: user.id,
        action: "upgrade_file",
        metadata: { old_size: JSON.stringify(oldFile).length },
      });

    return NextResponse.json({
      success: true,
      upgraded: result.upgraded,
    });
  } catch (err: any) {
    console.error("Upgrade File API Error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
