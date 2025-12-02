"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function BillingUpgradeCard({ plan }: { plan: string }) {
  const [nextPlan, setNextPlan] = useState<string | null>(null);
  const [features, setFeatures] = useState<any>(null);

  useEffect(() => {
    const order = ["developer", "startup", "team", "enterprise"];
    const idx = order.indexOf(plan);

    if (idx >= 0 && idx < order.length - 1) {
      setNextPlan(order[idx + 1]);
    }

    // Dynamic feature table (you can expand later)
    const featureMap: any = {
      developer: {
        missing: ["File Portal", "Multi-Cloud Support", "SSO Options"],
      },
      startup: {
        missing: ["Advanced Pipelines", "Cross-Cloud Failover", "SSO Advanced"],
      },
      team: {
        missing: ["Enterprise Hardening", "Dedicated Support", "Private AI Models"],
      },
    };

    setFeatures(featureMap[plan] || null);
  }, [plan]);

  if (plan === "enterprise") return null; // Top tier — no upsell needed
  if (!nextPlan) return null;

  return (
    <div className="p-6 rounded-xl bg-blue-950/40 border border-blue-900 mt-10 text-white">
      <h2 className="text-2xl font-bold mb-2">
        Upgrade to {nextPlan.charAt(0).toUpperCase() + nextPlan.slice(1)}
      </h2>
      <p className="text-blue-200 mb-4">
        Unlock more power, more automation, and more scalability.
      </p>

      {/* Missing Feature List */}
      {features && (
        <div className="mb-6 space-y-1 text-sm">
          <p className="font-semibold text-blue-300">By upgrading you gain:</p>

          {features.missing.map((f: string) => (
            <div
              key={f}
              className="flex items-center gap-2 text-blue-100"
            >
              <span className="text-blue-400">•</span> {f}
            </div>
          ))}
        </div>
      )}

      {/* CTA Button */}
      <Link
        href={`/upgrade?from=billing&current=${plan}`}
        className="inline-block mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white"
      >
        Upgrade My Plan
      </Link>
    </div>
  );
}
