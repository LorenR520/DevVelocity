// app/api/billing/checkout/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import pricing from "@/marketing/pricing.json";

export async function POST(req: Request) {
  try {
    const { plan, userId } = await req.json();

    if (!plan || !userId) {
      return NextResponse.json(
        { error: "Missing plan or userId" },
        { status: 400 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // Select plan from pricing.json
    const selected = pricing.plans.find((p) => p.id === plan);
    if (!selected) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Map plan → Stripe Price ID
    const priceMap: Record<string, string> = {
      developer: process.env.STRIPE_PRICE_DEVELOPER!,
      startup: process.env.STRIPE_PRICE_STARTUP!,
      team: process.env.STRIPE_PRICE_TEAM!,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
    };

    const priceId = priceMap[plan];

    // Enterprise → redirect to manual contact page
    if (plan === "enterprise") {
      return NextResponse.json({
        url: "https://devvelocity.app/contact-sales",
      });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_creation: "always",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          plan,
          userId,
        },
      },
      metadata: {
        plan,
        userId,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=1`,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
