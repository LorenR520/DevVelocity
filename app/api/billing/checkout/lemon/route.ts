// app/api/billing/checkout/lemon/route.ts

import { NextResponse } from "next/server";
import pricing from "@/marketing/pricing.json";

export async function POST(req: Request) {
  try {
    const { plan, userId } = await req.json();

    if (!plan || !userId) {
      return NextResponse.json(
        { error: "Missing plan or userId" },
        { status: 400 }
      );
    }

    // Lookup plan in pricing.json
    const selected = pricing.plans.find((p) => p.id === plan);

    if (!selected) {
      return NextResponse.json(
        { error: "Invalid plan ID" },
        { status: 400 }
      );
    }

    // Map plan → Lemon Squeezy Variant ID
    const variantMap: Record<string, string> = {
      developer: process.env.LEMON_VARIANT_DEVELOPER!,
      startup: process.env.LEMON_VARIANT_STARTUP!,
      team: process.env.LEMON_VARIANT_TEAM!,
      enterprise: process.env.LEMON_VARIANT_ENTERPRISE!,
    };

    const variantId = variantMap[plan];
    const storeId = process.env.LEMON_STORE_ID!;
    const checkoutBase = process.env.LEMON_CHECKOUT_URL_BASE!;

    // Enterprise → redirect to sales instead of auto-checkout
    if (plan === "enterprise") {
      return NextResponse.json({
        url: "https://devvelocity.app/contact-sales",
      });
    }

    // Build checkout payload
    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: {
              userId,
              plan,
            },
          },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    };

    // Create checkout
    const res = await fetch(checkoutBase, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!json?.data?.attributes?.url) {
      console.error("❌ Lemon checkout error:", json);
      return NextResponse.json(
        { error: "Checkout creation failed", details: json },
        { status: 500 }
      );
    }

    // Return the direct checkout URL
    return NextResponse.json({
      url: json.data.attributes.url,
    });
  } catch (err: any) {
    console.error("Lemon Checkout Error:", err.message);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
