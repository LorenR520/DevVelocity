import { NextResponse } from "next/server";
import pricing from "@/marketing/pricing.json";

export async function POST(req: Request) {
  const { plan, userId, email } = await req.json();

  const selected = pricing.plans.find((p) => p.id === plan);
  if (!selected) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
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
          checkout_data: {
            email,
            custom: { userId, plan },
          },
        },
      },
    }),
  }).then((r) => r.json());

  return NextResponse.json({ url: checkout.data.attributes.url });
}
