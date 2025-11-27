"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function UpgradePlanPage() {
  const params = useSearchParams();
  const plan = params.get("plan");

  const [loading, setLoading] = useState(false);

  async function checkout() {
    setLoading(true);

    const res = await fetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({ plan, userId: "current-user" }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <section className="max-w-xl mx-auto px-6 py-20 text-white">
      <h1 className="text-3xl font-bold mb-4">Upgrade Plan</h1>
      <p className="text-gray-300 mb-6">Plan: {plan}</p>

      <button
        onClick={checkout}
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-md"
      >
        {loading ? "Redirecting..." : "Continue to Checkout"}
      </button>
    </section>
  );
}
