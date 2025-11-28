import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";

    // Validate signature
    const crypto = await import("crypto");
    const hmac = crypto
      .createHmac("sha256", process.env.LEMON_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest("hex");

    if (hmac !== signature) {
      console.error("❌ Invalid Lemon Squeezy webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.meta?.event_name;
    const data = payload.data;

    if (!event || !data) {
      return NextResponse.json(
        { error: "Invalid Lemon webhook payload" },
        { status: 400 }
      );
    }

    // Supabase Admin client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const subscription = data.attributes;
    const customerId = data.relationships?.customer?.data?.id;
    const variantId = subscription.variant_id;
    const status = subscription.status;

    // -------------------------------------------
    // ⭐ Map Lemon variant_id → your plan IDs
    // -------------------------------------------
    const variantToPlan: Record<number, string> = {
      [Number(process.env.LEMON_VARIANT_DEVELOPER)]: "developer",
      [Number(process.env.LEMON_VARIANT_STARTUP)]: "startup",
      [Number(process.env.LEMON_VARIANT_TEAM)]: "team",
      [Number(process.env.LEMON_VARIANT_ENTERPRISE)]: "enterprise",
    };

    const mappedPlan = variantToPlan[variantId] ?? "unknown";

    // -------------------------------------------
    // ⭐ Fetch the customer to get the userId
    // -------------------------------------------
    let userId = null;

    if (customerId) {
      const customerRes = await fetch(
        `https://api.lemonsqueezy.com/v1/customers/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
            Accept: "application/vnd.api+json",
          },
        }
      );

      const customerJson = await customerRes.json();
      userId = customerJson?.data?.attributes?.user_id;
    }

    // -------------------------------------------
    // ⭐ Handle Events
    // -------------------------------------------
    switch (event) {
      // ------------------------------
      // ⭐ Subscription Created
      // ------------------------------
      case "subscription_created": {
        if (userId) {
          await supabase.auth.admin.updateUserById(userId, {
            app_metadata: {
              billing_provider: "lemonsqueezy",
              plan: mappedPlan,
              lemon_subscription_id: data.id,
              status,
            },
          });
        }
        break;
      }

      // ------------------------------
      // ⭐ Subscription Updated
      // ------------------------------
      case "subscription_updated": {
        if (userId) {
          await supabase.auth.admin.updateUserById(userId, {
            app_metadata: {
              billing_provider: "lemonsqueezy",
              plan: mappedPlan,
              lemon_subscription_id: data.id,
              status,
            },
          });
        }
        break;
      }

      // ------------------------------
      // ⭐ Subscription Canceled
      // ------------------------------
      case "subscription_cancelled": {
        if (userId) {
          await supabase.auth.admin.updateUserById(userId, {
            app_metadata: {
              billing_provider: "lemonsqueezy",
              plan: "free",
              status: "canceled",
            },
          });
        }
        break;
      }

      // ------------------------------
      // ⭐ Invoice Paid ⇒ Billing History
      // ------------------------------
      case "invoice_paid": {
        await supabase.from("billing_events").insert({
          provider: "lemon",
          invoice_id: data.id,
          amount: subscription.total / 100,
          currency: subscription.currency,
          type: "lemon_invoice",
          details: subscription,
        });
        break;
      }

      default:
        console.log(`ℹ️ Unhandled Lemon event: ${event}`);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("❌ Lemon Webhook Error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
