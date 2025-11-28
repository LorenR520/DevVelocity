// app/api/billing/checkout/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import pricing from "@/marketing/pricing.json";

export async function POST(req: Request) {
  try {
    const { plan, userId, email } = await req.json();

    if (!plan || !userId) {
      return NextResponse.json(
        { error: "Missing plan or userId" },
        { status: 400 }
      );
    }

    // Match plan from pricing.json
    const selectedPlan = pricing.plans.find((p: any) => p.id === plan);

    if (!selectedPlan) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Stripe SDK initialization
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // Create or reuse Stripe customer
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      metadata: {
        userId,
        plan,
      },
    });

    // Create the Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      success_url: `${process.env.PUBLIC_URL}/dashboard/billing?success=1`,
      cancel_url: `${process.env.PUBLIC_URL}/dashboard/billing?canceled=1`,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: selectedPlan.price * 100,
            product_data: {
              name: `${selectedPlan.name} Plan`,
              metadata: {
                plan,
                builders: selectedPlan.builder,
                sso: selectedPlan.sso,
              },
            },
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],

      metadata: {
        userId,
        plan,
      },

      subscription_data: {
        metadata: {
          userId,
          plan,
        },
      },
    });

    if (!session?.url) {
      return NextResponse.json(
        { error: "Failed to create Stripe checkout session" },
        { status: 500 }
      );
    }

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
