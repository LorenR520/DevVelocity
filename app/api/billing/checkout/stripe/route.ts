// app/api/billing/checkout/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import pricing from "@/marketing/pricing.json";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plan, userId, email, orgId } = body;

    if (!plan || !userId || !orgId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const selected = pricing.plans.find((p: any) => p.id === plan);

    if (!selected) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // Stripe price lookup
    const stripePrice = selected.stripe_price_id;

    if (!stripePrice) {
      return NextResponse.json(
        { error: "Stripe price ID not configured for this plan" },
        { status: 500 }
      );
    }

    // Create Customer (or update)
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
        orgId,
        plan,
      },
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [
        {
          price: stripePrice,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          userId,
          orgId,
          plan,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=1`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message ?? "Stripe checkout failed" },
      { status: 500 }
    );
  }
}
