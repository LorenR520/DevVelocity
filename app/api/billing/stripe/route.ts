// app/api/billing/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendReceipt } from "@/server/email/send-receipt";

export const config = {
  runtime: "edge",
};

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("⚠️ Stripe signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ============================================================
    // ⭐ HANDLE STRIPE EVENTS
    // ============================================================

    switch (event.type) {
      // ----------------------------------------------------------
      // Subscription created / upgraded / downgraded
      // ----------------------------------------------------------
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub: any = event.data.object;
        const orgId = sub.metadata.orgId;
        const plan = sub.metadata.plan;

        console.log("🔄 Updating org billing plan:", orgId, plan);

        await supabase
          .from("organizations")
          .update({
            plan_id: plan,
            stripe_subscription_id: sub.id,
            subscription_status: sub.status,
          })
          .eq("id", orgId);

        break;
      }

      // ----------------------------------------------------------
      // Subscription canceled
      // ----------------------------------------------------------
      case "customer.subscription.deleted": {
        const sub: any = event.data.object;
        const orgId = sub.metadata.orgId;

        console.log("❌ Subscription canceled:", orgId);

        await supabase
          .from("organizations")
          .update({
            subscription_status: "canceled",
          })
          .eq("id", orgId);

        break;
      }

      // ----------------------------------------------------------
      // Invoice paid → Send receipt email
      // ----------------------------------------------------------
      case "invoice.payment_succeeded": {
        const invoice: any = event.data.object;

        const amount = invoice.amount_paid / 100;
        const orgId = invoice.metadata?.orgId;
        const plan = invoice.lines.data[0]?.description ?? "Subscription";

        const seats =
          invoice.lines.data[0]?.quantity ?? 1;

        const email = invoice.customer_email;

        console.log("📬 Sending receipt email:", email);

        await sendReceipt({
          to: email,
          plan,
          seats,
          amount,
        });

        // Log internal billing record
        await supabase.from("billing_events").insert({
          org_id: orgId,
          type: "stripe_payment",
          amount,
          details: {
            invoice_id: invoice.id,
            plan,
            seats,
          },
        });

        break;
      }

      // ----------------------------------------------------------
      // Invoice failed → notify user or mark delinquent
      // ----------------------------------------------------------
      case "invoice.payment_failed": {
        const invoice: any = event.data.object;
        const orgId = invoice.metadata?.orgId;

        console.log("⚠️ Invoice payment failed:", orgId);

        await supabase
          .from("organizations")
          .update({ subscription_status: "past_due" })
          .eq("id", orgId);

        break;
      }

      default:
        console.log(`➡️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json(
      { error: err.message ?? "Webhook error" },
      { status: 500 }
    );
  }
}
