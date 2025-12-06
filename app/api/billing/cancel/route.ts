import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/**
 * CANCEL SUBSCRIPTION (ALL PAID TIERS)
 * -------------------------------------------------------
 * Applies to:
 *  - developer
 *  - startup
 *  - team
 *  - enterprise
 *
 * There are **no free tiers** in DevVelocity.
 *
 * Behavior:
 *  1. Validate user + org
 *  2. Look up active subscription in DB
 *  3. Cancel via Stripe or Lemon Squeezy
 *  4. Mark org as "canceled" internally
 *  5. Log event to usage_logs
 */

export async function POST(req: Request) {
  try {
    const { orgId, userId } = await req.json();

    if (!orgId || !userId) {
      return NextResponse.json(
        { error: "Missing orgId or userId" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -------------------------------------------------------
    // 1. Fetch organization + subscription info
    // -------------------------------------------------------
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // No free tier — Developer is also treated as a paid tier.
    const plan = org.plan_id;

    const allowedPlans = ["developer", "startup", "team", "enterprise"];
    if (!allowedPlans.includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 500 }
      );
    }

    // Already canceled?
    if (org.subscription_status === "canceled") {
      return NextResponse.json({
        success: true,
        message: "Subscription already canceled.",
      });
    }

    // -------------------------------------------------------
    // 2. Cancel Stripe subscription (if exists)
    // -------------------------------------------------------
    if (org.stripe_subscription_id) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-10-16",
      });

      await stripe.subscriptions.update(org.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    // -------------------------------------------------------
    // 3. Cancel Lemon Squeezy subscription (if exists)
    // -------------------------------------------------------
    if (org.lemon_subscription_id) {
      await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions/${org.lemon_subscription_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
          },
          body: JSON.stringify({
            data: {
              type: "subscriptions",
              id: org.lemon_subscription_id,
              attributes: {
                canceled: true,
              },
            },
          }),
        }
      );
    }

    // -------------------------------------------------------
    // 4. Update org's internal status
    // -------------------------------------------------------
    await supabase
      .from("organizations")
      .update({
        subscription_status: "canceled",
        plan_id: "canceled", // remove features
        updated_at: new Date().toISOString(),
      })
      .eq("id", orgId);

    // -------------------------------------------------------
    // 5. Log usage / audit
    // -------------------------------------------------------
    await supabase.from("usage_logs").insert({
      org_id: orgId,
      canceled_subscriptions: 1,
      pipelines_run: 0,
      provider_api_calls: 0,
      build_minutes: 0,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Subscription canceled successfully.",
    });
  } catch (err: any) {
    console.error("Cancel subscription error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
