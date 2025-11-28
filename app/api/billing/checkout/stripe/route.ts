// app/api/billing/checkout/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import pricing from "@/marketing/pricing.json";
import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "edge",
};

export async function POST(req: Request) {
  try {
    const { plan, orgId } = await req.json();

    if (!plan || !orgId) {
      return NextResponse.json(
        { error: "Missing plan or orgId" },
        { status: 400 }
      );
    }

    // Validate plan
    const planMeta = pricing.plans.find((p) => p.id === plan);
    if (!planMeta) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Map plan → Stripe price ID
    const stripePriceKey = {
      developer: "STRIPE_PRICE_DEVELOPER",
      startup: "STRIPE_PRICE_STARTUP",
      team: "STRIPE_PRICE_TEAM",
      enterprise: "STRIPE_PRICE_ENTERPRISE",
    }[plan];

    const priceId = process.env[stripePriceKey];

    if (!priceId) {
      return NextResponse.json(
        { error: "Missing Stripe price ENV variable" },
        { status: 500 }
      );
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Validate org exists
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

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // Create customer if missing
    let customerId = org.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: org.owner_email,
        metadata: { orgId },
      });

      customerId = customer.id;

      // Save to Supabase
      await supabase
        .from("organizations")
        .update({ stripe_customer_id: customer.id })
        .eq("id", orgId);
    }

    // Create subscription checkout
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      metadata: { orgId, plan },
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
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
