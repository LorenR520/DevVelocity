// app/api/billing/checkout/lemon/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { subscriptionId, orgId, plan } = await req.json();

    if (!subscriptionId || !orgId || !plan) {
      return NextResponse.json(
        { error: "Missing subscriptionId, orgId, or plan" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // -----------------------------
    // GET USER (for validation)
    // -----------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // -----------------------------
    // UPDATE ORG RECORD
    // -----------------------------
    const { error: orgErr } = await supabase
      .from("organizations")
      .update({
        plan_id: plan,
        billing_provider: "lemon",
        lemon_subscription_id: subscriptionId,
        pending_overage_amount: 0,
      })
      .eq("id", orgId);

    if (orgErr) {
      console.error("Failed to update org:", orgErr);
      return NextResponse.json(
        { error: "Failed to update organization" },
        { status: 500 }
      );
    }

    // -----------------------------
    // UPDATE USER METADATA
    // -----------------------------
    await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: {
        billing_provider: "lemon",
        plan,
        lemon_subscription_id: subscriptionId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Lemon subscription linked successfully",
      subscriptionId,
      plan,
    });
  } catch (err: any) {
    console.error("Lemon checkout link error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
