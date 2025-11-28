// app/api/billing/lemon/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "edge",
};

// Validate Lemon webhook signature
function verifyLemonSignature(req: Request, body: string) {
  const secret = process.env.LEMON_WEBHOOK_SECRET!;
  const signature = req.headers.get("X-Signature") || "";

  // Lemon uses SHA256 HMAC (hex)
  const cryptoKey = crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  return cryptoKey
    .then((key) =>
      crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))
    )
    .then((sig) => Buffer.from(sig).toString("hex") === signature);
}

export async function POST(req: Request) {
  const body = await req.text();

  const valid = await verifyLemonSignature(req, body);
  if (!valid) {
    console.error("❌ Invalid Lemon Squeezy signature");
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);
  const type = event.meta.event_name;

  console.log("🔔 Lemon webhook:", type);

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const data = event.data?.attributes;

  switch (type) {
    // ------------------------------------------------------
    // ⭐ CHECKOUT COMPLETE (first purchase)
    // ------------------------------------------------------
    case "checkout.completed": {
      const { order_id, variant_id } = data;
      const orgId = event.meta.custom_data?.orgId;

      if (!orgId) break;

      await supabase
        .from("organizations")
        .update({
          plan_id: variant_id,
          billing_provider: "lemon",
          lemon_order_id: order_id,
        })
        .eq("id", orgId);

      console.log(`✅ Lemon checkout completed for org ${orgId}`);
      break;
    }

    // ------------------------------------------------------
    // ⭐ SUBSCRIPTION RENEWAL PAYMENT
    // ------------------------------------------------------
    case "subscription_payment_success": {
      const sub = event.data.attributes;

      await supabase.from("billing_events").insert({
        org_id: sub.user_id,
        provider: "lemon",
        type: "subscription_payment",
        amount: sub.total / 100,
        currency: sub.currency,
        external_invoice_id: sub.transaction_id,
        status: "paid",
      });

      console.log("💰 Lemon renewal payment saved");
      break;
    }

    // ------------------------------------------------------
    // ⭐ PAYMENT FAILED
    // ------------------------------------------------------
    case "subscription_payment_failed": {
      const sub = event.data.attributes;

      await supabase.from("billing_events").insert({
        org_id: sub.user_id,
        provider: "lemon",
        type: "payment_failed",
        amount: sub.total / 100,
        currency: sub.currency,
        external_invoice_id: sub.transaction_id,
        status: "failed",
      });

      console.warn("⚠️ Lemon payment failed");
      break;
    }

    // ------------------------------------------------------
    // ⭐ SUBSCRIPTION CANCELLED
    // ------------------------------------------------------
    case "subscription_cancelled": {
      const { user_id } = event.data.attributes;

      await supabase
        .from("organizations")
        .update({
          plan_id: "developer", // fallback to lowest tier
          billing_provider: "none",
        })
        .eq("id", user_id);

      console.log("❌ Lemon subscription cancelled for user:", user_id);
      break;
    }

    default:
      console.log("ℹ️ Unhandled Lemon event:", type);
  }

  return NextResponse.json({ received: true });
}
