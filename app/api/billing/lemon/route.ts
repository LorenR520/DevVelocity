// app/api/billing/lemon/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Load raw request body (needed for signature verification)
async function rawBody(req: Request): Promise<string> {
  const text = await req.text();
  return text;
}

export async function POST(req: Request) {
  try {
    const body = await rawBody(req);
    const signature = req.headers.get("x-signature")!;
    const secret = process.env.LEMON_WEBHOOK_SECRET!;

    // -----------------------------------
    // ⭐ Verify Lemon Squeezy signature
    // -----------------------------------
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      new Uint8Array(
        body.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      ),
      encoder.encode(body)
    );

    if (!valid) {
      console.error("❌ Invalid Lemon Squeezy signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const json = JSON.parse(body);

    const event = json.meta.event_name;
    const data = json.data;
    const attributes = data?.attributes;

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Extract userId stored as metadata in checkout
    const userId = attributes?.user_id ?? attributes?.checkout_data?.custom?.userId;
    const plan = attributes?.variant_id;
    const status = attributes?.status;
    const seats = attributes?.user_count ?? 1;

    // -------------------------------
    // ⭐ 1. Subscription Created / Updated
    // -------------------------------
    if (event === "subscription_created" || event === "subscription_updated") {
      if (userId) {
        await supabase.auth.admin.updateUserById(userId, {
          app_metadata: {
            billing_provider: "lemonsqueezy",
            plan,
            seats,
            status,
          },
        });

        console.log("📦 Updated LS subscription:", userId);
      }
    }

    // -------------------------------
    // ⭐ 2. Subscription Canceled
    // -------------------------------
    if (event === "subscription_cancelled") {
      if (userId) {
        await supabase.auth.admin.updateUserById(userId, {
          app_metadata: {
            billing_provider: "lemonsqueezy",
            plan: null,
            seats: null,
            status: "canceled",
          },
        });

        console.log("❌ Lemon subscription canceled:", userId);
      }
    }

    // -------------------------------
    // ⭐ 3. Invoice Paid — store billing event
    // -------------------------------
    if (event === "invoice_paid") {
      await supabase.from("billing_events").insert({
        provider: "lemon",
        invoice_id: attributes?.identifier,
        amount: attributes?.total / 100,
        currency: attributes?.currency?.toUpperCase(),
        pdf: attributes?.urls?.invoice_url,
        type: "charge",
        user_id: userId ?? null,
      });

      console.log("🧾 Lemon invoice saved:", attributes?.identifier);
    }

    // -------------------------------
    // ⭐ 4. Plan Switched
    // -------------------------------
    if (event === "subscription_updated" && attributes?.variant_id) {
      if (userId) {
        await supabase.auth.admin.updateUserById(userId, {
          app_metadata: {
            billing_provider: "lemonsqueezy",
            plan: attributes.variant_id,
            seats,
            status,
          },
        });

        console.log("🔄 Plan switched for user:", userId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Lemon webhook error:", err.message);
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
