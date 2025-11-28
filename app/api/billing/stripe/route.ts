// app/api/billing/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendReceipt } from "@/server/email/send-receipt";

export async function POST(req: Request) {
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
    console.error("❌ Stripe Webhook Signature Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  console.log("🔔 Stripe Event:", event.type);

  // Init Supabase Admin
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // ==========================================================
  // ⭐ 1. Checkout Completed — Assign subscription to user/org
  // ==========================================================
  if (event.type === "checkout.session.completed") {
    const session: any = event.data.object;

    await supabase.auth.admin.updateUserById(session.metadata.userId, {
      app_metadata: {
        billing_provider: "stripe",
        plan: session.metadata.plan,
        status: "active",
        customer_id: session.customer,
      },
    });

    console.log("✅ User updated with Stripe subscription");
  }

  // ==========================================================
  // ⭐ 2. Successful Payment — Send Receipt
  // ==========================================================
  if (event.type === "invoice.payment_succeeded") {
    const invoice: any = event.data.object;

    await sendReceipt({
      to: invoice.customer_email,
      plan: invoice.lines.data[0].description,
      seats: invoice.quantity ?? 1,
      amount: invoice.amount_paid / 100,
    });

    console.log("📧 Receipt sent");
  }

  // ==========================================================
  // ⭐ 3. Subscription Updated
  // ==========================================================
  if (event.type === "customer.subscription.updated") {
    const sub: any = event.data.object;

    const userId = sub.metadata.userId;

    await supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        billing_provider: "stripe",
        plan: sub.items.data[0].price.id,
        status: sub.status,
        subscription_id: sub.id,
      },
    });

    console.log("🔄 Subscription updated in Supabase");
  }

  // ==========================================================
  // ⭐ 4. Subscription Canceled
  // ==========================================================
  if (event.type === "customer.subscription.deleted") {
    const sub: any = event.data.object;

    const userId = sub.metadata.userId;

    await supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        status: "canceled",
      },
    });

    console.log("⚠️ Subscription canceled");
  }

  return NextResponse.json({ ok: true });
}
