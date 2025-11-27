// components/BillingUsageChart.tsx

"use client";

import { useEffect, useState } from "react";

export default function BillingUsageChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchUsage() {
      const res = await fetch("/api/billing/usage/view");
      const json = await res.json();
      setData(json.usage || []);
    }
    fetchUsage();
  }, []);

  if (!data.length)
    return (
      <p className="text-gray-500 text-sm">No usage logged this cycle.</p>
    );

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-white">
      <h3 className="text-xl font-semibold mb-4">Usage This Billing Cycle</h3>

      <div className="space-y-3">
        {data.map((u, i) => (
          <div key={i} className="border-b border-neutral-800 pb-3">
            <p className="text-sm text-gray-400">Date: {u.date}</p>
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
