// app/api/billing/lemon/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const event = body.meta?.event_name;
    const data = body.data;
    const attributes = data?.attributes;

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Validate webhook signature
    const signature = req.headers.get("x-signature");
    if (!signature || signature !== process.env.LEMON_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    console.log("🔔 Lemon Squeezy webhook:", event);

    // Extract subscription info
    const userId = attributes?.user_id;
    const status = attributes?.status;
    const variantId = attributes?.variant_id;

    if (!userId || !variantId) {
      return NextResponse.json(
        { success: true, message: "Ignoring — missing identifiers." }
      );
    }

    // Map variant → plan ID
    const lemonToPlan: Record<string, string> = {
      [process.env.LEMON_VARIANT_DEVELOPER!]: "developer",
      [process.env.LEMON_VARIANT_STARTUP!]: "startup",
      [process.env.LEMON_VARIANT_TEAM!]: "team",
      [process.env.LEMON_VARIANT_ENTERPRISE!]: "enterprise",
    };

    const mappedPlan = lemonToPlan[String(variantId)] ?? null;

    if (!mappedPlan) {
      console.warn("⚠ Unknown Lemon variant:", variantId);
      return NextResponse.json({ success: true });
    }

    // Update Supabase auth user metadata
    await supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        billing_provider: "lemon",
        plan: mappedPlan,
        status,
        variant_id: variantId,
      },
    });

    // Handle cancellation
    if (status === "canceled") {
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          billing_provider: "none",
          plan: "free",
          status: "canceled",
        },
      });
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
