// app/dashboard/billing/page.tsx

"use client";

import { useEffect, useState } from "react";
import UpgradeButtons from "@/components/UpgradeButtons";

export default function BillingDashboard() {
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
        Loading billing dashboard...
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-white space-y-10">
      {/* HEADER */}
      <h1 className="text-3xl font-bold">Billing</h1>

      {/* CURRENT PLAN */}
      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        <h2 className="text-xl font-semibold mb-2">Current Plan</h2>

        <p className="text-gray-300 text-lg font-medium">
          {billing.plan?.name} —{" "}
          <span className="text-blue-400">
            {billing.plan?.display_price}
          </span>
        </p>

        <p className="text-gray-400 text-sm mt-2">
          Billing Provider: {billing.billing_provider || "unknown"}
        </p>
      </section>

      {/* SEAT INFO */}
      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        <h2 className="text-xl font-semibold mb-3">Seats</h2>

        <p className="text-gray-300">
          Seats used: {billing.seats_used} / {billing.seats_included}
        </p>

        {billing.seat_overage_pending > 0 && (
          <p className="text-red-400 mt-2">
            Pending overage charges: ${billing.seat_overage_pending.toFixed(2)}
          </p>
        )}

        <a
          href="/dashboard/team"
          className="text-blue-400 underline text-sm mt-3 block"
        >
          Manage Team
        </a>
      </section>

      {/* USAGE */}
      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        <h2 className="text-xl font-semibold mb-3">Usage</h2>

        <p className="text-gray-300">
          View build minutes, pipelines, and API call usage.
        </p>

        {billing.usage_overage_pending > 0 && (
          <p className="text-red-400 mt-2">
            Pending usage overages: $
            {billing.usage_overage_pending.toFixed(2)}
          </p>
        )}

        <a
          href="/dashboard/billing/usage"
          className="text-blue-400 underline text-sm mt-3 block"
        >
          View Usage
        </a>
      </section>

      {/* INVOICES */}
      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        <h2 className="text-xl font-semibold mb-3">Invoices</h2>
        <a
          href="/dashboard/billing/invoices"
          className="text-blue-400 underline text-sm"
        >
          View all invoices
        </a>
      </section>

      {/* UPGRADE */}
      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        <h2 className="text-xl font-semibold mb-4">Upgrade Plan</h2>
        <UpgradeButtons />
      </section>
    </main>
  );
}
