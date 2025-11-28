// components/UpgradeButtons.tsx

"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function UpgradeButtons({
  planId,
  currentPlan,
}: {
  planId: string;
  currentPlan: string | null;
}) {
  const params = useSearchParams();
  const activePlan = params.get("plan") ?? planId;

  const [loading, setLoading] = useState(false);

  const isCurrent = currentPlan === activePlan;

  async function startUpgrade() {
    if (activePlan === "enterprise") {
      // Enterprise is contact-only
      window.location.href = "/contact/enterprise";
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/app/api/billing/checkout/stripe", {
        method: "POST",
        body: JSON.stringify({ plan: activePlan }),
      });

      const json = await res.json();

      if (json.url) {
        window.location.href = json.url;
      } else {
        alert("Failed to initiate checkout. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      {isCurrent ? (
        <button
          disabled
          className="w-full py-2 rounded-md bg-neutral-800 text-neutral-400 cursor-not-allowed"
        >
          Current Plan
        </button>
      ) : (
        <button
          onClick={startUpgrade}
          disabled={loading}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          {loading ? "Processing..." : "Upgrade Plan"}
        </button>
      )}
    </div>
  );
}
