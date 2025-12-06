// app/api/billing/tier/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * BILLING TIER LOOKUP
 * ---------------------------------------------------------
 * POST /api/billing/tier
 *
 * Inputs:
 *  {
 *    orgId: string
 *  }
 *
 * Returns:
 *  {
 *    plan: "developer" | "startup" | "team" | "enterprise",
 *    entitlements: { ... }
 *  }
 *
 * Used by:
 *  - UI feature locking
 *  - AI Builder behavior
 *  - File Portal permissions
 *  - Upgrade banner logic
 */

export async function POST(req: Request) {
  try {
    const { orgId } = await req.json();

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing orgId" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Supabase Admin Client
    // ---------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ---------------------------------------------------------
    // Load organization plan
    // ---------------------------------------------------------
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("plan_id")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const plan = org.plan_id ?? "developer";

    // ---------------------------------------------------------
    // Entitlement Mapping
    // ---------------------------------------------------------
    const ENTITLEMENTS: any = {
      developer: {
        ai_builder: false,
        downloads: false,
        version_history: false,
        regenerate: false,
        restore_versions: false,
        unlimited_projects: false,
      },
      startup: {
        ai_builder: true,
        downloads: true,
        version_history: true,
        regenerate: true,
        restore_versions: true,
        unlimited_projects: false,
      },
      team: {
        ai_builder: true,
        downloads: true,
        version_history: true,
        regenerate: true,
        restore_versions: true,
        unlimited_projects: true,
      },
      enterprise: {
        ai_builder: true,
        downloads: true,
        version_history: true,
        regenerate: true,
        restore_versions: true,
        unlimited_projects: true,
        sso: true,
        audit_logs: true,
        custom_models: true,
      },
    };

    return NextResponse.json({
      plan,
      entitlements: ENTITLEMENTS[plan] ?? ENTITLEMENTS["developer"],
    });
  } catch (err: any) {
    console.error("Tier check API error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
