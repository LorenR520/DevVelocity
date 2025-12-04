import { NextResponse } from "next/server";
import Stripe from "stripe";
import { BILLING_MAP } from "@/lib/billing";

export async function POST(req: Request) {
  const { plan, userId } = await req.json();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const priceId = BILLING_MAP[plan]?.stripePriceId;

  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: undefined,
    subscription_data: {
      metadata: { userId },
    },
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=1`,
  });

  return NextResponse.json({ url: session.url });
}
