"use client";

import UpgradeButtons from "../../../components/UpgradeButtons";

export default function BillingDashboard() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-white">

      <h1 className="text-3xl font-bold mb-8">Billing</h1>

      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 mb-8">
        <h2 className="text-xl font-semibold mb-2">Your Current Plan</h2>
        <p className="text-gray-300">Developer Plan — $39/mo</p>

        <p className="text-gray-500 mt-2 text-sm">
          (This will auto-update once Lemon Squeezy webhooks are connected.)
        </p>
      </section>

      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        <h2 className="text-xl font-semibold mb-4">Upgrade Your Plan</h2>

        <UpgradeButtons />
      </section>
    </main>
  );
}
