import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/**
 * CANCEL SUBSCRIPTION (ALL TIERS, EVEN DEVELOPER)
 * -------------------------------------------------------------
 * All plans are paid. Developer tier can cancel just like others.
 *
 * What this route does:
 * 1. Auth user
 * 2. Load org and subscription
 * 3. Cancel at period_end (no immediate teardown)
 * 4. Update organizations table: status = "cancelling"
 * 5. Log cancellation for audit trail
 */

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await req.json();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Missing userId or orgId" },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // Supabase admin client
    // ------------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------------------------------------
    // Verify the user belongs to org
    // ------------------------------------------------------------
    const { data: membership } = await supabase
      .from("organization_members")
      .select("id")
      .eq("user_id", userId)
      .eq("org_id", orgId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Unauthorized: user not part of org" },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------
    // Load the subscription
    // ------------------------------------------------------------
    const { data: org } = await supabase
      .from("organizations")
      .select("stripe_subscription_id, plan_id")
      .eq("id", orgId)
      .single();

    if (!org?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // ------------------------------------------------------------
    // Cancel at period_end — do NOT delete immediately
    // ------------------------------------------------------------
    await stripe.subscriptions.update(org.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // ------------------------------------------------------------
    // Update DB org status
    // ------------------------------------------------------------
    await supabase
      .from("organizations")
      .update({
        status: "cancelling",
        cancellation_requested_at: new Date().toISOString(),
      })
      .eq("id", orgId);

    // ------------------------------------------------------------
    // Log cancellation
    // ------------------------------------------------------------
    await supabase.from("billing_activity").insert({
      org_id: orgId,
      user_id: userId,
      action: "subscription_cancel_requested",
      plan: org.plan_id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancellation scheduled for next billing cycle.",
    });
  } catch (err: any) {
    console.error("Cancel subscription error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
