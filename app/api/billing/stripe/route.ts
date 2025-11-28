// app/api/billing/stripe/route.ts
//
// ⭐ Stripe Webhook Handler
// Handles:
// - invoice.paid
// - customer.subscription.updated
// - customer.subscription.deleted
// - checkout.session.completed
// - invoice.payment_failed
//
// Syncs billing → Supabase
// Creates internal usage/seat billing events
// Updates plan, cycle start, and status
//

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import pricing from "@/marketing/pricing.json";

// Stripe requires the raw body:
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  let body: any;
  let signature: string | null = null;

  try {
    signature = req.headers.get("stripe-signature");
    body = await req.text();
  } catch (err) {
    console.error("Failed to read raw body:", err);
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: "Signature error" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // ---------------------------------------
  // ⭐ EVENT HANDLERS
  // ---------------------------------------

  switch (event.type) {
    // Fired after checkout success
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customer = session.customer as string;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;

      if (!userId || !plan) break;

      // Save plan metadata
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "stripe",
          plan,
          billing_customer_id: customer,
        },
      });

      break;
    }

    // Fired each billing cycle when invoice is paid
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;

      const customer = invoice.customer as any;
      const userId =
        customer?.metadata?.userId ?? invoice.metadata?.userId;

      if (!userId) break;

      const amount = invoice.amount_paid / 100;

      // Insert internal billing event record
      await supabase.from("billing_events").insert({
        user_id: userId,
        provider: "stripe",
        type: "invoice_paid",
        amount,
        date: new Date().toISOString(),
        invoice_id: invoice.id,
        details: {
          items: invoice.lines.data.map((l) => ({
            description: l.description,
            amount: l.amount / 100,
          })),
        },
      });

      break;
    }

    // Fired when subscription changes (plan change, renewal)
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customer = sub.customer as any;

      const userId = customer?.metadata?.userId;
      const plan = sub.items.data[0].price.id;

      if (!userId || !plan) break;

      // Lookup readable plan via price → plan.id mapping
      let matchedPlan = pricing.plans.find(
        (p) => p.stripe_price_id === plan
      );

      const readablePlanId = matchedPlan?.id ?? "unknown";

      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "stripe",
          plan: readablePlanId,
          status: sub.status,
        },
      });

      break;
    }

    // Fired if subscription is canceled
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customer = sub.customer as any;

      const userId = customer?.metadata?.userId;

      if (!userId) break;

      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "stripe",
          plan: "canceled",
          status: "canceled",
        },
      });

      break;
    }

    // Payment failure
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customer = invoice.customer as any;

      const userId = customer?.metadata?.userId;

      if (!userId) break;

      await supabase.from("billing_events").insert({
        user_id: userId,
        provider: "stripe",
        type: "payment_failed",
        amount: 0,
        details: {
          reason: invoice.collection_method,
        },
      });

      break;
    }

    default:
      console.log(`Unhandled Stripe event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
