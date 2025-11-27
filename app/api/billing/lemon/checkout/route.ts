import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { plan, seats } = await req.json();

  return NextResponse.json({
    url: `https://checkout.lemonsqueezy.com/buy/${process.env[`LEMON_${plan.toUpperCase()}_VARIANT`]}`, 
    seats 
  });
}
