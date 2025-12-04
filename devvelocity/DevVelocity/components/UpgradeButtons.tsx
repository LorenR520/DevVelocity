"use client";

import { useSearchParams } from "next/navigation";
import pricing from "@/marketing/pricing.json";

export default function UpgradeButtons({
  currentPlan,
}: {
  currentPlan: string;
}) {
  const searchParams = useSearchParams();
  const selected = searchParams.get("plan");

  return (
    <div className="space-y-4">
      {pricing.plans.map((plan) => {
        const isCurrent = plan.id === currentPlan;
        const isSelected = plan.id === selected;

        let priceDisplay =
          plan.price === "custom" ? "Contact Sales" : `$${plan.price}/mo`;

        return (
          <div
            key={plan.id}
            className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{priceDisplay}</p>
              </div>

              {!isCurrent && (
                <a
                  href={`/dashboard/billing/upgrade?plan=${plan.id}`}
                  className={`px-4 py-2 rounded-md text-sm font-medium
                  ${
                    isSelected
                      ? "bg-blue-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }
                `}
                >
                  {plan.id === "enterprise"
                    ? "Contact Sales"
                    : isSelected
                    ? "Selected"
                    : "Upgrade"}
                </a>
              )}

              {isCurrent && (
                <button
                  disabled
                  className="px-4 py-2 bg-neutral-700 text-neutral-400 rounded-md cursor-not-allowed"
                >
                  Current Plan
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
