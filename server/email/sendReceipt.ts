// server/email/sendReceipt.ts

import { Resend } from "resend";
import ReceiptEmail from "@/emails/receipt";

interface SendReceiptArgs {
  to: string;
  plan: string;
  seats: number | string;
  amount: number;
}

export async function sendReceipt({ to, plan, seats, amount }: SendReceiptArgs) {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ Missing RESEND_API_KEY");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      to,
      from: "billing@devvelocity.app",
      subject: "Your DevVelocity Receipt",
      react: ReceiptEmail({ amount, plan, seats }),
    });

    console.log(`📨 Sent receipt email to ${to} for ${plan}`);
  } catch (error) {
    console.error("❌ Failed to send receipt email:", error);
  }
}
