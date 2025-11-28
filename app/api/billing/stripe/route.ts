// app/api/billing/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const body = await req.text(); // Stripe requires raw body
  const sig = req.headers.get("stripe-signature");

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err: any) {
    console.error("❌ Stripe Webhook Signature Error", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, {
      status: 400,
    });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // ----------------------------------------------------------------------------------------------------
  // ⭐ EVENT: Subscription Updated / Created
  // ----------------------------------------------------------------------------------------------------
  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created"
  ) {
    const subscription = event.data.object;

    const customer = await stripe.customers.retrieve(subscription.customer as string);
    const userId = (customer as any).metadata?.userId;

    if (userId) {
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "stripe",
          plan: subscription.items.data[0].price.id,
          status: subscription.status,
        },
      });

      console.log("✅ Updated Stripe subscription for user:", userId);
    }
  }

  // ----------------------------------------------------------------------------------------------------
  // ⭐ EVENT: Invoice Paid
  // ----------------------------------------------------------------------------------------------------
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;

    await supabase.from("invoices").insert({
      provider: "stripe",
      invoice_id: invoice.id,
      customer_email: invoice.customer_email,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      pdf: invoice.invoice_pdf,
      date: new Date().toISOString(),
    });

    console.log("💰 Stripe Invoice Saved:", invoice.id);
  }

  // ----------------------------------------------------------------------------------------------------
  // ⭐ EVENT: Seat metadata updated (future feature)
  // ----------------------------------------------------------------------------------------------------
  if (event.type === "customer.updated") {
    const customer = event.data.object;
    const userId = customer.metadata?.userId;
    const seats = parseInt(customer.metadata?.seats ?? "1");

    if (userId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_id", userId)
        .single();

      if (org) {
        await supabase
          .from("organizations")
          .update({ seats })
          .eq("id", org.id);
      }
    }
  }

  return NextResponse.json({ received: true });
}

export const config = {
  api: {
    bodyParser: false, // ❗ REQUIRED for Stripe webhooks
  },
};
