"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PlanSummaryProps {
  orgId: string;
}

export default function BillingPlanSummary({ orgId }: PlanSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlan();
  }, []);

  async function loadPlan() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/plan-summary", {
        method: "POST",
        body: JSON.stringify({ orgId }),
        headers: { "Content-Type": "application/json" }
      });

      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setPlan(json.plan);
      }
    } catch (err: any) {
      setError("Failed to load plan data.");
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 text-gray-400 animate-pulse">
        Loading plan…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-900/30 border border-red-700 text-red-300">
        {error}
      </div>
    );
  }

  if (!plan) return null;

  const isDeveloper = plan.id === "developer";

  return (
    <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 text-white">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold mb-2">Your Plan</h2>
        {!isDeveloper && (
          <Link
            href="/dashboard/billing/upgrade"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold"
          >
            Upgrade Plan
          </Link>
        )}
      </div>

      <div className="text-lg font-semibold capitalize">
        {plan.name}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-gray-300">

        {/* Seats */}
        <div className="bg-neutral-800/40 p-4 rounded-lg border border-neutral-700">
          <p className="text-sm uppercase text-gray-500">Seats</p>
          <p className="text-xl font-bold mt-1">
            {plan.seats_used} / {plan.seats}
          </p>
        </div>

        {/* Provider Limits */}
        <div className="bg-neutral-800/40 p-4 rounded-lg border border-neutral-700">
          <p className="text-sm uppercase text-gray-500">Cloud Providers</p>
          <p className="text-xl font-bold mt-1">
            {plan.provider_limit === "unlimited"
              ? "Unlimited"
              : `${plan.provider_limit} Providers`}
          </p>
        </div>

        {/* Pipelines */}
        <div className="bg-neutral-800/40 p-4 rounded-lg border border-neutral-700">
          <p className="text-sm uppercase text-gray-500">Pipelines</p>
          <p className="text-xl font-bold mt-1">
            {plan.pipelines_used} / {plan.pipeline_limit}
          </p>
        </div>

        {/* Build Minutes */}
        <div className="bg-neutral-800/40 p-4 rounded-lg border border-neutral-700">
          <p className="text-sm uppercase text-gray-500">Build Minutes</p>
          <p className="text-xl font-bold mt-1">
            {plan.build_minutes_used} / {plan.build_minutes}
          </p>
        </div>

        {/* Reset Date */}
        <div className="bg-neutral-800/40 p-4 rounded-lg border border-neutral-700 md:col-span-2">
          <p className="text-sm uppercase text-gray-500">Cycle Reset</p>
          <p className="text-xl font-bold mt-1">
            Renews on {plan.next_reset_date}
          </p>
        </div>

      </div>

      {/* Developer Warning */}
      {isDeveloper && (
        <div className="mt-6 p-4 rounded-lg bg-yellow-900/40 border border-yellow-700 text-yellow-300">
          You are currently on the Developer plan.  
          File Portal, multi-cloud features, and advanced automation require an upgrade.
        </div>
      )}
    </div>
  );
}
