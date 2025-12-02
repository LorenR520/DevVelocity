"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({});
  const [limits, setLimits] = useState<any>({});
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // Reads plan + org_id from cookies (injected by middleware)
  const orgId =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((c) => c.startsWith("org_id="))
          ?.split("=")[1]
      : null;

  const plan =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((c) => c.startsWith("user_plan="))
          ?.split("=")[1]
      : "developer";

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/usage/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orgId, plan }),
        });

        const json = await res.json();

        if (json.error) {
          setError(json.error);
        } else {
          setUsage(json.usage);
          setTotals(json.totals);
          setLimits(json.limits);
          setRecommendations(json.recommendations);
        }
      } catch (err: any) {
        setError(err.message ?? "Failed to load billing data.");
      }

      setLoading(false);
    }

    if (orgId) load();
  }, [orgId, plan]);

  if (loading) {
    return (
      <div className="text-gray-300 animate-pulse">Loading billing data…</div>
    );
  }

  if (plan === "developer") {
    return (
      <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
        <h2 className="text-2xl font-bold mb-4">Billing & Usage</h2>
        <p className="text-gray-400">
          Developer tier does not include usage analytics.
        </p>
        <button
          onClick={() => router.push("/upgrade?from=billing")}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        >
          Upgrade Plan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">Billing & Usage</h1>

      {/* -------- TOTALS CARD -------- */}
      <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
        <h2 className="text-xl font-semibold mb-4">Monthly Totals</h2>

        <div className="grid grid-cols-3 gap-6 text-sm">
          <div className="p-4 bg-neutral-800/40 rounded-lg">
            <p className="text-gray-400">Pipelines Run</p>
            <p className="text-2xl font-bold">{totals.pipelines_run ?? 0}</p>
            <p className="text-gray-500 text-xs">
              Limit: {limits.max_pipelines === Infinity ? "∞" : limits.max_pipelines}
            </p>
          </div>

          <div className="p-4 bg-neutral-800/40 rounded-lg">
            <p className="text-gray-400">API Calls</p>
            <p className="text-2xl font-bold">{totals.provider_api_calls ?? 0}</p>
            <p className="text-gray-500 text-xs">
              Limit:{" "}
              {limits.max_provider_calls === Infinity
                ? "∞"
                : limits.max_provider_calls}
            </p>
          </div>

          <div className="p-4 bg-neutral-800/40 rounded-lg">
            <p className="text-gray-400">Build Minutes</p>
            <p className="text-2xl font-bold">{totals.build_minutes ?? 0}</p>
            <p className="text-gray-500 text-xs">
              Limit:{" "}
              {limits.max_build_minutes === Infinity
                ? "∞"
                : limits.max_build_minutes}
            </p>
          </div>
        </div>
      </div>

      {/* -------- UPGRADE RECOMMENDATIONS -------- */}
      {recommendations.length > 0 && (
        <div className="p-6 rounded-xl bg-yellow-900/30 border border-yellow-700">
          <h3 className="text-lg font-bold text-yellow-300 mb-3">
            Usage Recommendations
          </h3>
          <ul className="list-disc ml-5 text-yellow-200 text-sm space-y-1">
            {recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>

          <button
            onClick={() => router.push("/upgrade")}
            className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-black rounded font-semibold"
          >
            Explore Upgrade Options
          </button>
        </div>
      )}

      {/* -------- DAILY LOGS TABLE -------- */}
      <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
        <h2 className="text-xl font-semibold mb-4">Daily Usage Logs</h2>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-gray-400 border-b border-neutral-800">
              <th className="py-2 text-left">Date</th>
              <th className="py-2 text-left">Pipelines</th>
              <th className="py-2 text-left">API Calls</th>
              <th className="py-2 text-left">Build Minutes</th>
            </tr>
          </thead>

          <tbody>
            {usage.map((u) => (
              <tr key={u.id} className="border-b border-neutral-800">
                <td className="py-2">{new Date(u.date).toLocaleDateString()}</td>
                <td>{u.pipelines_run}</td>
                <td>{u.provider_api_calls}</td>
                <td>{u.build_minutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
