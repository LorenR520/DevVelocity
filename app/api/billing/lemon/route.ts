// app/api/billing/lemon/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-signature");

  // Validate webhook signature
  const hmac = crypto
    .createHmac("sha256", process.env.LEMON_WEBHOOK_SECRET!)
    .update(raw)
    .digest("hex");

  if (hmac !== signature) {
    console.error("❌ Invalid Lemon Squeezy signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(raw);
  const type = event.meta.event_name;
  const data = event.data?.attributes;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  console.log("🍋 Lemon Webhook:", type);

  // ==========================================================================================
  // ⭐ SUBSCRIPTION CREATED / UPDATED
  // ==========================================================================================
  if (type === "subscription_created" || type === "subscription_updated") {
    const customerEmail = data.user_email;
    const planVariant = data.variant_id;
    const status = data.status;

    // Find user by email
    const { data: user } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", customerEmail)
      .single();

    if (user) {
      await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: {
          billing_provider: "lemonsqueezy",
          plan: planVariant,
          status,
        },
      });

      console.log("🍋 Updated Lemon subscription:", user.id);
    }
  }

  // ==========================================================================================
  // ⭐ INVOICE PAID
  // ==========================================================================================
  if (type === "invoice_paid") {
    await supabase.from("invoices").insert({
      provider: "lemon",
      invoice_id: data.id,
      customer_email: data.user_email,
      amount: data.total / 100,
      currency: data.currency,
      pdf: data.urls?.invoice_url,
      date: new Date().toISOString(),
    });

    console.log("💰 Lemon Invoice Saved:", data.id);
  }

  // ==========================================================================================
  // ⭐ SUBSCRIPTION CANCELLED
  // ==========================================================================================
  if (type === "subscription_cancelled") {
    const email = data.user_email;

    const { data: user } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (user) {
      await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: {
          billing_provider: "lemonsqueezy",
          plan: null,
          status: "canceled",
        },
      });

      console.log("🍋 Subscription cancelled:", user.id);
    }
  }

  return NextResponse.json({ received: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
