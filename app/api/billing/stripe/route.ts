import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body
  },
};

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  });

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Stripe webhook signature error:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Initialize Supabase Admin
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ------------------------------------------------------------------
  // ⭐ HANDLERS FOR ALL STRIPE BILLING EVENTS
  // ------------------------------------------------------------------
  try {
    switch (event.type) {
      // ------------------------------
      // ⭐ Subscription Created
      // ------------------------------
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = sub.customer as any;
        const plan = sub.items.data[0].price.id;

        const userId = customer.metadata.userId;

        await supabase.auth.admin.updateUserById(userId, {
          app_metadata: {
            billing_provider: "stripe",
            stripe_subscription_id: sub.id,
            stripe_customer_id: customer.id,
            plan,
            status: sub.status,
          },
        });

        break;
      }

      // ------------------------------
      // ⭐ Subscription Updated (plan, status)
      // ------------------------------
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = sub.customer as any;
        const plan = sub.items.data[0].price.id;
        const userId = customer.metadata.userId;

        await supabase.auth.admin.updateUserById(userId, {
          app_metadata: {
            billing_provider: "stripe",
            stripe_subscription_id: sub.id,
            stripe_customer_id: customer.id,
            plan,
            status: sub.status,
          },
        });

        break;
      }

      // ------------------------------
      // ⭐ Subscription Deleted
      // ------------------------------
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = sub.customer as any;
        const userId = customer.metadata.userId;

        await supabase.auth.admin.updateUserById(userId, {
          app_metadata: {
            billing_provider: "stripe",
            plan: "free",
            status: "canceled",
          },
        });

        break;
      }

      // ------------------------------
      // ⭐ Invoice Paid (seat, metered, or base subscription)
      // ------------------------------
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Fetch userId from stored metadata
        const customer = await stripe.customers.retrieve(customerId);
        const userId = (customer as any).metadata.userId;

        // Save invoice to Supabase billing history
        await supabase.from("billing_events").insert({
          provider: "stripe",
          invoice_id: invoice.id,
          org_id: userId, // You will map users → orgs soon
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          type: "stripe_invoice",
          details: invoice.lines.data,
        });

        break;
      }

      // ------------------------------
      // ⭐ Invoice Failed
      // ------------------------------
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn("❌ Stripe Invoice Failed:", invoice.id);
        break;
      }

      default:
        console.log("ℹ️ Unhandled Stripe event:", event.type);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("❌ Stripe webhook handler error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
