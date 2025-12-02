"use client";

import { useEffect, useState } from "react";

interface UsageBreakdownProps {
  orgId: string;
  plan: string;
}

export default function UsageBreakdown({ orgId, plan }: UsageBreakdownProps) {
  const [usage, setUsage] = useState<any>(null);
  const [limits, setLimits] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------
  // Load usage + limits
  // ---------------------------------------------------
  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const [usageRes, limitsRes] = await Promise.all([
          fetch("/api/billing/usage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orgId }),
          }),
          fetch("/api/billing/limits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan }),
          }),
        ]);

        const usageJson = await usageRes.json();
        const limitsJson = await limitsRes.json();

        setUsage(usageJson.usage ?? null);
        setLimits(limitsJson.limits ?? null);
      } catch (err) {
        console.error("Usage breakdown load error:", err);
      }

      setLoading(false);
    }

    load();
  }, [orgId, plan]);

  if (loading || !usage || !limits) {
    return (
      <div className="mt-10 text-gray-400 animate-pulse">
        Loading usage breakdown…
      </div>
    );
  }

  // Helper for progress bars
  const calcPercent = (value: number, max: number) => {
    if (!max || max === 0) return 0;
    return Math.min(100, Math.round((value / max) * 100));
  };

  const categories = [
    {
      key: "pipelines_run",
      label: "Pipelines Executed",
      value: usage.pipelines_run ?? 0,
      limit: limits.pipelines,
    },
    {
      key: "provider_api_calls",
      label: "Provider API Calls",
      value: usage.provider_api_calls ?? 0,
      limit: limits.provider_api_calls,
    },
    {
      key: "build_minutes",
      label: "Build Minutes",
      value: usage.build_minutes ?? 0,
      limit: limits.build_minutes,
    },
    {
      key: "ai_builds",
      label: "AI Builds",
      value: usage.ai_builds ?? 0,
      limit: limits.ai_builds,
    },
    {
      key: "ai_upgrades",
      label: "AI Upgrades",
      value: usage.ai_upgrades ?? 0,
      limit: limits.ai_upgrades,
    },
  ];

  return (
    <div className="mt-10 p-8 bg-neutral-900 border border-neutral-800 rounded-xl">
      <h2 className="text-2xl font-bold mb-6">Detailed Usage Breakdown</h2>

      <div className="space-y-8">
        {categories.map((c) => {
          const percent = calcPercent(c.value, c.limit);

          return (
            <div key={c.key}>
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">{c.label}</span>
                <span className="text-gray-400 text-sm">
                  {c.value} / {c.limit === 0 ? "∞" : c.limit}
                </span>
              </div>

              <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full ${
                    percent >= 90
                      ? "bg-red-500"
                      : percent >= 75
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${percent}%` }}
                ></div>
              </div>

              {percent >= 90 && (
                <p className="text-red-400 text-sm mt-2">
                  ⚠️ You are very close to reaching your monthly limit.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
