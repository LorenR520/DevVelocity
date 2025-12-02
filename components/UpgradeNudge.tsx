"use client";

import Link from "next/link";

interface Props {
  feature: string;       // ex: "Billing Insights"
  plan: string;          // developer | startup | team | enterprise
  from?: string;         // page source, ex: "billing"
  className?: string;    // optional styling overrides
}

const nextPlan: Record<string, string> = {
  developer: "startup",
  startup: "team",
  team: "enterprise",
  enterprise: "enterprise"
};

export default function UpgradeNudge({ feature, plan, from, className }: Props) {
  if (plan === "enterprise") return null; // Enterprise never gets nudged

  const upgradeTarget = nextPlan[plan];

  return (
    <div
      className={`p-5 rounded-lg border border-yellow-700 bg-yellow-900/40 text-yellow-200 ${className ?? ""}`}
    >
      <h3 className="text-lg font-semibold text-yellow-300 mb-2">
        Unlock {feature}
      </h3>

      <p className="text-sm mb-4">
        Your current plan (<span className="font-semibold capitalize">{plan}</span>)
        does not include this feature.
        Upgrade to <span className="font-semibold capitalize">{upgradeTarget}</span> to enable it.
      </p>

      <Link
        href={`/upgrade?from=${from ?? "dashboard"}&feature=${feature}`}
        className="inline-block px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded font-medium text-sm"
      >
        Upgrade Plan
      </Link>
    </div>
  );
}
