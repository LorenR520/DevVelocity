// app/api/billing/lemon/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false, // required for Lemon webhook raw body
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
  try {
    const rawBody = await buffer(req.body!);
    const bodyString = rawBody.toString("utf8");

    // Lemon webhook secret
    const signatureHeader = req.headers.get("X-Lemon-Signature")!;
    const secret = process.env.LEMON_WEBHOOK_SECRET!;

    // -----------------------------
    // ⭐ Verify Webhook Signature
    // -----------------------------
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const verified = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      Buffer.from(signatureHeader, "hex"),
      new TextEncoder().encode(bodyString)
    );

    if (!verified) {
      console.error("❌ Invalid Lemon Squeezy webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const json = JSON.parse(bodyString);
    const event = json.meta.event_name;
    const data = json.data;
    const attributes = data.attributes;

    // Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // -------------------------------------------------------------------
    // ⭐ Handle Subscription Sync: created / updated / canceled
    // -------------------------------------------------------------------
    if (
      event === "subscription_created" ||
      event === "subscription_updated" ||
      event === "subscription_resumed" ||
      event === "subscription_paused"
    ) {
      const userId = attributes.user_id;
      const plan = attributes.variant_id;
      const status = attributes.status;

      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "lemon",
          plan,
          status,
          current_period_end: attributes.renews_at,
        },
      });

      console.log("🔄 Lemon subscription synced for user:", userId);
    }

    // -------------------------------------------------------------------
    // ⭐ Handle Subscription Cancellation
    // -------------------------------------------------------------------
    if (event === "subscription_cancelled") {
      const userId = attributes.user_id;

      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "lemon",
          plan: "canceled",
          status: "canceled",
        },
      });

      console.log("❌ Lemon subscription canceled:", userId);
    }

    // -------------------------------------------------------------------
    // ⭐ Handle Invoice Payment Success
    // -------------------------------------------------------------------
    if (event === "invoice_paid") {
      const amount = attributes.total / 100;
      const currency = attributes.currency;

      await supabase.from("billing_events").insert({
        org_id: attributes.user_id, // or org lookup if mapping later
        type: "lemon_invoice",
        amount,
        currency,
        details: {
          invoice_id: data.id,
          status: attributes.status,
        },
      });

      console.log("💰 Lemon invoice paid:", data.id);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("🔥 Lemon webhook error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
