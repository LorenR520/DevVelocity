import { resolveCheckoutProvider } from "@/lib/billing";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { plan, userId } = await req.json();
  const provider = resolveCheckoutProvider(plan);

  if (provider.provider === "lemon") {
    return NextResponse.json({
      url: `/api/checkout/lemon?plan=${plan}`,
    });
  }

  if (provider.provider === "stripe") {
    return NextResponse.json({
      url: `/api/checkout/stripe`,
      plan,
      userId,
    });
  }

  return NextResponse.json(
    { error: "Plan unavailable" },
    { status: 400 }
  );
}
