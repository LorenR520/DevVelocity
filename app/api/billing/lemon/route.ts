// app/api/billing/lemon/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendReceipt } from "@/server/email/send-receipt";

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const sig = req.headers.get("x-signature");

    if (!sig) {
      return NextResponse.json(
        { error: "Missing Lemon Squeezy signature" },
        { status: 400 }
      );
    }

    // Validate signature
    const valid = await verifySignature(raw, sig, process.env.LEMON_WEBHOOK_SECRET!);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(raw);

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ============================================================
    // ⭐ EVENT TYPES
    // ============================================================

    switch (event.meta.event_name) {
      // --------------------------------------------------
      // Subscription created or updated
      // --------------------------------------------------
      case "subscription_created":
      case "subscription_updated": {
        const sub = event.data.attributes;

        const orgId = sub.custom_data?.orgId;
        const plan = sub.custom_data?.plan;

        console.log("🔄 Lemon plan update:", orgId, plan);

        await supabase
          .from("organizations")
          .update({
            plan_id: plan,
            lemon_subscription_id: sub.id,
            subscription_status: sub.status,
          })
          .eq("id", orgId);

        break;
      }

      // --------------------------------------------------
      // Subscription canceled
      // --------------------------------------------------
      case "subscription_cancelled": {
        const sub = event.data.attributes;
        const orgId = sub.custom_data?.orgId;

        console.log("❌ Lemon subscription canceled:", orgId);

        await supabase
          .from("organizations")
          .update({
            subscription_status: "canceled",
          })
          .eq("id", orgId);
        break;
      }

      // --------------------------------------------------
      // Invoice paid
      // --------------------------------------------------
      case "invoice_created": {
        const inv = event.data.attributes;
        const email = inv.customer_email;
        const orgId = inv.custom_data?.orgId;
        const plan = inv.custom_data?.plan;

        const amount = inv.total / 100;

        console.log("📬 Sending Lemon receipt:", email);

        // You *can* send branded receipts via Resend
        await sendReceipt({
          to: email,
          plan,
          seats: 1,
          amount,
        });

        // Internal billing log
        await supabase.from("billing_events").insert({
          org_id: orgId,
          type: "lemon_payment",
          amount,
          details: {
            invoice_id: inv.id,
            plan,
            seats: 1,
          },
        });

        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Lemon webhook error:", err);
    return NextResponse.json(
      { error: err.message ?? "Webhook error" },
      { status: 500 }
    );
  }
}

// ============================================================
// ⭐ SIGNATURE VERIFICATION (Lemon requirement)
// ============================================================
async function verifySignature(payload: string, signature: string, secret: string) {
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
    hexToBytes(signature),
    encoder.encode(payload)
  );

  return valid;
}

function hexToBytes(hex: string) {
  const arr = [];
  for (let i = 0; i < hex.length; i += 2) {
    arr.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return new Uint8Array(arr);
}
