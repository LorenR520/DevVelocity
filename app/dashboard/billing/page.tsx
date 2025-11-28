"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BillingHome() {
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/billing/summary");
      const data = await res.json();
      setBilling(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-gray-300 py-20">
        Loading billing…
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="text-center text-red-400 py-20">
        Failed to load billing.
      </div>
    );
  }

  const {
    current_plan,
    seats,
    pending_overage_amount,
    next_invoice_date,
    provider,
  } = billing;

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-10">Billing</h1>

      {/* ============================== */}
      {/* PLAN SECTION */}
      {/* ============================== */}
      <section className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 mb-10">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold">{current_plan.name}</h2>
            <p className="text-gray-400 text-sm mt-1">
              Billing Provider: {provider === "stripe" ? "Stripe" : provider === "lemon" ? "Lemon Squeezy" : "Internal"}
            </p>
            <p className="text-xl font-bold mt-3">
              {current_plan.price === "custom" ? "Custom Pricing" : `$${current_plan.price}/mo`}
            </p>
          </div>

          {current_plan.id !== "enterprise" && (
            <Link
              href="/dashboard/billing/upgrade"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Change Plan
            </Link>
          )}
        </div>

        <div className="mt-4 text-gray-300">
          <p>Seats: {seats.total}</p>

          {seats.overage > 0 && (
            <p className="text-red-400">
              Additional seats: {seats.overage} (billed monthly)
            </p>
          )}
        </div>

        <p className="text-gray-400 text-sm mt-3">
          Next invoice: {new Date(next_invoice_date).toLocaleDateString()}
        </p>
      </section>

      {/* ============================== */}
      {/* USAGE + METERED */}
      {/* ============================== */}
      <section className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 mb-10">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold">Usage & Metered</h2>

          <Link
            href="/dashboard/billing/usage"
            className="text-blue-400 underline text-sm"
          >
            View Details
          </Link>
        </div>

        <div className="mt-4 text-gray-300">
          <p>Pending Overage Charges: ${pending_overage_amount.toFixed(2)}</p>
        </div>
      </section>

      {/* ============================== */}
      {/* INVOICES */}
      {/* ============================== */}
      <section className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold">Invoices</h2>
          <Link
            href="/dashboard/billing/invoices"
            className="text-blue-400 underline text-sm"
          >
            View All
          </Link>
        </div>

        <ul className="mt-4 text-gray-300 space-y-2 text-sm">
          {billing.recent_invoices.length === 0 && (
            <li>No recent invoices.</li>
          )}

          {billing.recent_invoices.map((inv: any) => (
            <li key={inv.id} className="flex justify-between">
              <span>
                {inv.provider === "stripe"
                  ? "Stripe"
                  : inv.provider === "lemon"
                  ? "Lemon Squeezy"
                  : "Internal"}{" "}
                — {new Date(inv.date).toLocaleDateString()}
              </span>
              <span>${inv.amount}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
