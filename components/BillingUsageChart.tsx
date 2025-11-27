// components/BillingUsageChart.tsx

"use client";

import { useEffect, useState } from "react";

export default function BillingUsageChart() {
  const [usage, setUsage] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/billing/usage/view");
      const json = await res.json();
      setUsage(json.usage || []);
    }
    load();
  }, []);

  if (!usage.length) {
    return (
      <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 text-gray-400">
        No usage recorded this cycle.
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 text-white">
      <h2 className="text-xl font-semibold mb-4">Usage This Billing Cycle</h2>

      <div className="space-y-4">
        {usage.map((u, idx) => (
          <div
            key={idx}
            className="border-b border-neutral-800 pb-3 last:border-0"
          >
            <p className="text-sm text-gray-400">{u.date}</p>
            <p className="text-sm">Build Minutes: {u.build_minutes}</p>
            <p className="text-sm">Pipelines Run: {u.pipelines_run}</p>
            <p className="text-sm">
              Provider API Calls: {u.provider_api_calls}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
