// app/api/billing/stripe/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /// -------------------------
  /// Process subscription updates
  /// -------------------------
  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.deleted"
  ) {
    const sub = event.data.object as Stripe.Subscription;

    const userId = sub.customer_details?.metadata?.userId
      || (sub.customer as any)?.metadata?.userId;

    if (!userId) {
      console.log("🚨 No Supabase user linked to subscription");
      return NextResponse.json({ ok: true });
    }

    const priceId = sub.items.data[0].price.id;
    const status = sub.status;
    const renews = new Date(sub.current_period_end * 1000).toISOString();

    await supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        billing_provider: "stripe",
        plan: priceId,
        status,
        renews_at: renews
      }
    });

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
