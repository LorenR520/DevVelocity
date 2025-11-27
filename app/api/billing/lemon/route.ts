// app/api/billing/lemon/route.ts

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const body = await req.text();
  const signature = req.headers.get("x-signature")!;

  const crypto = await import("crypto");
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  console.log("🍋 Lemon webhook received:", event.meta.event_name);

  // TODO: Write metadata to Supabase

  return NextResponse.json({ received: true });
}
