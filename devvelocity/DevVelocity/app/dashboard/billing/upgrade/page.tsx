"use client";

import { useEffect, useState } from "react";
import PricingTable from "@/components/PricingTable";
import pricing from "@/marketing/pricing.json";

export default function UpgradePage() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCurrentPlan() {
      try {
        const res = await fetch("/api/user/plan");
        const data = await res.json();
        setCurrentPlan(data.plan_id || null);
      } catch (error) {
        console.error("Error loading current plan:", error);
      }
      setLoading(false);
    }
    loadCurrentPlan();
  }, []);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-20 text-center text-white">
        Loading your plan...
      </main>
    );
  }

  // Add highlight to most popular plan
  const plans = pricing.plans.map((p) => ({
    ...p,
    badge: p.id === "startup" ? "Most Popular" : undefined,
    cta:
      currentPlan === p.id
        ? "Current Plan"
        : currentPlan
        ? "Upgrade / Downgrade"
        : "Choose Plan",
    href:
      currentPlan === p.id
        ? "#"
        : `/api/billing/checkout?plan=${p.id}`,
  }));

  return (
    <main className="max-w-5xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-8">Upgrade Plan</h1>

      <p className="text-gray-300 mb-10">
        Select a new plan below. Upgrades apply immediately.  
        Downgrades apply at next billing cycle.
      </p>

      <PricingTable plans={plans} />
    </main>
  );
}
