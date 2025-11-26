"use client";

import { useSearchParams } from "next/navigation";

const PLANS = {
  developer: { price: "$39/mo", name: "Developer" },
  startup: { price: "$99/mo", name: "Startup" },
  team: { price: "$299/mo", name: "Team" },
  enterprise: { price: "Custom", name: "Enterprise" },
};

export default function UpgradePlanPage() {
  const params = useSearchParams();
  const plan = params.get("plan") as keyof typeof PLANS;

  if (!plan || !PLANS[plan]) {
    return (
      <div className="text-white text-center py-20">
        <h1 className="text-3xl font-bold">Invalid Plan</h1>
        <p className="text-gray-400 mt-4">Please select a valid plan.</p>
      </div>
    );
  }

  const p = PLANS[plan];

  return (
    <section className="max-w-xl mx-auto px-6 py-20 text-white">
      <h1 className="text-3xl font-bold mb-6">
        Upgrade to {p.name}
      </h1>

      <p className="text-gray-300 mb-6">
        You're upgrading to the <strong>{p.name}</strong> plan.
      </p>

      <p className="text-4xl font-bold mb-10">{p.price}</p>

      <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white">
        Continue to Checkout
      </button>
    </section>
  );
}
