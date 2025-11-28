import { NextResponse } from "next/server";
import Stripe from "stripe";
import pricing from "@/marketing/pricing.json";

export async function POST(req: Request) {
  const { plan, userId, email } = await req.json();

  const selected = pricing.plans.find((p) => p.id === plan);
  if (!selected) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    metadata: { userId, plan },
    line_items: [
      {
        price_data: {
          currency: "usd",
          recurring: { interval: "month" },
          unit_amount: selected.price * 100,
          product_data: {
            name: selected.name,
            description: `${selected.providers} providers`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.APP_URL}/dashboard/billing?success=1`,
    cancel_url: `${process.env.APP_URL}/dashboard/billing?canceled=1`,
  });

  return NextResponse.json({ url: session.url });
}
