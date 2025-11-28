import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    const signature = req.headers.get("X-Signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    const hmac = crypto
      .createHmac("sha256", process.env.LEMON_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest("hex");

    if (signature !== hmac) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const eventName = body.meta?.event_name;
    const data = body.data;

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // ---------------------------------------------------------------------
    // ⭐ Identify subscription + user
    // ---------------------------------------------------------------------
    const attributes = data?.attributes;

    const customerEmail = attributes?.user_email;
    const subscriptionId = data?.id;
    const status = attributes?.status;
    const variantId = attributes?.variant_id;

    if (!customerEmail) {
      return NextResponse.json(
        { error: "No customer email in event" },
        { status: 400 }
      );
    }

    // Lookup organization by owner email
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_email", customerEmail)
      .single();

    if (orgErr || !org) {
      console.log("Organization not found for:", customerEmail);
      return NextResponse.json({ ok: true });
    }

    // ---------------------------------------------------------------------
    // ⭐ Map Lemon variant to your plan_id
    // ---------------------------------------------------------------------
    const lemonToPlanMap: Record<string, string> = {
      [process.env.LEMON_VARIANT_DEVELOPER!]: "developer",
      [process.env.LEMON_VARIANT_STARTUP!]: "startup",
      [process.env.LEMON_VARIANT_TEAM!]: "team",
      [process.env.LEMON_VARIANT_ENTERPRISE!]: "enterprise",
    };

    const newPlan = lemonToPlanMap[String(variantId)] ?? null;

    // ---------------------------------------------------------------------
    // ⭐ Handle events
    // ---------------------------------------------------------------------

    // 🔄 Subscription created or renewed
    if (
      eventName === "subscription_created" ||
      eventName === "subscription_payment_success" ||
      eventName === "subscription_renewed"
    ) {
      await supabase
        .from("organizations")
        .update({
          billing_provider: "lemon",
          plan_id: newPlan,
          subscription_status: status,
          lemon_subscription_id: subscriptionId,
        })
        .eq("id", org.id);

      console.log("✔ Updated Lemon subscription:", org.id);
    }

    // ❌ Subscription canceled
    if (eventName === "subscription_cancelled") {
      await supabase
        .from("organizations")
        .update({
          subscription_status: "canceled",
        })
        .eq("id", org.id);
    }

    // ---------------------------------------------------------------------
    // ⭐ Log billing event (invoices)
    // ---------------------------------------------------------------------
    if (eventName === "order_created") {
      const amount = attributes?.total / 100;

      await supabase.from("billing_events").insert({
        org_id: org.id,
        type: "lemon_invoice",
        amount,
        details: attributes,
      });

      console.log("✔ Logged Lemon invoice:", org.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Lemon Webhook Error:", err);
    return NextResponse.json(
      { error: err.message || "Webhook error" },
      { status: 500 }
    );
  }
}
