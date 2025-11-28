import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendReceipt } from "@/server/email/send-receipt";

export const config = {
  runtime: "edge", // Cloudflare Pages compatible
};

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("X-Signature");

    const secret = process.env.LEMON_WEBHOOK_SECRET;
    if (!secret) {
      console.error("❌ Missing LEMON_WEBHOOK_SECRET");
      return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
    }

    // ------------------------------------------------------
    // ⭐ VERIFY SIGNATURE (HMAC SHA256)
    // ------------------------------------------------------
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      Uint8Array.from(Buffer.from(signature!, "hex")),
      encoder.encode(body)
    );

    if (!isValid) {
      console.error("❌ Invalid Lemon Squeezy webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // ------------------------------------------------------
    // ⭐ Parse event
    // ------------------------------------------------------
    const event = JSON.parse(body);
    const type = event.meta.event_name;
    const data = event.data;

    // Initialize Supabase Admin
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ------------------------------------------------------
    // ⭐ Extract metadata
    // ------------------------------------------------------
    const planId = data.attributes?.custom_data?.plan ?? null;
    const orgId = data.attributes?.custom_data?.orgId ?? null;
    const userEmail = data.attributes?.user_email ?? null;

    // ------------------------------------------------------
    // ⭐ SUBSCRIPTION CREATED / UPDATED
    // ------------------------------------------------------
    if (type === "subscription_created" || type === "subscription_updated") {
      await supabase
        .from("organizations")
        .update({
          plan_id: planId,
          billing_provider: "lemon_squeezy",
          subscription_status: data.attributes.status,
          lemon_subscription_id: data.id,
        })
        .eq("id", orgId);

      console.log(`🔄 Lemon subscription updated for org ${orgId}`);
    }

    // ------------------------------------------------------
    // ⭐ SUBSCRIPTION CANCELLED
    // ------------------------------------------------------
    if (type === "subscription_cancelled") {
      await supabase
        .from("organizations")
        .update({
          subscription_status: "canceled",
        })
        .eq("id", orgId);

      console.log(`⚠️ Subscription cancelled for org ${orgId}`);
    }

    // ------------------------------------------------------
    // ⭐ INVOICE PAID → SEND RECEIPT
    // ------------------------------------------------------
    if (type === "invoice_paid") {
      const attrs = data.attributes;

      await sendReceipt({
        to: userEmail,
        plan: planId ?? "Plan",
        seats: attrs.seat_quantity ?? 1,
        amount: attrs.total / 100,
      });

      console.log("📨 Lemon receipt sent");
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Lemon webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
