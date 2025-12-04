"use client";

import { useEffect, useState } from "react";
import BillingUsageChart from "@/components/BillingUsageChart";

export default function UsagePage() {
  const [usage, setUsage] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/billing/usage", { cache: "no-store" });
        const json = await res.json();

        setUsage(json.usage);
        setPlan(json.plan);
      } catch (e) {
        console.error("Failed to load usage:", e);
      }
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-20">
        Loading usage...
      </div>
    );
  }

  if (!usage || !plan) {
    return (
      <div className="text-center text-gray-400 py-20">
        No usage data available.
      </div>
    );
  }

  const limits = plan.limits || {};
  const meters = plan.metered || {};

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-8">Usage</h1>

      {/* Usage Timeline Chart */}
      <BillingUsageChart usage={usage.timeline} />

      {/* Current Cycle Summary */}
      <section className="mt-10 bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        <h2 className="text-xl font-semibold mb-4">
          Current Cycle Summary
        </h2>

        <div className="grid md:grid-cols-3 gap-6 text-gray-300">
          <div>
            <p className="text-sm">Build Minutes</p>
            <p className="text-2xl font-bold text-blue-400">
              {usage.total.build_minutes}
            </p>
            <p className="text-sm text-gray-500">
              Limit: {limits.build_minutes}
            </p>
          </div>

          <div>
            <p className="text-sm">Pipelines Run</p>
            <p className="text-2xl font-bold text-blue-400">
              {usage.total.pipelines}
            </p>
            <p className="text-sm text-gray-500">
              Limit: {limits.pipelines}
            </p>
          </div>

          <div>
            <p className="text-sm">API Calls</p>
            <p className="text-2xl font-bold text-blue-400">
              {usage.total.api_calls.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              Limit: {limits.api_calls.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* Metered Pricing */}
      <section className="mt-10 bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        <h2 className="text-xl font-semibold mb-3">Overage Pricing</h2>

        <ul className="text-gray-300 text-sm space-y-1">
          <li>
            • <strong>${meters.build_minute_price}</strong> per build minute
            over {limits.build_minutes}
          </li>

          <li>
            • <strong>${meters.pipeline_price}</strong> per pipeline
            executed over {limits.pipelines}
          </li>

          <li>
            • <strong>${meters.api_call_price}</strong> per API call
            over {limits.api_calls.toLocaleString()}
          </li>
        </ul>
      </section>

      {/* Next Reset */}
      <section className="mt-10 text-gray-400 text-sm text-center">
        Billing cycle resets on{" "}
        <span className="text-blue-400 font-semibold">
          {new Date(usage.reset_date).toLocaleDateString()}
        </span>
      </section>
    </main>
  );
}
