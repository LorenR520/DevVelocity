import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendReceipt } from "@/server/email/send-receipt";

export const config = {
  runtime: "edge", // Cloudflare compatibility
};

export async function POST(req: Request) {
  try {
    const body = await req.text(); // Stripe requires raw body
    const signature = req.headers.get("stripe-signature");

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    if (!webhookSecret) {
      console.error("❌ Missing STRIPE_WEBHOOK_SECRET env variable");
      return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature!,
        webhookSecret
      );
    } catch (err: any) {
      console.error("❌ Stripe signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Initialize Supabase Admin
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ================================================================
    // ⭐ 1. SUBSCRIPTION CREATED / UPDATED
    // ================================================================
    if (event.type === "customer.subscription.updated" ||
        event.type === "customer.subscription.created") {

      const sub = event.data.object as Stripe.Subscription;
      const customer = sub.customer as any;

      const planId = sub.metadata.plan_id;
      const orgId = sub.metadata.org_id;
      const seats = sub.metadata.seats;

      // Update org billing metadata
      await supabase
        .from("organizations")
        .update({
          plan_id: planId,
          billing_provider: "stripe",
          subscription_status: sub.status,
          seats_allocated: seats,
          stripe_subscription_id: sub.id,
        })
        .eq("id", orgId);

      console.log("✅ Subscription updated for org:", orgId);
    }

    // ================================================================
    // ⭐ 2. INVOICE PAYMENT SUCCEEDED (send receipt)
    // ================================================================
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;

      await sendReceipt({
        to: invoice.customer_email!,
        plan: invoice.lines.data[0]?.description ?? "Plan",
        seats: invoice.lines.data[0]?.quantity ?? 1,
        amount: invoice.amount_paid / 100,
      });

      console.log("📨 Receipt email sent");
    }

    // ================================================================
    // ⭐ 3. SUBSCRIPTION CANCELED
    // ================================================================
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;

      const orgId = sub.metadata.org_id;

      await supabase
        .from("organizations")
        .update({
          subscription_status: "canceled",
        })
        .eq("id", orgId);

      console.log("⚠️ Subscription canceled for org:", orgId);
    }

    // ================================================================
    // ⭐ 4. USAGE / METERED BILLING EVENTS (optional future)
    // ================================================================
    if (event.type === "invoice.item.created") {
      const item = event.data.object as Stripe.InvoiceItem;

      // You can flag usage billing here if needed
      console.log("📊 Usage invoice item created:", item.id);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("❌ Stripe webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
