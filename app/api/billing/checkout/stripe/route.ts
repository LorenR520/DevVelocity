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

    // Enterprise → Contact sales instead
    if (planId === "enterprise") {
      return NextResponse.json({
        url: "https://devvelocity.app/contact-enterprise",
      });
    }

    // ----------------------------
    // ⭐ Supabase: Get Auth user
    // ----------------------------
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

    // ----------------------------
    // ⭐ Supabase: Organization
    // ----------------------------
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

    // ----------------------------
    // ⭐ Stripe
    // ----------------------------
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    const stripePriceId =
      process.env[`STRIPE_PRICE_${planId.toUpperCase()}`];

    if (!stripePriceId) {
      return NextResponse.json(
        { error: `Missing Stripe price for ${planId}` },
        { status: 500 }
      );
    }

    const quantitySeats = seats ?? plan.seats_included ?? 1;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email!,
      metadata: {
        user_id: user.id,
        org_id: org.id,
        plan_id: planId,
        seats: quantitySeats,
      },
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL}/dashboard/billing?success=1`,
      cancel_url: `${process.env.APP_URL}/dashboard/billing?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
