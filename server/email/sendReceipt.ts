// server/email/sendReceipt.ts

import { Resend } from "resend";
import ReceiptEmail from "@/emails/receipt";

export async function sendReceipt({
  to,
  plan,
  seats,
  amount,
}: {
  to: string;
  plan: string;
  seats: number | string;
  amount: number;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    to,
    from: "billing@devvelocity.app",
    subject: "Your DevVelocity Receipt",
    react: ReceiptEmail({ amount, plan, seats }),
  });
}
