import { NextResponse } from "next/server";
import Stripe from "stripe";
import { updateUserFromStripeEvent } from "@/server/billing/stripe-sync";
import { sendReceipt } from "@/server/email/send-receipt";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature")!;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  await updateUserFromStripeEvent(event);

  if (event.type === "invoice.payment_succeeded") {
    const invoice: any = event.data.object;
    await sendReceipt(
      invoice.customer_email,
      invoice.lines.data[0].description,
      invoice.quantity,
      invoice.amount_paid / 100
    );
  }

  return NextResponse.json({ ok: true });
}
