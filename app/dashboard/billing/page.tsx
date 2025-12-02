"use client";

import { useEffect, useState } from "react";
import BillingUsageGraph from "@/components/BillingUsageGraph";
import BillingPlanSummary from "@/components/BillingPlanSummary";

export default function BillingPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("developer");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------------
  // Load org + plan from cookies or localStorage
  // -----------------------------------------------------
  useEffect(() => {
    const storedOrg = window.localStorage.getItem("org_id");
    const storedPlan = window.localStorage.getItem("user_plan");

    if (storedOrg) setOrgId(storedOrg);
    if (storedPlan) setPlan(storedPlan);

    if (storedOrg) loadSummary(storedOrg);
  }, []);

  // -----------------------------------------------------
  // Load plan summary from API
  // -----------------------------------------------------
  async function loadSummary(org: string) {
    try {
      setLoading(true);

      const res = await fetch("/api/billing/plan-summary", {
        method: "POST",
        body: JSON.stringify({ orgId: org }),
        headers: { "Content-Type": "application/json" }
      });

      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setSummary(json.plan);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load billing data.");
    }
    setLoading(false);
  }

  // -----------------------------------------------------
  // Render
  // -----------------------------------------------------
  if (!orgId) {
    return (
      <main className="text-center text-gray-400 py-20">
        No organization selected.
      </main>
    );
  }

  if (loading) {
    return (
      <main className="text-center text-gray-300 py-20">
        Loading billing dashboard...
      </main>
    );
  }

  if (error) {
    return (
      <main className="text-center text-red-400 py-20">
        {error}
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">

      {/* Title */}
      <h1 className="text-3xl font-bold mb-10">Billing Overview</h1>

      {/* Plan Summary */}
      {summary && <BillingPlanSummary summary={summary} />}

      {/* Usage Graph */}
      <BillingUsageGraph orgId={orgId} />

      {/* Upgrade Nudges */}
      {plan === "developer" && (
        <div className="mt-10 p-6 bg-yellow-900/40 rounded-lg border border-yellow-700">
          <h3 className="text-xl font-semibold mb-2 text-yellow-300">
            Unlock full Billing Insights
          </h3>
          <p className="text-yellow-200 mb-4">
            Upgrade your plan to track multi-cloud deployments, pipeline automation,
            and advanced AI cost projections.
          </p>

          <a
            href="/upgrade?from=billing"
            className="inline-block bg-yellow-600 hover:bg-yellow-700 px-5 py-2 rounded font-medium"
          >
            Upgrade Plan
          </a>
        </div>
      )}
    </main>
  );
}
