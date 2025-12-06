// app/api/billing/upgrade-session/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/**
 * CREATE UPGRADE CHECKOUT SESSION
 * ------------------------------------------------------------
 * POST /api/billing/upgrade-session
 *
 * Input:
 *  {
 *    orgId: string,
 *    newPlan: "startup" | "team" | "enterprise",
 *    billingProvider: "stripe" | "lemon"
 *  }
 *
 * Output:
 *  { url: "https://checkout..." }
 *
 * Behavior:
 *  - Determines provider (Stripe or Lemon Squeezy)
 *  - Validates plan transitions
 *  - Creates checkout session
 *  - Returns redirect URL
 */

export async function POST(req: Request) {
  try {
    const { orgId, newPlan, billingProvider } = await req.json();

    if (!orgId || !newPlan) {
      return NextResponse.json(
        { error: "Missing orgId or newPlan" },
        { status: 400 }
      );
    }

    const validPlans = ["startup", "team", "enterprise"];
    if (!validPlans.includes(newPlan)) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // Load organization to verify current billing provider + plan
    // ------------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("plan_id, billing_provider, stripe_customer_id, lemon_customer_id")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const provider = billingProvider ?? org.billing_provider ?? "stripe";

    // ------------------------------------------------------------
    // Prevent downgrades (only upgrades allowed)
    // ------------------------------------------------------------
    const planRank = { developer: 0, startup: 1, team: 2, enterprise: 3 };

    if (planRank[newPlan] <= planRank[org.plan_id]) {
      return NextResponse.json(
        { error: "Cannot downgrade via checkout. Contact support." },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // STRIPE CHECKOUT
    // ------------------------------------------------------------
    if (provider === "stripe") {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-10-16",
      });

      const priceMap = {
        startup: process.env.STRIPE_PRICE_STARTUP!,
        team: process.env.STRIPE_PRICE_TEAM!,
        enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
      };

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: org.stripe_customer_id ?? undefined,
        line_items: [{ price: priceMap[newPlan], quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
        metadata: {
          orgId,
          upgrade_to: newPlan,
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // ------------------------------------------------------------
    // LEMON SQUEEZY CHECKOUT
    // ------------------------------------------------------------
    if (provider === "lemon") {
      const lemonStore = process.env.LEMON_STORE_ID!;
      const lemonApi = process.env.LEMON_API_KEY!;

      const priceMap = {
        startup: process.env.LEMON_VARIANT_STARTUP!,
        team: process.env.LEMON_VARIANT_TEAM!,
        enterprise: process.env.LEMON_VARIANT_ENTERPRISE!,
      };

      const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lemonApi}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              checkout_data: {
                email: "", // optional
                custom: {
                  orgId,
                  upgrade_to: newPlan,
                },
              },
            },
            relationships: {
              store: { data: { type: "stores", id: lemonStore } },
              variant: { data: { type: "variants", id: priceMap[newPlan] } },
            },
          },
        }),
      });

      const json = await response.json();

      return NextResponse.json({
        url: json?.data?.attributes?.url,
      });
    }

    return NextResponse.json(
      { error: "Unsupported billing provider" },
      { status: 400 }
    );

  } catch (err: any) {
    console.error("Upgrade-session error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
