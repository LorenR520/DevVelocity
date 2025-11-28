import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendReceipt } from "@/server/email/send-receipt";

export const runtime = "edge"; // Cloudflare-compatible

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const event = body?.meta?.event_name;
    const data = body?.data;

    if (!event || !data) {
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }

    // ENV (Cloudflare Pages runtime)
    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Extract metadata (userId + plan)
    const custom = data.attributes?.checkout_data?.custom || {};
    const userId = custom.userId;
    const planId = custom.plan;

    // Subscription ID / status
    const subscriptionId = data.id;
    const status = data.attributes?.status;

    // Payment details
    const amountPaid = data.attributes?.total ?? 0;
    const currency = data.attributes?.currency ?? "USD";

    console.log("📨 Lemon Webhook:", event);

    // --- 1. NEW SUBSCRIPTION CREATED ---
    if (event === "subscription_created") {
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "lemonsqueezy",
          plan_id: planId,
          subscription_id: subscriptionId,
          status,
        },
      });
    }

    // --- 2. SUBSCRIPTION UPDATED ---
    if (event === "subscription_updated") {
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "lemonsqueezy",
          plan_id: planId,
          subscription_id: subscriptionId,
          status,
        },
      });
    }

    // --- 3. PAYMENT SUCCEEDED (Send receipt) ---
    if (event === "order_paid") {
      await sendReceipt({
        to: data.attributes.user_email,
        plan: planId,
        seats: 1, // Lemon doesn’t include seat counts directly
        amount: amountPaid / 100,
      });

      // Log invoice
      await supabase.from("billing_events").insert({
        org_id: custom.orgId,
        type: "invoice",
        amount: amountPaid / 100,
        provider: "lemonsqueezy",
        details: {
          subscription_id: subscriptionId,
          currency,
        },
      });
    }

    // --- 4. CANCELED OR EXPIRED ---
    if (event === "subscription_expired" || event === "subscription_canceled") {
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "lemonsqueezy",
          plan_id: "developer", // downgrade to lowest tier
          status: "canceled",
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("❌ Lemon webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
