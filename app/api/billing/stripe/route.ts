// app/api/billing/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  });

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Stripe webhook signature error:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // ----------------------------
  // Supabase Admin Client
  // ----------------------------
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Helper: update user metadata and org billing
  async function updateBilling(userId: string, updates: any) {
    await supabase.auth.admin.updateUserById(userId, {
      app_metadata: updates,
    });

    if (updates.orgId) {
      await supabase
        .from("organizations")
        .update({
          plan_id: updates.plan,
          billing_provider: "stripe",
          subscription_status: updates.status ?? null,
          subscription_id: updates.subscription_id ?? null,
        })
        .eq("id", updates.orgId);
    }
  }

  // =============================
  // EVENT HANDLERS
  // =============================

  switch (event.type) {
    // -----------------------------------------
    // ✔ Checkout completed → Attach metadata
    // -----------------------------------------
    case "checkout.session.completed": {
      const session = event.data.object as any;

      const userId = session.metadata?.userId;
      const orgId = session.metadata?.orgId;
      const plan = session.metadata?.plan;

      if (userId && orgId) {
        await updateBilling(userId, {
          plan,
          orgId,
          provider: "stripe",
          subscription_id: session.subscription,
          status: "active",
        });
      }

      break;
    }

    // -----------------------------------------
    // ✔ Subscription created / updated
    // -----------------------------------------
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as any;

      const userId = sub.metadata?.userId;
      const orgId = sub.metadata?.orgId;
      const plan = sub.metadata?.plan;

      if (userId && orgId) {
        await updateBilling(userId, {
          plan,
          orgId,
          provider: "stripe",
          subscription_id: sub.id,
          status: sub.status,
        });
      }

      break;
    }

    // -----------------------------------------
    // ✔ Subscription cancelled
    // -----------------------------------------
    case "customer.subscription.deleted": {
      const sub = event.data.object as any;

      const userId = sub.metadata?.userId;
      const orgId = sub.metadata?.orgId;

      if (userId && orgId) {
        await updateBilling(userId, {
          plan: "free",
          orgId,
          provider: "stripe",
          subscription_id: null,
          status: "cancelled",
        });
      }

      break;
    }

    // -----------------------------------------
    // ✔ Invoice paid
    // -----------------------------------------
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as any;

      await supabase.from("invoices").insert({
        provider: "stripe",
        invoice_id: invoice.id,
        customer_email: invoice.customer_email,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        date: new Date().toISOString(),
      });

      break;
    }

    // -----------------------------------------
    // ✔ Invoice failed
    // -----------------------------------------
    case "invoice.payment_failed": {
      const invoice = event.data.object as any;

      await supabase.from("billing_events").insert({
        type: "payment_failed",
        provider: "stripe",
        details: invoice,
        created_at: new Date().toISOString(),
      });

      break;
    }
  }

  return NextResponse.json({ received: true });
}
