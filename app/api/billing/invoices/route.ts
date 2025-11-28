import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    // -----------------------------
    // 1. INIT CLIENTS
    // -----------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // -----------------------------
    // 2. AUTHENTICATE USER
    // -----------------------------
    const token =
      req.headers.get("Authorization")?.replace("Bearer ", "") ?? null;

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // -----------------------------
    // 3. GET ORGANIZATION
    // -----------------------------
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", user.app_metadata.org_id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const orgId = org.id;

    // -----------------------------
    // 4. FETCH STRIPE INVOICES
    // -----------------------------
    let stripeInvoices: any[] = [];

    if (org.stripe_customer_id) {
      const inv = await stripe.invoices.list({
        customer: org.stripe_customer_id,
        limit: 30,
      });

      stripeInvoices = inv.data.map((i) => ({
        id: i.id,
        amount: (i.amount_paid ?? i.amount_due) / 100,
        currency: i.currency.toUpperCase(),
        date: new Date(i.created * 1000).toISOString(),
        provider: "stripe",
        pdf: i.invoice_pdf ?? null,
      }));
    }

    // -----------------------------
    // 5. FETCH LEMON SQUEEZY INVOICES
    // -----------------------------
    let lemonInvoices: any[] = [];

    if (org.lemonsqueezy_customer_id) {
      const res = await fetch(
        `https://api.lemonsqueezy.com/v1/invoices?filter[customer_id]=${org.lemonsqueezy_customer_id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
            Accept: "application/vnd.api+json",
          },
        }
      );

      const json = await res.json();

      lemonInvoices =
        json.data?.map((inv: any) => ({
          id: inv.id,
          amount: inv.attributes.total / 100,
          currency: inv.attributes.currency.toUpperCase(),
          date: inv.attributes.created_at,
          provider: "lemonsqueezy",
          pdf: inv.attributes.urls?.invoice_url ?? null,
        })) ?? [];
    }

    // -----------------------------
    // 6. FETCH INTERNAL BILLING EVENTS (seats + usage)
    // -----------------------------
    const { data: internalBill } = await supabase
      .from("billing_events")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    const internalInvoices =
      internalBill?.map((ev) => ({
        id: `internal-${ev.id}`,
        amount: ev.amount,
        currency: "USD",
        date: ev.created_at,
        provider: ev.type === "extra_seat" ? "Seats" : "Usage",
        pdf: null,
      })) ?? [];

    // -----------------------------
    // 7. UNIFIED RESPONSE
    // -----------------------------
    const invoices = [
      ...stripeInvoices,
      ...lemonInvoices,
      ...internalInvoices,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ invoices });
  } catch (err) {
    console.error("INVOICE API ERROR:", err);
    return NextResponse.json(
      { error: "Internal error", detail: String(err) },
      { status: 500 }
    );
  }
}
