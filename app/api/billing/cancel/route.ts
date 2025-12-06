// app/api/billing/cancel/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/**
 * CANCEL SUBSCRIPTION (NON-DESTRUCTIVE)
 * ---------------------------------------------------------------
 * POST /api/billing/cancel
 *
 * Input:
 *  {
 *    orgId: string,
 *    reason: string,
 *    billingProvider: "stripe" | "lemon"
 *  }
 *
 * Behavior:
 *  - Does NOT immediately delete subscription (prevents revenue loss)
 *  - Marks subscription as "cancel_at_period_end"
 *  - Stores cancellation reason + timestamp
 *  - Works for Stripe and Lemon
 *  - Sends retention trigger events (optional)
 */

export async function POST(req: Request) {
  try {
    const { orgId, reason, billingProvider } = await req.json();

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing orgId" },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // Load organization to fetch billing info
    // -------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("plan_id, billing_provider, stripe_subscription_id, lemon_subscription_id")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const provider = billingProvider ?? org.billing_provider ?? "stripe";

    // -------------------------------------------------------
    // Developer plan can't cancel because nothing is billed
    // -------------------------------------------------------
    if (org.plan_id === "developer") {
      return NextResponse.json(
        { error: "Developer plan has no active subscription to cancel." },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // STRIPE CANCELLATION
    // -------------------------------------------------------
    if (provider === "stripe") {
      if (!org.stripe_subscription_id) {
        return NextResponse.json(
          { error: "No Stripe subscription found for this org." },
          { status: 400 }
        );
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-10-16",
      });

      await stripe.subscriptions.update(org.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      // Store cancellation metadata
      await supabase.from("billing_cancellations").insert({
        org_id: orgId,
        provider: "stripe",
        reason: reason ?? "No reason provided",
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Subscription will cancel at the end of the billing period.",
      });
    }

    // -------------------------------------------------------
    // LEMON SQUEEZY CANCELLATION
    // -------------------------------------------------------
    if (provider === "lemon") {
      if (!org.lemon_subscription_id) {
        return NextResponse.json(
          { error: "No Lemon Squeezy subscription found." },
          { status: 400 }
        );
      }

      const lemonApi = process.env.LEMON_API_KEY!;

      await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions/${org.lemon_subscription_id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${lemonApi}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              type: "subscriptions",
              attributes: {
                cancel_at_period_end: true,
              },
            },
          }),
        }
      );

      await supabase.from("billing_cancellations").insert({
        org_id: orgId,
        provider: "lemon",
        reason: reason ?? "No reason provided",
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Your plan will cancel at the end of the current term.",
      });
    }

    return NextResponse.json(
      { error: "Unsupported billing provider" },
      { status: 400 }
    );

  } catch (err: any) {
    console.error("Cancel-subscription error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
