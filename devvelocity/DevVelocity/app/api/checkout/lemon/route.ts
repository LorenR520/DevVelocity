import { NextResponse } from "next/server";
import { getLemonCheckoutUrl } from "@/lib/billing";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const plan = searchParams.get("plan");

  if (!plan) {
    return NextResponse.json({ error: "Missing plan" }, { status: 400 });
  }

  const url = getLemonCheckoutUrl(plan);

  if (!url) {
    return NextResponse.json({ error: "Plan unavailable" }, { status: 400 });
  }

  return NextResponse.redirect(url);
}
