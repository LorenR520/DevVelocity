import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import pricing from "@/marketing/pricing.json";
import { sendSeatInviteEmail } from "@/server/email/send-seat-invite";
import { calculateSeatOverages } from "@/server/billing/calc-seats";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const email = form.get("email") as string;

    if (!email) {
      return NextResponse.json(
        { error: "Missing email" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // 1. Load the org for the current authenticated admin
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // 2. Count current members
    const { count: usedSeats } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id);

    // 3. Load plan metadata
    const planMeta = pricing.plans.find((p) => p.id === org.plan_id);
    if (!planMeta) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // 4. Calculate if the new seat exceeds plan allowance
    const usage = calculateSeatOverages(org.plan_id, usedSeats! + 1);

    // 5. Prevent duplicate invites
    const { data: existing } = await supabase
      .from("organization_members")
      .select("*")
      .eq("org_id", org.id)
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "User already a member" },
        { status: 409 }
      );
    }

    // 6. Create the member entry
    await supabase.from("organization_members").insert({
      email,
      org_id: org.id,
      role: "member",
    });

    // 7. Log overage billing event
    if (usage.extraSeats > 0) {
      await supabase.from("billing_events").insert({
        org_id: org.id,
        type: "extra_seat",
        amount: usage.extraCost,
        member_email: email,
      });
    }

    // 8. Send seat invite email
    await sendSeatInviteEmail(email, org.name);

    return NextResponse.redirect("/dashboard/team");

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Failed to invite user" },
      { status: 500 }
    );
  }
}
