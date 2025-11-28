// app/api/billing/checkout/stripe/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import pricing from "@/marketing/pricing.json";

export async function POST(req: Request) {
  try {
    const { planId, seats } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    const plan = pricing.plans.find((p) => p.id === planId);

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Enterprise requires contact, not checkout
    if (planId === "enterprise") {
      return NextResponse.json({
        url: "https://devvelocity.app/contact-enterprise",
      });
    }

    // Initialize Supabase Admin
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

    // Load org
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

    // Stripe price ID for this plan
    const priceId = process.env[`STRIPE_PRICE_${planId.toUpperCase()}`];

    if (!priceId) {
      return NextResponse.json(
        { error: `Missing Stripe price ID for plan ${planId}` },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    const quantitySeats = seats ?? plan.seats_included ?? 1;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email!,
      metadata: {
        org_id: org.id,
        user_id: user.id,
        plan_id: planId,
        seats: quantitySeats,
      },
      line_items: [
        {
          price: priceId,
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
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
