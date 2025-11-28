import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const provider = req.headers.get("x-provider");

    if (!invoiceId || !provider) {
      return NextResponse.json(
        { error: "Missing invoice ID or provider header" },
        { status: 400 }
      );
    }

    // --------------------------
    // ⭐ STRIPE INVOICE
    // --------------------------
    if (provider === "stripe") {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-10-16",
      });

      const inv = await stripe.invoices.retrieve(invoiceId);

      return NextResponse.json({
        provider: "stripe",
        id: inv.id,
        status: inv.status,
        customer_email: inv.customer_email,
        subtotal: inv.subtotal / 100,
        total: inv.total / 100,
        currency: inv.currency.toUpperCase(),
        pdf: inv.invoice_pdf,
        items: inv.lines.data.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          amount: item.amount / 100,
        })),
      });
    }

    // --------------------------
    // ⭐ LEMON SQUEEZY INVOICE
    // --------------------------
    if (provider === "lemon") {
      const res = await fetch(
        `https://api.lemonsqueezy.com/v1/invoices/${invoiceId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
            Accept: "application/vnd.api+json",
          },
        }
      );

      const json = await res.json();
      const inv = json.data?.attributes;

      if (!inv) {
        return NextResponse.json(
          { error: "Lemon invoice not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        provider: "lemon",
        id: invoiceId,
        status: inv.status,
        customer_email: inv.customer_email,
        subtotal: inv.subtotal / 100,
        total: inv.total / 100,
        currency: inv.currency.toUpperCase(),
        pdf: inv.urls?.invoice_url,
      });
    }

    // --------------------------
    // ⭐ INTERNAL (USAGE + SEATS)
    // --------------------------
    if (provider === "internal") {
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabase
        .from("billing_events")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Internal invoice not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        provider: "internal",
        id: data.id,
        status: "processed",
        total: data.amount,
        currency: "USD",
        details: data.details,
        created_at: data.created_at,
      });
    }

    return NextResponse.json(
      { error: "Unknown provider" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Invoice detail error:", err);
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: 500 }
    );
  }
}
