import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const sig = req.headers.get("x-signature");

    if (!sig) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const secret = process.env.LEMON_WEBHOOK_SECRET!;
    const computed = crypto
      .createHmac("sha256", secret)
      .update(raw)
      .digest("hex");

    if (computed !== sig) {
      console.error("❌ Lemon webhook signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const json = JSON.parse(raw);
    const event = json.meta.event_name;
    const data = json.data;

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log(`📨 Lemon Webhook: ${event}`);

    // --------------------------------------------
    // 🔥 HANDLE LEMON SQUEEZY EVENTS
    // --------------------------------------------

    switch (event) {
      case "subscription_created":
      case "subscription_updated": {
        const userId = data.attributes.user_id;
        const variantId = data.attributes.variant_id;

        if (!userId) break;

        // Update Supabase metadata
        await supabase.auth.admin.updateUserById(userId, {
          app_metadata: {
            billing_provider: "lemonsqueezy",
            plan: variantId,
            status: data.attributes.status,
          },
        });

        // Update organization table if present
        if (data.attributes.custom_data?.orgId) {
          await supabase
            .from("organizations")
            .update({
              plan_id: variantId,
              subscription_status: data.attributes.status,
            })
            .eq("id", data.attributes.custom_data.orgId);
        }

        break;
      }

      case "subscription_cancelled": {
        const userId = data.attributes.user_id;
        const orgId = data.attributes.custom_data?.orgId;

        if (!userId || !orgId) break;

        // Downgrade organization
        await supabase
          .from("organizations")
          .update({
            plan_id: "developer",
            subscription_status: "canceled",
          })
          .eq("id", orgId);

        break;
      }

      case "invoice_paid": {
        const invoice = data.attributes;
        const orgId = invoice.custom_data?.orgId;

        await supabase.from("billing_events").insert({
          org_id: orgId ?? null,
          type: "lemon_invoice",
          amount: invoice.total / 100,
          details: invoice,
        });

        break;
      }

      default:
        console.log(`⚠️ Unhandled Lemon event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Lemon webhook error:", err);
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: 500 }
    );
  }
}
