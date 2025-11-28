import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { planId, seats, orgId } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: "Missing planId" },
        { status: 400 }
      );
    }

    const variantMap = {
      developer: process.env.LEMON_VARIANT_DEVELOPER!,
      startup: process.env.LEMON_VARIANT_STARTUP!,
      team: process.env.LEMON_VARIANT_TEAM!,
      enterprise: process.env.LEMON_VARIANT_ENTERPRISE!,
    };

    const variantId = variantMap[planId];

    if (!variantId) {
      return NextResponse.json(
        { error: "Invalid planId" },
        { status: 400 }
      );
    }

    // Base Lemon checkout URL
    const url = "https://api.lemonsqueezy.com/v1/checkouts";

    const res = await fetch(url, {
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
            custom_redirect_urls: {
              success_url: `${process.env.APP_URL}/dashboard/billing?success=1`,
              cancel_url: `${process.env.APP_URL}/dashboard/billing?canceled=1`,
            },
            checkout_data: {
              variant_id: variantId,
              custom: {
                org_id: orgId ?? "",
                seats: seats ?? 1,
                plan_id: planId,
              },
            },
          },
        },
      }),
    });

    const json = await res.json();

    if (!json?.data?.attributes?.url) {
      console.error("Lemon JSON:", json);
      return NextResponse.json(
        { error: "Failed to generate checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: json.data.attributes.url,
    });
  } catch (err: any) {
    console.error("Lemon checkout error:", err);
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: 500 }
    );
  }
}
