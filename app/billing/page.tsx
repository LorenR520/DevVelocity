"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tier, setTier] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        router.push("/auth/login");
        return;
      }

      setUser(data.user);

      // Read subscription tier from cookie
      const subCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("subscription-tier="))
        ?.split("=")[1];

      if (subCookie) setTier(subCookie);

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <p className="text-gray-500 dark:text-gray-300">
          Loading billing details…
        </p>
      </div>
    );
  }

  function handleUpgrade() {
    // Placeholder — full Stripe integration comes later
    alert("Stripe checkout would open here.");
  }

  function handleDowngrade() {
    alert("Cancel/downgrade logic goes here.");
  }

  return (
    <div className="max-w-3xl mx-auto mt-16 p-6">
      <h1 className="text-3xl font-bold mb-4">Billing & Subscription</h1>

      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Manage your subscription, billing history, and plan.
      </p>

      {/* CURRENT PLAN */}
      <div className="p-6 rounded-xl border dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow mb-8">
        <h2 className="font-semibold text-lg mb-2">Current Plan</h2>

        <p className="text-gray-700 dark:text-gray-300 mb-4">
          You are currently on the{" "}
          <span className="font-semibold">{tier.toUpperCase()}</span> plan.
        </p>

        {tier === "free" ? (
          <button
            onClick={handleUpgrade}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Upgrade to Pro
          </button>
        ) : (
          <button
            onClick={handleDowngrade}
            className="px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Cancel Subscription
          </button>
        )}
      </div>

      {/* BILLING HISTORY */}
      <div className="p-6 rounded-xl border dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow">
        <h2 className="font-semibold text-lg mb-3">Billing History</h2>

        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Stripe integration coming soon — invoices will appear here.
        </p>
      </div>
    </div>
  );
}
