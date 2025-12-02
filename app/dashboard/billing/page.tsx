"use client";

import { useEffect, useState } from "react";
import UsageChart from "@/components/UsageChart";

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [plan, setPlan] = useState<string>("developer");
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------
  // Load Usage Data from API
  // ---------------------------------------------
  async function load() {
    try {
      setLoading(true);

      const res = await fetch("/api/usage/get", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setUsage(json.usage ?? []);
        setTotals(json.totals ?? {});
        setPlan(json.plan ?? "developer");
      }
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // ---------------------------------------------
  // Render
  // ---------------------------------------------
  if (loading) {
    return (
      <main className="p-10 text-white">
        <div className="animate-pulse text-gray-400">Loading billing data…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-10 text-red-400">
        Error loading usage data: {error}
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-10 text-white">
      <h1 className="text-3xl font-bold mb-8">Billing & Usage</h1>

      {/* ---------------------------------------------
         CURRENT PLAN
      ---------------------------------------------- */}
      <div className="mb-10 p-5 border border-neutral-800 bg-neutral-900 rounded-xl">
        <p className="text-gray-400 text-sm">Current Plan:</p>
        <p className="text-xl font-bold capitalize mt-1">{plan}</p>
      </div>

      {/* ---------------------------------------------
         MONTHLY TOTALS SUMMARY
      ---------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
          <p className="text-gray-400 text-sm">Pipelines Run</p>
          <p className="text-3xl font-bold">{totals?.pipeline_total ?? 0}</p>
        </div>

        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
          <p className="text-gray-400 text-sm">Provider API Calls</p>
          <p className="text-3xl font-bold">{totals?.api_total ?? 0}</p>
        </div>

        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
          <p className="text-gray-400 text-sm">Build Minutes</p>
          <p className="text-3xl font-bold">{totals?.minutes_total ?? 0}</p>
        </div>
      </div>

      {/* ---------------------------------------------
         USAGE CHARTS
      ---------------------------------------------- */}
      <h2 className="text-2xl font-bold mb-4">Usage Trends</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
        <UsageChart data={usage} field="pipelines_run" label="Pipelines Run" />
        <UsageChart data={usage} field="provider_api_calls" label="API Calls" />
        <UsageChart data={usage} field="build_minutes" label="Build Minutes" />
      </div>

      {/* ---------------------------------------------
         RAW DAILY LOGS TABLE
      ---------------------------------------------- */}
      <h2 className="text-2xl font-bold mb-4">Daily Usage Logs</h2>

      <div className="overflow-x-auto border border-neutral-800 rounded-xl">
        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="bg-neutral-800 border-b border-neutral-700">
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Pipelines</th>
              <th className="p-3 text-left">API Calls</th>
              <th className="p-3 text-left">Build Minutes</th>
            </tr>
          </thead>

          <tbody>
            {usage.map((u, i) => (
              <tr
                key={i}
                className="border-b border-neutral-800 hover:bg-neutral-800/50"
              >
                <td className="p-3">{u.date?.slice(0, 10)}</td>
                <td className="p-3">{u.pipelines_run}</td>
                <td className="p-3">{u.provider_api_calls}</td>
                <td className="p-3">{u.build_minutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------------------------------------------
         RECOMMENDATIONS
      ---------------------------------------------- */}
      <div className="mt-16 p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
        <h2 className="text-xl font-bold mb-3">AI Suggestions</h2>

        {totals?.pipeline_total > 50 && (
          <p className="text-gray-300 mb-2">
            ⚡ You are running a high volume of pipelines—Team or Enterprise
            plan may reduce build costs.
          </p>
        )}

        {totals?.api_total > 1000 && (
          <p className="text-gray-300 mb-2">
            📡 High API activity detected—consider enabling advanced caching.
          </p>
        )}

        {totals?.minutes_total > 200 && (
          <p className="text-gray-300 mb-2">
            🏗️ Your build times are trending upward—allocate more CPU or move
            to multi-cloud.
          </p>
        )}

        {(totals?.pipeline_total ?? 0) < 5 &&
          (totals?.api_total ?? 0) < 20 &&
          (totals?.minutes_total ?? 0) < 20 && (
            <p className="text-gray-400">No major optimizations recommended.</p>
          )}
      </div>
    </main>
  );
}
