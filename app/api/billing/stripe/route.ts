// app/api/billing/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "edge",
};

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
    console.error("❌ Stripe Webhook Signature Error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Supabase Admin client
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ------------------------------------------------------
  // 🔥 Handle Webhook Events
  // ------------------------------------------------------
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;

      const planId = session.metadata.planId;
      const orgId = session.metadata.orgId;

      if (!orgId || !planId) break;

      await supabase
        .from("organizations")
        .update({
          plan_id: planId,
          billing_provider: "stripe",
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        })
        .eq("id", orgId);

      console.log(`✅ Stripe checkout completed for org ${orgId}`);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;

      await supabase.from("billing_events").insert({
        org_id: invoice.metadata?.orgId ?? null,
        provider: "stripe",
        type: "subscription_payment",
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        external_invoice_id: invoice.id,
        pdf: invoice.invoice_pdf,
        status: invoice.status,
      });

      console.log("💰 Stripe invoice saved:", invoice.id);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;

      console.warn("⚠️ Stripe payment failed:", invoice.id);

      await supabase.from("billing_events").insert({
        org_id: invoice.metadata?.orgId ?? null,
        provider: "stripe",
        type: "payment_failed",
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        external_invoice_id: invoice.id,
        status: "failed",
      });

      break;
    }

    default:
      console.log(`ℹ️ Unhandled Stripe event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
