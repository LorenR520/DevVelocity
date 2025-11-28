// app/api/billing/stripe/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false, // Stripe requires the raw body
  },
};

async function buffer(readable: ReadableStream<Uint8Array>) {
  const reader = readable.getReader();
  const chunks: Uint8Array[] = [];
  let done, value;

  while (true) {
    ({ done, value } = await reader.read());
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export async function POST(req: Request) {
  const body = await buffer(req.body!);
  const signature = req.headers.get("Stripe-Signature");

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
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Supabase Admin
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // ----------------------------------------------------
  // ⭐ Stripe Event Handling
  // ----------------------------------------------------
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0].price.id;
      const userId = subscription.metadata.user_id;

      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "stripe",
          plan: priceId,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
        },
      });

      console.log("🔄 Updated subscription for user", userId);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const userId = invoice.metadata.user_id;

      // Insert internal invoice record
      await supabase.from("billing_events").insert({
        org_id: invoice.metadata.org_id ?? null,
        type: "stripe_invoice",
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        details: invoice.lines.data.map((l) => ({
          description: l.description,
          amount: l.amount / 100,
          quantity: l.quantity,
        })),
      });

      console.log("💰 Stripe invoice recorded:", invoice.id);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0].price.id;
      const userId = subscription.metadata.user_id;

      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "stripe",
          plan: "canceled",
          status: "canceled",
        },
      });

      console.log("❌ Subscription canceled:", userId);
      break;
    }

    default:
      console.log(`⚠️ Unhandled Stripe event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
