// app/api/billing/lemon/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { plan, orgId } = await req.json();

    if (!plan || !orgId) {
      return NextResponse.json(
        { error: "Missing plan or orgId" },
        { status: 400 }
      );
    }

    // Map plan → Lemon variant
    const variantMap: Record<string, string> = {
      developer: process.env.LEMON_VARIANT_DEVELOPER!,
      startup: process.env.LEMON_VARIANT_STARTUP!,
      team: process.env.LEMON_VARIANT_TEAM!,
      enterprise: process.env.LEMON_VARIANT_ENTERPRISE!,
    };

    const variantId = variantMap[plan];
    if (!variantId) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Supabase admin
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const res = await fetch(
      `${process.env.LEMON_CHECKOUT_URL_BASE}`,
      {
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
              product_id: process.env.LEMON_STORE_ID,
              variant_id: variantId,
              checkout_data: {
                email: user.email,
                custom: {
                  user_id: user.id,
                  org_id: orgId,
                  plan,
                },
              },
              redirect_url: `${process.env.APP_URL}/dashboard/billing/success`,
            },
          },
        }),
      }
    );

    const json = await res.json();

    if (!json?.data?.attributes?.url) {
      return NextResponse.json(
        { error: "Failed to create Lemon checkout" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: json.data.attributes.url,
    });
  } catch (err: any) {
    console.error("Lemon checkout error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
