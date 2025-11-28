// app/api/billing/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body
  },
};

// Utility to read raw request body in Next.js App Router
async function bufferRequest(req: Request): Promise<Buffer> {
  const arrayBuffer = await req.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(req: Request) {
  const rawBody = await bufferRequest(req);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  });

  const signature = req.headers.get("stripe-signature")!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err: any) {
    console.error("❌ Stripe webhook signature mismatch:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ================
  // ⭐ EVENT TYPES
  // ================
  switch (event.type) {
    // --------------------------------------------
    // ⭐ 1. Subscription Created / Updated
    // --------------------------------------------
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customer = subscription.customer as any;

      const userId = customer?.metadata?.userId;
      const plan = subscription.items.data[0].price.id;
      const seats = subscription.items.data[0].quantity;

      if (!userId) break;

      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "stripe",
          plan,
          seats,
          status: subscription.status,
        },
      });

      console.log("📦 Updated user subscription", userId);
      break;
    }

    // --------------------------------------------
    // ⭐ 2. Checkout Session Completed
    // --------------------------------------------
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;
      const seats = session.metadata?.seats ?? "1";

      if (!userId) break;

      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "stripe",
          plan,
          seats,
          status: "active",
        },
      });

      console.log("💳 Checkout completed for", userId);
      break;
    }

    // --------------------------------------------
    // ⭐ 3. Invoice Paid — record billable events
    // --------------------------------------------
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;

      const amount = invoice.amount_paid / 100;
      const invoiceId = invoice.id;
      const userId = (invoice.customer as any)?.metadata?.userId;

      // Store invoice record (for invoices page)
      await supabase.from("billing_events").insert({
        provider: "stripe",
        invoice_id: invoiceId,
        amount,
        currency: invoice.currency.toUpperCase(),
        user_id: userId ?? null,
        type: invoice.billing_reason,
        pdf: invoice.invoice_pdf,
        hosted_url: invoice.hosted_invoice_url,
      });

      console.log("🧾 Invoice saved:", invoiceId);
      break;
    }

    // --------------------------------------------
    // ⭐ 4. Subscription Deleted (canceled)
    // --------------------------------------------
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customer = subscription.customer as any;

      const userId = customer?.metadata?.userId;
      if (!userId) break;

      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "stripe",
          plan: null,
          seats: null,
          status: "canceled",
        },
      });

      console.log("❌ Subscription canceled for", userId);
      break;
    }

    default:
      console.log("ℹ️ Unhandled Stripe event:", event.type);
  }

  return NextResponse.json({ received: true });
}
