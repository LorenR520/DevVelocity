import { NextResponse } from "next/server";
import pricing from "@/marketing/pricing.json";

export const runtime = "edge"; // Cloudflare Pages compatible

export async function POST(req: Request) {
  try {
    const { planId, userId, orgId } = await req.json();

    if (!planId || !userId || !orgId) {
      return NextResponse.json(
        { error: "Missing planId, userId, or orgId" },
        { status: 400 }
      );
    }

    // Lookup pricing data
    const plan = pricing.plans.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid planId" }, { status: 400 });
    }

    // Variant Lookup
    const variantMap: Record<string, string> = {
      developer: process.env.LEMON_VARIANT_DEVELOPER!,
      startup: process.env.LEMON_VARIANT_STARTUP!,
      team: process.env.LEMON_VARIANT_TEAM!,
      enterprise: process.env.LEMON_VARIANT_ENTERPRISE!,
    };

    const variantId = variantMap[planId];
    if (!variantId) {
      return NextResponse.json(
        { error: "Missing Lemon variant for plan" },
        { status: 500 }
      );
    }

    const response = await fetch(
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
              store_id: process.env.LEMON_STORE_ID,
              variant_id: variantId,
              checkout_data: {
                custom: {
                  userId,
                  orgId,
                  plan: planId,
                },
              },
              product_options: {
                redirect_url: `${process.env.APP_URL}/dashboard/billing?success=1`,
                receipt_button_text: "Return to DevVelocity",
              },
            },
          },
        }),
      }
    );

    const json = await response.json();

    if (!json?.data?.attributes?.url) {
      console.error("Lemon checkout error:", json);
      return NextResponse.json(
        { error: "Failed to create Lemon checkout" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: json.data.attributes.url });
  } catch (err: any) {
    console.error("Lemon Checkout Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
