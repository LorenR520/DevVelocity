// app/api/billing/lemon/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/*
  Lemon Squeezy webhook handler
  Receives:
    - new subscription
    - subscription updated
    - charges
    - renewals
    - cancellations
*/

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ---------------------------------------------
    // ⭐ Validate Secret Header (Lemon Webhook)
    // ---------------------------------------------
    const secret = req.headers.get("x-signature");
    if (!secret || secret !== process.env.LEMON_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = body.meta?.event_name;
    const data = body.data;
    const attributes = data?.attributes;

    if (!event || !attributes) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // ⭐ Extract subscription info
    // ---------------------------------------------
    const variantId = attributes.variant_id;
    const status = attributes.status;
    const customerId = attributes.user_id;

    // Map Lemon → DevVelocity plan (variant_id)
    const planMap: Record<number, string> = {
      101: "developer",
      102: "startup",
      103: "team",
      104: "enterprise",
    };

    const planId = planMap[variantId] || "developer";

    // ---------------------------------------------
    // ⭐ Initialize Supabase Admin
    // ---------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // ---------------------------------------------
    // ⭐ Find user by metadata (lemon_customer_id)
    // ---------------------------------------------
    const { data: users, error: userErr } = await supabase.auth.admin.listUsers();

    if (userErr || !users) {
      return NextResponse.json(
        { error: "Unable to load users" },
        { status: 500 }
      );
    }

    const user = users.users.find(
      (u: any) => u.app_metadata?.lemon_customer_id == customerId
    );

    if (!user) {
      console.warn("⚠ Lemon user not found for customer:", customerId);
      return NextResponse.json({ ok: true });
    }

    // ---------------------------------------------
    // ⭐ Update user billing metadata
    // ---------------------------------------------
    await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: {
        billing_provider: "lemon",
        lemon_customer_id: customerId,
        plan: planId,
        status,
      },
    });

    console.log(`✨ Updated Lemon billing: user=${user.id} plan=${planId} status=${status}`);

    // ---------------------------------------------
    // ⭐ Record internal invoices for charges
    // ---------------------------------------------
    if (event === "order_created" || event === "subscription_payment_success") {
      await supabase.from("billing_events").insert({
        user_id: user.id,
        type: "subscription_charge",
        provider: "lemon",
        amount: attributes.total / 100,
        currency: attributes.currency,
        details: {
          order_id: data.id,
          plan: planId,
          variant_id: variantId,
        },
      });

      console.log("💰 Recorded Lemon payment event for user:", user.id);
    }

    // ---------------------------------------------
    // ⭐ Handle cancellations / past_due
    // ---------------------------------------------
    if (status === "expired" || status === "past_due" || status === "unpaid") {
      await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: {
          billing_provider: "lemon",
          lemon_customer_id: customerId,
          plan: planId,
          status: "inactive",
        },
      });

      console.log("⚠ Lemon subscription was cancelled or went past due:", user.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Lemon webhook error:", err);
    return NextResponse.json(
      { error: err.message ?? "_server_error" },
      { status: 500 }
    );
  }
}
