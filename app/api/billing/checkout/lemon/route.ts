// app/api/billing/checkout/lemon/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    if (!plan) {
      return NextResponse.json(
        { error: "Missing plan ID" },
        { status: 400 }
      );
    }

    // Map DevVelocity → LemonSqueezy Variant IDs
    const planToVariant: Record<string, number> = {
      developer: 101,
      startup: 102,
      team: 103,
      enterprise: 104, // you will configure "Contact Sales" variant
    };

    const variantId = planToVariant[plan];

    if (!variantId) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // --------------------------------------------
    // ⭐ SUPABASE SESSION: Identify Current User
    // --------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "No auth token provided" },
        { status: 401 }
      );
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);

    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: "Invalid or expired session token" },
        { status: 401 }
      );
    }

    const user = userData.user;

    // --------------------------------------------
    // ⭐ Create Lemon Checkout
    // --------------------------------------------
    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: user.email,
              custom: {
                user_id: user.id,
              },
            },
            product_options: {
              redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
              receipt_button_text: "Return to DevVelocity",
            },
            expires_at: null,
          },
          relationships: {
            store: {
              data: { type: "stores", id: process.env.LEMON_STORE_ID },
            },
            variant: {
              data: { type: "variants", id: variantId.toString() },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      console.error("Lemon checkout creation error:", await res.text());
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    const json = await res.json();
    const checkoutUrl =
      json.data?.attributes?.urls?.checkout ?? null;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Checkout URL missing from Lemon response" },
        { status: 500 }
      );
    }

    // --------------------------------------------
    // ⭐ Return Checkout URL
    // --------------------------------------------
    return NextResponse.json({
      ok: true,
      url: checkoutUrl,
    });
  } catch (err: any) {
    console.error("Lemon Checkout Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
