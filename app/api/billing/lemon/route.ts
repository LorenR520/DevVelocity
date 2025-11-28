import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sendReceipt } from "@/server/email/send-receipt";

export const runtime = "edge";

// Verify Lemon Squeezy webhook signature
function verifyLemonSignature(rawBody: string, signature: string, secret: string) {
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hmac)
  );
}

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  if (!verifyLemonSignature(raw, signature, process.env.LEMON_WEBHOOK_SECRET!)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const json = JSON.parse(raw);
  const event = json.meta.event_name;
  const data = json.data;
  const attributes = data.attributes;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const subscriptionId = data.id;
  const variantId = attributes.variant_id;
  const status = attributes.status;
  const userId = attributes.user_id;
  const email = attributes.user_email;

  // ======================================================
  // ⭐ 1. Subscription Created / Updated
  // ======================================================
  if (
    event === "subscription_created" ||
    event === "subscription_updated"
  ) {
    if (userId) {
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "lemonsqueezy",
          plan: variantId,
          status: status,
        },
      });
    }

    await supabase
      .from("billing_events")
      .insert({
        provider: "lemon",
        type: "subscription_update",
        provider_invoice_id: subscriptionId,
        amount: attributes.renewal_total / 100,
        details: attributes,
      });
  }

  // ======================================================
  // ⭐ 2. Charge Success → Send receipt email
  // ======================================================
  if (event === "order_refunded" || event === "subscription_payment_success") {
    try {
      await sendReceipt({
        to: email,
        plan: attributes.product_name,
        seats: attributes.renews_at ? 1 : null,
        amount: attributes.total / 100,
      });
    } catch (err) {
      console.error("Failed to send Lemon receipt", err);
    }
  }

  // ======================================================
  // ⭐ 3. Invoice Paid / Finalized (Store invoice in billing_events)
  // ======================================================
  if (event === "invoice_paid") {
    await supabase.from("billing_events").insert({
      provider: "lemon",
      type: "invoice",
      provider_invoice_id: attributes.invoice_id,
      amount: attributes.total / 100,
      details: attributes,
    });
  }

  // ======================================================
  // ⭐ 4. Subscription Canceled
  // ======================================================
  if (event === "subscription_cancelled") {
    if (userId) {
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: { status: "canceled" },
      });
    }

    await supabase
      .from("billing_events")
      .insert({
        provider: "lemon",
        type: "subscription_canceled",
        provider_invoice_id: subscriptionId,
        details: attributes,
      });
  }

  return NextResponse.json({ received: true });
}
