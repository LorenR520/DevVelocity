// app/api/billing/checkout/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import pricing from "@/marketing/pricing.json";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { planId, seats } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    const plan = pricing.plans.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid planId" }, { status: 400 });
    }

    // Enterprise forces custom contact
    if (planId === "enterprise") {
      return NextResponse.json({
        url: "https://devvelocity.app/contact-enterprise",
      });
    }

    // ----------------------------------
    // ⭐ Supabase: Auth + Org
    // ----------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // ----------------------------------
    // ⭐ Stripe initialization
    // ----------------------------------
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // Seats: dynamic or included
    const seatCount = seats ?? plan.seats_included ?? 1;

    // We create the price dynamically:
    // 1. Base plan
    // 2. Seat count multiplier for overages (Stripe handles multi-quantity)

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email!,
      metadata: {
        user_id: user.id,
        org_id: org.id,
        plan_id: planId,
        seats: seatCount,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            recurring: { interval: "month" },
            unit_amount: plan.price * 100,
            product_data: {
              name: `${plan.name} Plan`,
              description: `${plan.providers} Providers · ${plan.builder} Builder · SSO: ${plan.sso}`,
            },
          },
          quantity: 1,
        },
        {
          // Additional seats beyond included
          price_data: {
            currency: "usd",
            recurring: { interval: "month" },
            unit_amount: (plan.seat_price ?? 0) * 100,
            product_data: {
              name: "Extra Seat",
              description: "Additional team seat",
            },
          },
          quantity:
            typeof plan.seats_included === "number"
              ? Math.max(0, seatCount - plan.seats_included)
              : 0,
        },
      ],
      success_url: `${process.env.APP_URL}/dashboard/billing?success=1`,
      cancel_url: `${process.env.APP_URL}/dashboard/billing?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
