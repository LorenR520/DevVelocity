"use client";

import { useEffect, useState } from "react";

export default function BillingSummaryCard({ orgId, plan }: { orgId: string; plan: string }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const res = await fetch("/api/billing/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orgId }),
        });

        const json = await res.json();
        if (json.error) {
          setError(json.error);
        } else {
          setSummary(json);
        }
      } catch (err: any) {
        setError(err.message);
      }

      setLoading(false);
    }

    load();
  }, [orgId]);

  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse text-gray-400">
        Loading billing summary…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-neutral-900 border border-red-800 text-red-400">
        Billing Summary Error: {error}
      </div>
    );
  }

  if (!summary) return null;

  const {
    plan: summaryPlan,
    plan_meta,
    cycle_start,
    totals,
    estimated_total,
    suggestion,
  } = summary;

  return (
    <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
      <h2 className="text-2xl font-bold mb-4">Billing Summary</h2>

      <div className="space-y-3 text-gray-300">
        <p>
          <span className="text-gray-400">Current Plan:</span>{" "}
          <span className="text-white font-semibold capitalize">{summaryPlan}</span>
        </p>

        <p>
          <span className="text-gray-400">Base Price:</span>{" "}
          <span className="text-white">${plan_meta.pricing.base.toFixed(2)}/mo</span>
        </p>

        <p>
          <span className="text-gray-400">Estimated Total:</span>{" "}
          <span className="text-blue-400 font-semibold">${estimated_total}</span>
        </p>

        <p>
          <span className="text-gray-400">Billing Cycle Start:</span>{" "}
          <span className="text-white">
            {new Date(cycle_start).toLocaleDateString()}
          </span>
        </p>

        <div className="mt-4 border-t border-neutral-800 pt-4">
          <p className="text-lg font-semibold mb-2">Usage</p>

          <ul className="space-y-1">
            <li>• Pipelines Run: {totals.pipelines}</li>
            <li>• Provider API Calls: {totals.api_calls}</li>
            <li>• Build Minutes: {totals.minutes}</li>
          </ul>
        </div>

        {suggestion && (
          <div className="mt-6 p-4 bg-yellow-900/40 border border-yellow-700 rounded-lg text-yellow-300 text-sm">
            ⚠️ {suggestion}
          </div>
        )}
      </div>
    </div>
  );
}
