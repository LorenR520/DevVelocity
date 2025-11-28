"use client";

import { useEffect, useState } from "react";
import PricingTable from "@/components/PricingTable";
import pricing from "@/marketing/pricing.json";

export default function UpgradePage() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/billing/summary", { cache: "no-store" });
      const json = await res.json();
      setCurrentPlan(json.plan?.id || null);
    }
    load();
  }, []);

  if (!pricing?.plans) {
    return (
      <div className="text-center text-gray-400 py-20">
        Loading pricing...
      </div>
    );
  }

  // Decorate plans with CTA and badges
  const decoratedPlans = pricing.plans.map((p) => {
    const isCurrent = currentPlan === p.id;

    return {
      ...p,
      cta: isCurrent ? "Current Plan" : "Upgrade",
      href: isCurrent
        ? "#"
        : `/api/billing/checkout/lemon?plan=${p.id}`, // default checkout
      badge: p.id === "startup" ? "Most Popular" : undefined,
    };
  });

  return (
    <main className="max-w-5xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-10">Upgrade Plan</h1>

      <p className="text-gray-300 mb-8">
        Choose the plan that fits your scale. All upgrades apply instantly.
      </p>

      <PricingTable plans={decoratedPlans} />
    </main>
  );
}
