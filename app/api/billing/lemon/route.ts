import { NextResponse } from "next/server";
import pricing from "@/marketing/pricing.json";
import { updateUserFromLemonEvent } from "@/server/billing/lemon-sync";
import { sendReceipt } from "@/server/email/send-receipt";

export async function POST(req: Request) {
  const body = await req.json();

  if (!body?.data?.attributes) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const event = body.data.attributes;
  const plan = event.custom_data?.plan;
  const email = event.customer_email;

  if (event.event_name === "order_created") {
    await updateUserFromLemonEvent(event);

    const planMeta = pricing.plans.find((p) => p.id === plan);
    await sendReceipt(email, planMeta?.name, planMeta?.seats_included, planMeta?.price);
  }

  return NextResponse.json({ received: true });
}
