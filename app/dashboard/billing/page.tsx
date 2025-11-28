"use client";

import { useEffect, useState } from "react";
import pricing from "@/marketing/pricing.json";

export default function BillingDashboard() {
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/user/org");
      const data = await res.json();
      setOrg(data.org || null);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-20 text-white text-center">
        Loading billing dashboard...
      </main>
    );
  }

  if (!org) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 text-white text-center">
        <h1 className="text-2xl font-bold mb-4">No Organization Found</h1>
        <p className="text-gray-400">
          Create an organization to access billing.
        </p>
      </main>
    );
  }

  const plan = pricing.plans.find((p) => p.id === org.plan_id);

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-8">Billing</h1>

      {/* CURRENT PLAN */}
      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 mb-8">
        <h2 className="text-xl font-semibold mb-2">Current Plan</h2>
        <p className="text-gray-300 mb-2">
          {plan ? plan.name : "Unknown Plan"}
        </p>

        <p className="text-4xl font-bold text-blue-400 mb-4">
          {plan?.display_price ?? "$—"}
        </p>

        <a
          href="/dashboard/billing/upgrade"
          className="inline-block mt-2 px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Change Plan
        </a>
      </section>

      {/* OVERAGE SECTION */}
      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 mb-8">
        <h2 className="text-xl font-semibold mb-2">Usage Overage</h2>

        <p className="text-gray-300 mb-4">
          Excess usage beyond your included quotas is billed automatically.
        </p>

        <p className="text-3xl font-bold text-yellow-400">
          ${org.pending_overage_amount?.toFixed(2) ?? "0.00"}
        </p>

        <a
          href="/dashboard/billing/usage"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700"
        >
          View Usage
        </a>
      </section>

      {/* SEAT BILLING */}
      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 mb-8">
        <h2 className="text-xl font-semibold mb-2">Team / Seats</h2>

        <p className="text-gray-300">
          {org.seat_count ?? 0} seats used • {plan?.seats_included} included
        </p>

        <a
          href="/dashboard/team"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Manage Team
        </a>
      </section>

      {/* INVOICES */}
      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        <h2 className="text-xl font-semibold mb-2">Invoices</h2>
        <p className="text-gray-300 mb-4">
          Download and view monthly invoices, overage adjustments, and receipts.
        </p>

        <a
          href="/dashboard/billing/invoices"
          className="inline-block px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700"
        >
          View Invoices
        </a>
      </section>
    </main>
  );
}
