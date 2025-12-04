// app/api/billing/webhook/route.ts

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const body = await req.text();

  const signature = req.headers.get("x-signature");

  // Verify signature
  const crypto = await import("crypto");
  const expected = crypto
    .createHmac("sha256", secret!)
    .update(body)
    .digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const event = payload.meta.event_name;

  const userId = payload.data.attributes.user_id;
  const plan = payload.data.attributes.variant_id;

  console.log("Billing event:", event, "Plan:", plan, "User:", userId);

  // TODO: Update Supabase user metadata
  // await supabase.admin.updateUserById(userId, { plan });

  return NextResponse.json({ received: true });
}
