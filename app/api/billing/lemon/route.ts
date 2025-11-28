import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("X-Signature") || "";

    // Verify Lemon Squeezy webhook signature
    const secret = process.env.LEMON_WEBHOOK_SECRET!;
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
      Uint8Array.from(atob(signature), c => c.charCodeAt(0)),
      encoder.encode(rawBody)
    );

    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const json = JSON.parse(rawBody);
    const event = json.data;
    const type = json.meta.event_name;

    // Initialize Supabase Admin
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Extract fields
    const attrs = event.attributes;
    const userId = attrs.user_id;
    const status = attrs.status;
    const variantId = attrs.variant_id;

    if (!userId) {
      console.log("Skipping — no userId attached");
      return NextResponse.json({ ok: true });
    }

    // Update user metadata (plan + status)
    await supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        billing_provider: "lemonsqueezy",
        status,
        plan: variantId,
      },
    });

    // Handle billing successful → send receipt (optional)
    if (type === "order_created" || type === "subscription_payment_success") {
      console.log(`Lemon payment success for ${userId}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Lemon Webhook Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Webhook error" },
      { status: 500 }
    );
  }
}
