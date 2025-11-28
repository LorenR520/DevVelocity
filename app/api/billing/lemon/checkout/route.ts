import { NextResponse } from "next/server";
import pricing from "@/marketing/pricing.json";

export const runtime = "edge"; // Cloudflare Pages compatible

export async function POST(req: Request) {
  try {
    const { userId, orgId, plan } = await req.json();

    if (!userId || !plan || !orgId) {
      return NextResponse.json(
        { error: "Missing userId, orgId, or plan" },
        { status: 400 }
      );
    }

    // Validate plan from pricing.json
    const selected = pricing.plans.find((p) => p.id === plan);
    if (!selected) {
      return NextResponse.json(
        { error: `Invalid plan: ${plan}` },
        { status: 400 }
      );
    }

    // Enterprise pricing → no direct checkout
    if (plan === "enterprise") {
      return NextResponse.json({
        url: `${process.env.APP_URL}/contact/sales?org=${orgId}`,
      });
    }

    const apiKey = process.env.LEMON_API_KEY!;
    const storeId = process.env.LEMON_STORE_ID!;
    const variantId = process.env.LEMON_VARIANT_ID_PREFIX + selected.id;

    const checkoutPayload = {
      data: {
        type: "checkouts",
        attributes: {
          store_id: storeId,
          product_id: variantId,
          checkout_data: {
            email: "",
            custom: {
              userId,
              orgId,
              plan,
            },
          },
          checkout_options: {
            success_url: `${process.env.APP_URL}/dashboard/billing?success=1`,
            cancel_url: `${process.env.APP_URL}/dashboard/billing?canceled=1`,
          },
        },
      },
    };

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutPayload),
    });

    const json = await response.json();
    const url = json?.data?.attributes?.url;

    if (!url) {
      console.error("❌ Lemon checkout error:", json);
      return NextResponse.json(
        { error: "Checkout failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
