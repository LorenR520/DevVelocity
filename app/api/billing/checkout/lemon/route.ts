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

    // Match plan from pricing.json
    const selected = pricing.plans.find((p: any) => p.id === plan);

    if (!selected) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Call Lemon Squeezy API
    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
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
              custom: {
                userId,
                plan,
              },
            },
          },
        },
      }),
    });

    const json = await response.json();

    if (!json?.data?.attributes?.url) {
      console.error("Lemon response:", json);
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
      { error: err.message ?? "Internal Lemon checkout error" },
      { status: 500 }
    );
  }
}
