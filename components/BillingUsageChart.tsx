"use client";

import { useEffect, useState } from "react";
import pricing from "@/marketing/pricing.json";

// Simple bar chart style using pure divs (Edge-safe)
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
      <div className="text-center text-gray-300 py-10">
        Loading usage...
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="text-center text-gray-300 py-10">
        No usage data found.
      </div>
    );
  }

  const plan = pricing.plans.find((p) => p.id === usage.planId);
  const limits = plan?.limits ?? {};

  const categories = [
    {
      key: "build_minutes",
      label: "Build Minutes",
      used: usage.total_build_minutes,
      limit: limits.build_minutes,
    },
    {
      key: "pipelines_run",
      label: "Pipelines",
      used: usage.total_pipelines,
      limit: limits.pipelines,
    },
    {
      key: "provider_api_calls",
      label: "API Calls",
      used: usage.total_api_calls,
      limit: limits.api_calls,
    },
  ];

  return (
    <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
      <h2 className="text-xl font-semibold mb-6">Current Cycle Usage</h2>

      <div className="space-y-8">
        {categories.map((cat) => {
          const over = cat.limit !== "custom" && cat.used > cat.limit;
          const pct =
            cat.limit === "custom"
              ? 100
              : Math.min(100, (cat.used / cat.limit) * 100);

          return (
            <div key={cat.key}>
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">{cat.label}</span>
                <span className={over ? "text-red-400" : "text-gray-300"}>
                  {cat.used.toLocaleString()}{" "}
                  {cat.limit !== "custom" && (
                    <>
                      / {cat.limit.toLocaleString()}{" "}
                      {over && <span className="ml-2">⚠ Over</span>}
                    </>
                  )}
                </span>
              </div>

              <div className="w-full bg-neutral-800 rounded h-3 overflow-hidden">
                <div
                  className={`h-3 ${
                    over ? "bg-red-600" : "bg-blue-600"
                  } transition-all`}
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
