import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("X-Signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify Lemon Squeezy signature
    const crypto = await import("crypto");
    const hmac = crypto.createHmac("sha256", process.env.LEMON_WEBHOOK_SECRET!);
    hmac.update(rawBody);
    const digest = hmac.digest("hex");

    if (signature !== digest) {
      console.error("Invalid Lemon webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const type = event.meta.event_name;
    const data = event.data;

    console.log("📩 Lemon Webhook:", type);

    const sub = data?.attributes;
    const userId = sub?.user_id;
    const variantId = sub?.variant_id;

    if (!userId || !variantId) {
      return NextResponse.json(
        { error: "Missing user or variant" },
        { status: 400 }
      );
    }

    // Map each variant to a plan (matching pricing.json)
    const planMap: Record<string, string> = {
      [process.env.LEMON_VARIANT_DEVELOPER!]: "developer",
      [process.env.LEMON_VARIANT_STARTUP!]: "startup",
      [process.env.LEMON_VARIANT_TEAM!]: "team",
      [process.env.LEMON_VARIANT_ENTERPRISE!]: "enterprise",
    };

    const mappedPlan = planMap[String(variantId)];

    // Prepare Supabase admin client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -----------------------------
    // ⭐ SUBSCRIPTION STARTED / UPDATED
    // -----------------------------
    if (
      type === "subscription_created" ||
      type === "subscription_updated" ||
      type === "subscription_payment_success"
    ) {
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "lemonsqueezy",
          plan: mappedPlan,
          lemon_variant: variantId,
          lemon_status: sub.status,
        },
      });

      console.log(`Lemon: Updated user ${userId} -> plan ${mappedPlan}`);
    }

    // -----------------------------
    // ⭐ SUBSCRIPTION CANCELLED
    // -----------------------------
    if (type === "subscription_cancelled") {
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "lemonsqueezy",
          plan: "cancelled",
          lemon_status: "cancelled",
        },
      });

      console.log(`Lemon: User ${userId} subscription cancelled`);
    }

    // -----------------------------
    // ⭐ WRITE INTERNAL BILLING EVENT
    // -----------------------------
    if (type === "subscription_payment_success") {
      const amount = sub.renewal_total / 100;

      await supabase.from("billing_events").insert({
        org_id: userId,
        type: "subscription",
        amount,
        provider: "lemon",
        details: {
          variant: variantId,
          plan: mappedPlan,
          renewal_date: sub.renews_at,
        },
      });

      console.log(`Lemon: Added billing event for renewal $${amount}`);
    }

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("Lemon Webhook Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
