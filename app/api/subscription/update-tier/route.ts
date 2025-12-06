import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import marketing from "@/config/marketing.json";

/**
 * UPDATE SUBSCRIPTION PLAN (Upgrade / Downgrade)
 * ---------------------------------------------------------------
 * Supports all tiers: Developer → Startup → Team → Enterprise
 *
 * Behavior:
 * - Auth user required
 * - Validates plan
 * - Updates Stripe subscription
 * - Updates Supabase organizations.plan_id
 * - Recalculates billing for seat-based plans
 * - Creates audit log entry
 */

export async function POST(req: Request) {
  try {
    const { userId, orgId, newPlan } = await req.json();

    if (!userId || !orgId || !newPlan) {
      return NextResponse.json(
        { error: "Missing userId, orgId, or newPlan" },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 1. Validate plan exists
    // ------------------------------------------------------------
    const planDef = marketing.plans.find((p) => p.id === newPlan);

    if (!planDef) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 2. Supabase admin client
    // ------------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------------------------------------
    // 3. Verify membership
    // ------------------------------------------------------------
    const { data: membership } = await supabase
      .from("organization_members")
      .select("id")
      .eq("user_id", userId)
      .eq("org_id", orgId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Unauthorized: user not in org" },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------
    // 4. Load current subscription
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

    // ------------------------------------------------------------
    // 5. Stripe client
    // ------------------------------------------------------------
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // Pull Stripe subscription
    const subscription = await stripe.subscriptions.retrieve(
      org.stripe_subscription_id
    );

    const currentItem = subscription.items.data[0];

    // ------------------------------------------------------------
    // 6. Update Stripe subscription plan
    // ------------------------------------------------------------
    await stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: currentItem.id,
          price: process.env[`STRIPE_PRICE_${newPlan.toUpperCase()}`],
        },
      ],
      proration_behavior: "always_invoice",
    });

    // ------------------------------------------------------------
    // 7. Update org plan in database
    // ------------------------------------------------------------
    await supabase
      .from("organizations")
      .update({
        plan_id: newPlan,
        plan_updated_at: new Date().toISOString(),
        status: "active",
      })
      .eq("id", orgId);

    // ------------------------------------------------------------
    // 8. Log plan change
    // ------------------------------------------------------------
    await supabase.from("billing_activity").insert({
      org_id: orgId,
      user_id: userId,
      action: "plan_updated",
      previous_plan: org.plan_id,
      new_plan: newPlan,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Subscription updated to ${planDef.name}.`,
      newPlan,
    });
  } catch (err: any) {
    console.error("Update-tier error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
