import { NextResponse } from "next/server";
import Stripe from "stripe";
import pricing from "@/marketing/pricing.json";

export const runtime = "edge"; // Cloudflare-compatible

export async function POST(req: Request) {
  try {
    const { userId, orgId, plan } = await req.json();

    if (!userId || !plan || !orgId) {
      return NextResponse.json(
        { error: "Missing userId, orgId, or plan" },
        { status: 400 }
      );
    }

    const selected = pricing.plans.find((p) => p.id === plan);
    if (!selected) {
      return NextResponse.json(
        { error: `Invalid plan: ${plan}` },
        { status: 400 }
      );
    }

    // Enterprise → no automated checkout
    if (plan === "enterprise") {
      return NextResponse.json({
        url: `${process.env.APP_URL}/contact/sales?org=${orgId}`,
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      // Until email is known at login-time, leave blank
      customer_email: "",

      metadata: {
        userId,
        orgId,
        plan,
      },

      line_items: [
        {
          price_data: {
            currency: "usd",
            recurring: {
              interval: "month",
            },
            unit_amount: selected.price * 100, // convert to cents
            product_data: {
              name: selected.name,
              description: `${selected.providers} providers • ${selected.updates} updates`,
            },
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.APP_URL}/dashboard/billing?success=1`,
      cancel_url: `${process.env.APP_URL}/dashboard/billing?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
