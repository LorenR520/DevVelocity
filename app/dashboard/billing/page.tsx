"use client";

import { useEffect, useState } from "react";
import BillingUsageChart from "@/components/BillingUsageChart";
import BillingBreakdown from "@/components/BillingBreakdown";

export default function BillingPage() {
  const [usage, setUsage] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("developer");

  // Load plan from cookie
  useEffect(() => {
    const cookiePlan = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user_plan="))
      ?.split("=")[1];

    setPlan(cookiePlan ?? "developer");
  }, []);

  // Load usage + invoices
  useEffect(() => {
    async function load() {
      if (!plan) return;

      const resUsage = await fetch("/api/billing/get-usage", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      const jsonUsage = await resUsage.json();

      const resInv = await fetch("/api/billing/get-invoices", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      const jsonInv = await resInv.json();

      setUsage(jsonUsage.usage ?? null);
      setInvoices(jsonInv.invoices ?? []);
      setLoading(false);
    }

    load();
  }, [plan]);

  if (loading) {
    return (
      <div className="text-gray-400 animate-pulse">Loading billing data…</div>
    );
  }

  // Developer tier: locked
  if (plan === "developer") {
    return (
      <div className="p-10 bg-neutral-900/40 rounded-xl border border-neutral-800 text-center">
        <h2 className="text-2xl font-bold mb-4">Billing Overview</h2>
        <p className="text-gray-400 mb-6">
          Upgrade to view detailed usage, invoices, and cost reporting.
        </p>
        <a
          href="/upgrade?from=billing"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
        >
          Upgrade Plan
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">Billing & Usage Overview</h1>

      {/* Usage Summary */}
      <BillingUsageChart usage={usage} />

      {/* Detailed Breakdown */}
      <BillingBreakdown usage={usage} invoices={invoices} />
    </div>
  );
}
