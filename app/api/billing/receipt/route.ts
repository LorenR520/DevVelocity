import { NextResponse } from "next/server";
import { sendReceipt } from "@/server/email/send-receipt";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { to, plan, seats, amount } = await req.json();

    if (!to || !plan || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await sendReceipt({
      to,
      plan,
      seats: seats ?? 1,
      amount,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Receipt send error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
