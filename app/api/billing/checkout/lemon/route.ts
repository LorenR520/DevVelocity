// app/api/billing/checkout/lemon/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { plan, seats } = await req.json();

    if (!plan) {
      return NextResponse.json(
        { error: "Missing plan" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch Lemon Squeezy variant mapping
    const PLANS = {
      developer: process.env.LEMON_DEVELOPER_VARIANT_ID!,
      startup: process.env.LEMON_STARTUP_VARIANT_ID!,
      team: process.env.LEMON_TEAM_VARIANT_ID!,
      enterprise: process.env.LEMON_ENTERPRISE_VARIANT_ID!,
    };

    const variantId = PLANS[plan as keyof typeof PLANS];

    if (!variantId) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // ============================
    // ⭐ Prepare checkout payload
    // ============================
    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: user.email,
            custom: {
              user_id: user.id,
              plan_id: plan,
              seats: seats ?? null,
            },
          },
          product_options: {
            redirect_url: `${process.env.APP_URL}/dashboard/billing`,
          },
        },
        relationships: {
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    };

    // ============================
    // ⭐ Create Lemon checkout URL
    // ============================
    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Lemon checkout error:", err);
      return NextResponse.json(
        { error: "Lemon Squeezy error", details: err },
        { status: 500 }
      );
    }

    const json = await res.json();
    const url = json.data.attributes.url;

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("Checkout (Lemon) error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
