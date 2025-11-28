// app/api/billing/checkout/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { planId, orgId, email } = body;

    if (!planId || !orgId || !email) {
      return NextResponse.json(
        { error: "Missing planId, orgId, or email" },
        { status: 400 }
      );
    }

    // Map planId → Stripe Price IDs
    const priceMap: Record<string, string> = {
      developer: process.env.STRIPE_PRICE_DEVELOPER!,
      startup: process.env.STRIPE_PRICE_STARTUP!,
      team: process.env.STRIPE_PRICE_TEAM!,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE!, // 1250+ custom
    };

    const price = priceMap[planId];
    if (!price) {
      return NextResponse.json(
        { error: "Invalid planId" },
        { status: 400 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // Enterprise requires custom contact flow
    if (planId === "enterprise") {
      const contactUrl = `${process.env.APP_URL}/contact-sales?org=${orgId}`;
      return NextResponse.json({
        url: contactUrl,
        message: "Enterprise plan requires a custom sales agreement.",
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      metadata: {
        orgId,
        planId,
      },
      success_url: `${process.env.APP_URL}/dashboard/billing?status=success`,
      cancel_url: `${process.env.APP_URL}/dashboard/billing?status=cancel`,
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
