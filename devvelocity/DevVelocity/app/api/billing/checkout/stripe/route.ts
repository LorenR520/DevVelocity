import { NextResponse } from "next/server";
import pricing from "@/marketing/pricing.json";
import Stripe from "stripe";

export const runtime = "edge"; // Cloudflare-compatible

export async function POST(req: Request) {
  try {
    const { planId, userId, orgId, seats = 1 } = await req.json();

    if (!planId || !userId || !orgId) {
      return NextResponse.json(
        { error: "Missing planId, userId or orgId" },
        { status: 400 }
      );
    }

    // Load pricing.json plan
    const plan = pricing.plans.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid planId" }, { status: 400 });
    }

    // Stripe PriceID mapping from ENV variables
    const stripePriceMap: Record<string, string> = {
      developer: process.env.STRIPE_PRICE_DEVELOPER!,
      startup: process.env.STRIPE_PRICE_STARTUP!,
      team: process.env.STRIPE_PRICE_TEAM!,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
    };

    const priceId = stripePriceMap[planId];
    if (!priceId) {
      return NextResponse.json(
        { error: "Missing Stripe price ID for plan" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // For enterprise, enforce custom sales flow
    if (planId === "enterprise") {
      return NextResponse.json({
        error: "Enterprise plans require custom quote",
        contact: `${process.env.APP_URL}/contact`,
      });
    }

    // Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      metadata: {
        userId,
        orgId,
        planId,
        seats,
      },
      subscription_data: {
        metadata: {
          userId,
          orgId,
          planId,
          seats,
        },
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
      { error: err.message ?? "Stripe Checkout Failed" },
      { status: 500 }
    );
  }
}
