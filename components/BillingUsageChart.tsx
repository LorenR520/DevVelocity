"use client";

import { useEffect, useState } from "react";
import pricing from "@/marketing/pricing.json";

export default function BillingUsageChart() {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/billing/usage");
      const data = await res.json();
      setUsage(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="text-gray-300 text-center py-10">Loading usage…</div>
    );
  }

  const { plan_id, totals, cycle_start } = usage;

  const plan = pricing.plans.find((p) => p.id === plan_id);

  const limits = plan?.limits || {
    build_minutes: 0,
    pipelines: 0,
    api_calls: 0,
  };

  function ProgressBar({
    label,
    value,
    max,
  }: {
    label: string;
    value: number;
    max: number | string;
  }) {
    const isCustom = max === "custom";
    const percent = isCustom ? 0 : Math.min(100, (value / max) * 100);

    return (
      <div className="mb-6">
        <div className="flex justify-between mb-1 text-sm">
          <span className="text-gray-300">{label}</span>
          <span className="text-gray-400">
            {isCustom ? (
              "Custom"
            ) : (
              <>
                {value} / {max}
              </>
            )}
          </span>
        </div>

        {!isCustom && (
          <div className="w-full h-3 bg-neutral-800 rounded-md overflow-hidden">
            <div
              className={`h-3 ${
                percent > 90
                  ? "bg-red-500"
                  : percent > 70
                  ? "bg-yellow-500"
                  : "bg-blue-600"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
      <h2 className="text-2xl font-semibold mb-6">Usage Overview</h2>

      <p className="text-gray-400 text-sm mb-6">
        Cycle start: {new Date(cycle_start).toLocaleDateString()}
      </p>

      <ProgressBar
        label="Build Minutes"
        value={totals.build_minutes}
        max={limits.build_minutes}
      />

      <ProgressBar
        label="Pipelines Executed"
        value={totals.pipelines}
        max={limits.pipelines}
      />

      <ProgressBar
        label="API Calls"
        value={totals.api_calls}
        max={limits.api_calls}
      />
    </div>
  );
}
