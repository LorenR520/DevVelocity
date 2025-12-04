// app/api/billing/upgrade-plan/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * UPGRADE SUBSCRIPTION PLAN
 * -----------------------------------------------------
 * Accepts:
 *   - orgId
 *   - newPlan ("startup" | "team" | "enterprise")
 *   - provider ("stripe" | "lemon")
 *
 * Performs:
 *   1. validates org
 *   2. updates organizations.plan_id
 *   3. logs upgrade event
 *   4. returns checkout URL (Stripe/Lemon)
 */

export async function POST(req: Request) {
  try {
    const { orgId, newPlan, provider } = await req.json();

    if (!orgId || !newPlan || !provider) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // Initialize Supabase Admin Client
    // ----------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ----------------------------------------
    // Validate organization exists
    // ----------------------------------------
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found." },
        { status: 404 }
      );
    }

    // ----------------------------------------
    // Update plan tier in DB
    // ----------------------------------------
    await supabase
      .from("organizations")
      .update({ plan_id: newPlan })
      .eq("id", orgId);

    // ----------------------------------------
    // Log usage event
    // ----------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      event: `plan_upgrade_to_${newPlan}`,
      date: new Date().toISOString(),
    });

    // ----------------------------------------
    // Generate provider checkout link
    // ----------------------------------------
    let checkoutUrl = null;

    // ---------- Stripe ----------
    if (provider === "stripe") {
      const stripePrice = {
        startup: process.env.STRIPE_PRICE_STARTUP!,
        team: process.env.STRIPE_PRICE_TEAM!,
        enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
      }[newPlan];

      checkoutUrl = `https://billing.stripe.com/p/login/${stripePrice}`;
    }

    // ---------- Lemon Squeezy ----------
    if (provider === "lemon") {
      const lemonVariant = {
        startup: process.env.LEMON_VARIANT_STARTUP!,
        team: process.env.LEMON_VARIANT_TEAM!,
        enterprise: process.env.LEMON_VARIANT_ENTERPRISE!,
      }[newPlan];

      checkoutUrl = `${process.env.LEMON_CHECKOUT_URL_BASE}/${lemonVariant}`;
    }

    return NextResponse.json({
      success: true,
      message: `Upgraded to ${newPlan}`,
      checkoutUrl,
    });
  } catch (err: any) {
    console.error("upgrade-plan error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
