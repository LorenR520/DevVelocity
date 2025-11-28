// app/api/billing/checkout/lemon/route.ts

import { NextResponse } from "next/server";
import pricing from "@/marketing/pricing.json";

export async function POST(req: Request) {
  try {
    const { plan, userId, email } = await req.json();

    if (!plan || !userId) {
      return NextResponse.json(
        { error: "Missing plan or userId" },
        { status: 400 }
      );
    }

    const selected = pricing.plans.find((p) => p.id === plan);

    if (!selected) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Lemon Store + Variant IDs (you can update later)
    const storeId = process.env.LEMON_STORE_ID!;
    const variantId = process.env[`LEMON_VARIANT_${plan.toUpperCase()}`];

    if (!variantId) {
      return NextResponse.json(
        { error: `Missing variant ID for plan: ${plan}` },
        { status: 500 }
      );
    }

    const checkout = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
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
            store_id: storeId,
            variant_id: variantId,
            checkout_data: {
              email: email ?? "",
              custom: {
                userId,
                plan,
              },
            },
            preview: false,
          },
        },
      }),
    }).then((r) => r.json());

    const url = checkout?.data?.attributes?.url;

    if (!url) {
      console.error("Lemon checkout error:", checkout);
      return NextResponse.json(
        { error: "Failed to create Lemon checkout" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("Lemon checkout error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
