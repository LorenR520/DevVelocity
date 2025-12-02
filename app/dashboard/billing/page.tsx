"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BillingDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------
  // Load consolidated billing summary
  // --------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/billing/summary", {
          method: "POST",
        });

        const json = await res.json();
        if (json.error) setError(json.error);
        else setSummary(json);
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-16 text-white">
        <p className="text-gray-300">Loading billing dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-16 text-red-400">
        Error: {error}
      </main>
    );
  }

  const { plan, usage, invoices, costs, seats } = summary;

  // --------------------------------------------------
  // Render Page
  // --------------------------------------------------
  return (
    <main className="max-w-5xl mx-auto px-6 py-16 text-white space-y-12">

      {/* ============================ */}
      {/* 🔹 PLAN SUMMARY */}
      {/* ============================ */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-3">Subscription</h2>

        <p className="text-lg">
          Current Plan:{" "}
          <span className="font-semibold capitalize text-blue-400">
            {plan.id}
          </span>
        </p>

        <p className="text-gray-400 mt-2 mb-4">
          {plan.description}
        </p>

        <button
          onClick={() => router.push(`/upgrade?from=billing`)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm mt-3"
        >
          Upgrade Plan
        </button>
      </section>

      {/* ============================ */}
      {/* 🔹 USAGE METRICS */}
      {/* ============================ */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Usage This Cycle</h2>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Build Minutes */}
          <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
            <p className="text-sm text-gray-400">Build Minutes</p>
            <p className="text-3xl font-bold mt-1">{usage.build_minutes}</p>
            <p className="text-gray-400 text-xs mt-1">
              Limit: {plan.limits.build_minutes}
            </p>
          </div>

          {/* Pipelines */}
          <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
            <p className="text-sm text-gray-400">Pipelines Run</p>
            <p className="text-3xl font-bold mt-1">{usage.pipelines}</p>
            <p className="text-gray-400 text-xs mt-1">
              Limit: {plan.limits.pipelines}
            </p>
          </div>

          {/* API Calls */}
          <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
            <p className="text-sm text-gray-400">Provider API Calls</p>
            <p className="text-3xl font-bold mt-1">{usage.api_calls}</p>
            <p className="text-gray-400 text-xs mt-1">
              Limit: {plan.limits.api_calls}
            </p>
          </div>
        </div>
      </section>

      {/* ============================ */}
      {/* 🔹 COST BREAKDOWN */}
      {/* ============================ */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Costs This Cycle</h2>

        <ul className="text-gray-300 text-sm space-y-1">
          <li>Base Subscription: ${costs.base}</li>
          <li>Usage Overage: ${costs.usage}</li>
          <li>Seat Charges: ${seats.overage_cost}</li>
          <li className="text-lg font-semibold mt-3 text-white">
            Total: ${costs.total}
          </li>
        </ul>
      </section>

      {/* ============================ */}
      {/* 🔹 INVOICES */}
      {/* ============================ */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Invoices</h2>

        {invoices.length === 0 && (
          <p className="text-gray-500">No invoices yet.</p>
        )}

        <div className="space-y-4">
          {invoices.map((inv: any) => (
            <div
              key={inv.id}
              className="p-4 rounded-lg bg-neutral-800 border border-neutral-700"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">
                    {inv.provider.toUpperCase()}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {new Date(inv.date).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold">${inv.amount}</p>

                  {inv.pdf && (
                    <a
                      href={inv.pdf}
                      target="_blank"
                      className="text-blue-400 underline text-sm"
                    >
                      Download PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
