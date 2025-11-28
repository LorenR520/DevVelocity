// app/api/billing/checkout/lemon/route.ts

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { plan, userId } = await req.json();

    if (!plan || !userId) {
      return NextResponse.json(
        { error: "Missing plan or userId" },
        { status: 400 }
      );
    }

    // Map plan → Lemon variant
    const planToVariant: Record<string, string> = {
      developer: process.env.LEMON_VARIANT_DEVELOPER!,
      startup: process.env.LEMON_VARIANT_STARTUP!,
      team: process.env.LEMON_VARIANT_TEAM!,
      enterprise: process.env.LEMON_VARIANT_ENTERPRISE!,
    };

    const variantId = planToVariant[plan];

    if (!variantId) {
      return NextResponse.json(
        { error: "Unknown plan" },
        { status: 400 }
      );
    }

    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          custom_price: null,
          expires_at: null,
          preview: false,
        },
        relationships: {
          store: { data: { type: "stores", id: process.env.LEMON_STORE_ID } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    };

    const res = await fetch(
      `${process.env.LEMON_CHECKOUT_URL_BASE}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const json = await res.json();

    const checkoutUrl =
      json?.data?.attributes?.url ?? null;

    if (!checkoutUrl) {
      console.error("Lemon checkout creation failed:", json);
      return NextResponse.json(
        { error: "Failed to create Lemon checkout" },
        { status: 500 }
      );
    }

    // Attach ?userId= so webhook can map user → subscription
    const finalUrl = `${checkoutUrl}?userId=${userId}`;

    return NextResponse.json({
      url: finalUrl,
    });
  } catch (err: any) {
    console.error("Lemon checkout error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
