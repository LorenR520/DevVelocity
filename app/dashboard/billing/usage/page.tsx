// app/dashboard/billing/usage/page.tsx

import BillingUsageChart from "@/components/BillingUsageChart";

export default function UsagePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-8">Usage</h1>

      <BillingUsageChart />

      <section className="mt-10 bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        <h2 className="text-xl font-semibold mb-3">Overage Pricing</h2>

        <ul className="text-gray-300 text-sm space-y-1">
          <li>• $0.02 per build minute over 1,000</li>
          <li>• $0.15 per pipeline executed over 200</li>
          <li>• $0.0001 per API call over 50,000</li>
        </ul>
      </section>
    </main>
  );
}
