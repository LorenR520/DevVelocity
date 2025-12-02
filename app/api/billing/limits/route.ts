import { NextResponse } from "next/server";

/**
 * BILLING LIMITS API
 * -----------------------------------------
 * Returns the usage limits for each plan tier.
 * 
 * Developer  → NO access to File Portal or Billing
 * Startup    → basic limits
 * Team       → expanded limits
 * Enterprise → effectively unrestricted
 */

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    if (!plan) {
      return NextResponse.json(
        { error: "Missing plan" },
        { status: 400 }
      );
    }

    // ------------------------------
    // Plan Limits Matrix
    // ------------------------------
    const limits = {
      developer: {
        pipelines: 0,
        provider_api_calls: 0,
        build_minutes: 0,
        ai_builds: 0,
        ai_upgrades: 0,
        can_use_file_portal: false,
        can_generate_ai: false,
        message: "Upgrade required to unlock usage features.",
      },

      startup: {
        pipelines: 50,
        provider_api_calls: 10_000,
        build_minutes: 200,
        ai_builds: 10,
        ai_upgrades: 10,
        can_use_file_portal: true,
        can_generate_ai: true,
      },

      team: {
        pipelines: 200,
        provider_api_calls: 100_000,
        build_minutes: 1_000,
        ai_builds: 50,
        ai_upgrades: 50,
        can_use_file_portal: true,
        can_generate_ai: true,
      },

      enterprise: {
        pipelines: 5_000,
        provider_api_calls: 1_000_000,
        build_minutes: 10_000,
        ai_builds: 1_000,
        ai_upgrades: 1_000,
        can_use_file_portal: true,
        can_generate_ai: true,
      },
    };

    // Fallback safety
    const selected = limits[plan] ?? limits.developer;

    return NextResponse.json({
      plan,
      limits: selected,
    });
  } catch (err: any) {
    console.error("Billing limits error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
