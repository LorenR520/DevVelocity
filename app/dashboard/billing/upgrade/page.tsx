"use client";

import { useSearchParams } from "next/navigation";
import pricingData from "../../../../marketing/pricing.json";

export default function UpgradePlanPage() {
  const params = useSearchParams();
  const planId = params.get("plan");

  const plan = pricingData.plans.find((p) => p.id === planId);

  if (!plan) {
    return (
      <div className="text-white text-center py-20">
        <h1 className="text-3xl font-bold">Invalid Plan</h1>
        <p className="text-gray-400 mt-4">Please select a valid plan.</p>
      </div>
    );
  }

  return (
    <section className="max-w-xl mx-auto px-6 py-20 text-white">
      <h1 className="text-3xl font-bold mb-6">Upgrade to {plan.name}</h1>

      <p className="text-gray-300 mb-6">
        Providers: <strong>{plan.providers}</strong>
        <br />
        Updates: <strong>{plan.updates}</strong>
        <br />
        Builder: <strong>{plan.builder}</strong>
        <br />
        SSO Level: <strong>{plan.sso}</strong>
      </p>

      <p className="text-4xl font-bold mb-10">
        {plan.id === "enterprise" ? "Custom" : `$${plan.price}/mo`}
      </p>

      <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white">
        Continue to Checkout
      </button>
    </section>
  );
}
