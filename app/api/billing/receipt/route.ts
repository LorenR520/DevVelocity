import { NextResponse } from "next/server";
import { sendReceipt } from "@/server/email/send-receipt";

export async function POST(req: Request) {
  const { email, plan, seats, amount } = await req.json();

  await sendReceipt(email, plan, seats, amount);

  return NextResponse.json({ sent: true });
}
