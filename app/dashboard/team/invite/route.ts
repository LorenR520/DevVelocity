import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import pricing from "@/marketing/pricing.json";
import { sendSeatInviteEmail } from "@/emails/send-seat-invite";

export async function POST(req: Request) {
  const form = await req.formData();
  const email = form.get("email") as string;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .single();

  const planMeta = pricing.plans.find((p) => p.id === org.plan_id);
  const included = planMeta.seats_included;

  const { count: usedSeats } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id);

  // Over limit? Mark for billing
  const overage = usedSeats! >= included;

  await supabase.from("organization_members").insert({
    email,
    org_id: org.id,
    role: "member",
  });

  if (overage) {
    await supabase.from("billing_events").insert({
      org_id: org.id,
      type: "extra_seat",
      amount: planMeta.seat_price,
      member_email: email,
    });
  }

  await sendSeatInviteEmail(email, org.name);

  return NextResponse.redirect("/dashboard/team");
}
