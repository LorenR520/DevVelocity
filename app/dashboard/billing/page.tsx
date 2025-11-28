"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UpgradeButtons from "@/components/UpgradeButtons";

export default function BillingDashboard() {
  const [org, setOrg] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/billing/summary", { cache: "no-store" });
        const json = await res.json();

        setOrg(json.org);
        setPlan(json.plan);
        setUsage(json.usage);
      } catch (e) {
        console.error("Billing summary failed:", e);
      }

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-20">
        Loading billing data...
      </div>
    );
  }

  if (!org || !plan) {
    return (
      <div className="text-center text-gray-400 py-20">
        Billing data unavailable.
      </div>
    );
  }

  const nextReset = usage?.reset_date
    ? new Date(usage.reset_date).toLocaleDateString()
    : "N/A";

  const pendingOverage = org.pending_overage_amount ?? 0;
  const seatCount = org.member_count ?? 1;
  const includedSeats = plan.seats_included;

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-10">Billing</h1>

      {/* CURRENT PLAN */}
      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 mb-8">
        <h2 className="text-xl font-semibold mb-2">Current Plan</h2>

        <p className="text-3xl font-bold mb-2">{plan.name}</p>

        <p className="text-gray-300 text-sm mb-4">
          Billed monthly • Auto-sync via Stripe/Lemon
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-5 text-gray-300">
          <div>
            <p className="text-sm">Plan Price</p>
            <p className="text-2xl font-bold text-blue-400">
              {plan.display_price}
            </p>
          </div>

          <div>
            <p className="text-sm">Next Billing Cycle</p>
            <p className="text-xl font-semibold text-blue-400">{nextReset}</p>
          </div>
        </div>
      </section>

      {/* SEAT USAGE */}
      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 mb-8">
        <h2 className="text-xl font-semibold mb-3">Seats</h2>

        <div className="flex justify-between text-gray-300">
          <p>
            {seatCount} seats used / {includedSeats === "custom" ? "∞" : includedSeats} included
          </p>

          {includedSeats !== "custom" && seatCount > includedSeats && (
            <p className="text-red-400 font-semibold">Overage Billing Applied</p>
          )}
        </div>

        <Link
          href="/dashboard/team"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
        >
          Manage Team Seats
        </Link>
      </section>

      {/* PENDING OVERAGES */}
      {pendingOverage > 0 && (
        <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 mb-8">
          <h2 className="text-xl font-semibold mb-2 text-red-400">
            Pending Usage Overage
          </h2>

          <p className="text-3xl font-bold text-red-300 mb-3">
            ${pendingOverage.toFixed(2)}
          </p>

          <p className="text-gray-400 text-sm">
            This amount will be added to your next invoice.
          </p>

          <Link
            href="/dashboard/billing/usage"
            className="inline-block mt-4 text-blue-400 underline text-sm"
          >
            View Usage Details →
          </Link>
        </section>
      )}

      {/* UPGRADE SECTION */}
      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        <h2 className="text-xl font-semibold mb-4">Upgrade or Change Plan</h2>
        <UpgradeButtons currentPlan={plan.id} />
      </section>

      {/* LINKS */}
      <div className="mt-10 flex gap-6 text-sm text-blue-400">
        <Link href="/dashboard/billing/invoices" className="underline">
          View Invoices
        </Link>

        <Link href="/dashboard/billing/usage" className="underline">
          View Usage
        </Link>
      </div>
    </main>
  );
}
