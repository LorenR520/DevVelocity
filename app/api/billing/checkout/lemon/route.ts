import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    if (!plan) {
      return NextResponse.json(
        { error: "Missing plan" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const planMap: Record<string, string> = {
      developer: process.env.LEMON_VARIANT_DEVELOPER!,
      startup: process.env.LEMON_VARIANT_STARTUP!,
      team: process.env.LEMON_VARIANT_TEAM!,
      enterprise: process.env.LEMON_VARIANT_ENTERPRIS!,
    };

    const variantId = planMap[plan];

    if (!variantId) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // -------------------------------
    // ⭐ CREATE LEMON CHECKOUT SESSION
    // -------------------------------
    const res = await fetch(
      process.env.LEMON_CHECKOUT_URL_BASE!,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.api+json",
        },
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              checkout_data: {
                email: user.email,
              },
              product_options: {
                enabled_variants: [variantId],
              },
              product: process.env.LEMON_STORE_ID!,
              custom: {
                user_id: user.id,
                plan,
              },
              redirect_url: `${process.env.APP_URL}/dashboard/billing`,
            },
          },
        }),
      }
    );

    const json = await res.json();

    if (!json?.data?.attributes?.url) {
      console.error("Lemon checkout error:", json);
      return NextResponse.json(
        { error: "Failed to create Lemon checkout" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: json.data.attributes.url,
    });
  } catch (err: any) {
    console.error("Lemon Checkout ERROR:", err);
    return NextResponse.json(
      {
        error: err.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
