// components/UpgradeButtons.tsx

"use client";

import { useRouter } from "next/navigation";

export default function UpgradeButtons() {
  const router = useRouter();

  const plans = [
    { id: "developer", name: "Developer", price: "$39/mo" },
    { id: "startup", name: "Startup", price: "$99/mo" },
    { id: "team", name: "Team", price: "$299/mo" },
    { id: "enterprise", name: "Enterprise", price: "Custom" }
  ];

  function handleUpgrade(planId: string) {
    router.push(`/dashboard/billing/upgrade?plan=${planId}`);
  }

  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        <button
          key={plan.id}
          onClick={() => handleUpgrade(plan.id)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition"
        >
          Upgrade to {plan.name} ({plan.price})
        </button>
      ))}
    </div>
  );
}
