import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendReceipt } from "@/server/email/send-receipt";

export const runtime = "edge";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Stripe Webhook Error:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // ===================================================
  // ⭐ 1. Subscription Created / Updated
  // ===================================================
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const sub = event.data.object as Stripe.Subscription;

    const userId = (sub.customer as any)?.metadata?.userId;

    if (userId) {
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "stripe",
          status: sub.status,
          plan: sub.items.data[0].price.id,
        },
      });
    }
  }

  // ===================================================
  // ⭐ 2. Payment Succeeded → Send Receipt Email
  // ===================================================
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;

    try {
      await sendReceipt({
        to: invoice.customer_email!,
        plan:
          invoice.lines.data?.[0]?.description ??
          "DevVelocity Subscription",
        seats: invoice.lines.data?.[0]?.quantity ?? 1,
        amount: (invoice.amount_paid ?? 0) / 100,
      });
    } catch (err) {
      console.error("❌ Failed to Send Receipt Email:", err);
    }
  }

  // ===================================================
  // ⭐ 3. Invoice Finalized → Log into Supabase billing_events
  // ===================================================
  if (event.type === "invoice.finalized") {
    const invoice = event.data.object as Stripe.Invoice;

    await supabase.from("billing_events").insert({
      org_id: invoice.customer as string,
      type: "stripe_invoice",
      amount: invoice.amount_due / 100,
      provider_invoice_id: invoice.id,
      provider: "stripe",
      details: invoice,
    });
  }

  // ===================================================
  // ⭐ 4. Subscription Deleted → Set to Past Due
  // ===================================================
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const userId = (sub.customer as any)?.metadata?.userId;

    if (userId) {
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: { status: "canceled" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
