import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { plan, seats } = await req.json();

  const price = process.env[`STRIPE_${plan.toUpperCase()}_PRICE_ID`];

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      { price, quantity: 1 },                 // Base plan
      { price: process.env.EXTRA_SEAT_PRICE, quantity: seats } // Extra seats
    ],
    success_url: `${process.env.APP_URL}/dashboard/billing/success`,
    cancel_url: `${process.env.APP_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
