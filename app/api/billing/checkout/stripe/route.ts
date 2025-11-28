// app/api/billing/checkout/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const { plan, userId, seats = 1 } = await req.json();

    if (!plan || !userId) {
      return NextResponse.json(
        { error: "Missing plan or userId" },
        { status: 400 }
      );
    }

    // ---------------------------
    // ⭐ PLAN → STRIPE PRICE ID MAP
    // ---------------------------
    const planToPrice: Record<string, string> = {
      developer: process.env.STRIPE_PRICE_DEVELOPER!,
      startup: process.env.STRIPE_PRICE_STARTUP!,
      team: process.env.STRIPE_PRICE_TEAM!,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
    };

    const priceId = planToPrice[plan];

    if (!priceId) {
      return NextResponse.json(
        { error: "Unknown plan" },
        { status: 400 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // ---------------------------
    // ⭐ Checkout Session
    // ---------------------------
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=1`,

      line_items: [
        {
          price: priceId,
          quantity: seats, // handles seat billing
        },
      ],

      subscription_data: {
        metadata: {
          userId,
          plan,
          seats: String(seats),
        },
      },

      metadata: {
        userId,
        plan,
      },

      customer_creation: "always",
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout session failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
