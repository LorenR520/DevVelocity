import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const { planId, seats = 1, orgId } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: "Missing planId" },
        { status: 400 }
      );
    }

    // Map plans → Stripe price IDs
    const priceMap: Record<string, string> = {
      developer: process.env.STRIPE_PRICE_DEVELOPER!,
      startup: process.env.STRIPE_PRICE_STARTUP!,
      team: process.env.STRIPE_PRICE_TEAM!,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
    };

    const priceId = priceMap[planId];

    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid planId" },
        { status: 400 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      // Metadata passed to Stripe → returned on webhook → written into Supabase
      metadata: {
        plan_id: planId,
        org_id: orgId ?? "",
        seats: String(seats),
      },

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      // Stripe will generate additional seat billing via your seat engine
      subscription_data: {
        metadata: {
          plan_id: planId,
          org_id: orgId ?? "",
          seats: String(seats),
        },
      },

      success_url: `${process.env.APP_URL}/dashboard/billing?success=1`,
      cancel_url: `${process.env.APP_URL}/dashboard/billing?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: 500 }
    );
  }
}
