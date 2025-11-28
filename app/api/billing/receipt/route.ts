// app/api/billing/receipt/route.ts

import { NextResponse } from "next/server";
import { sendReceipt } from "@/server/email/send-receipt";

export async function POST(req: Request) {
  try {
    const { email, plan, seats, amount } = await req.json();

    if (!email || !plan || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await sendReceipt({
      to: email,
      plan,
      seats: seats ?? 1,
      amount,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Receipt API error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error sending receipt" },
      { status: 500 }
    );
  }
}
