import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.text(); // Stripe requires raw text, not JSON

    const sig = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return NextResponse.json({ error: "Missing webhook secret" }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Stripe webhook signature error:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Initialize Supabase Admin
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -------------------------------
    // 🔥  HANDLE STRIPE EVENTS
    // -------------------------------

    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const customer = invoice.customer as any;

        const userId = customer.metadata?.userId;
        if (!userId) break;

        // Update last_payment_at or invoice history
        await supabase
          .from("billing_events")
          .insert({
            org_id: customer.metadata.orgId,
            type: "stripe_invoice",
            amount: invoice.amount_paid / 100,
            details: invoice,
          });

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object;
        const customer = sub.customer as any;

        const userId = customer.metadata?.userId;
        const orgId = customer.metadata?.orgId;

        if (!userId || !orgId) break;

        await supabase.auth.admin.updateUserById(userId, {
          app_metadata: {
            billing_provider: "stripe",
            plan: sub.items.data[0].price.id,
            status: sub.status,
          },
        });

        await supabase
          .from("organizations")
          .update({
            plan_id: sub.items.data[0].price.id,
            subscription_status: sub.status,
          })
          .eq("id", orgId);

        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customer = sub.customer as any;

        const userId = customer.metadata?.userId;
        const orgId = customer.metadata?.orgId;

        if (!userId || !orgId) break;

        // downgrade them
        await supabase
          .from("organizations")
          .update({
            plan_id: "developer",
            subscription_status: "canceled",
          })
          .eq("id", orgId);

        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Stripe webhook handler error:", err);
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: 500 }
    );
  }
}
