// app/dashboard/billing/usage/page.tsx

import BillingUsageChart from "@/components/BillingUsageChart";

export default function UsagePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-8">Usage</h1>

      <BillingUsageChart />

      <div className="mt-8 bg-neutral-900 rounded-xl border border-neutral-800 p-6">
        <h2 className="text-xl font-semibold mb-2">Overage Policy</h2>
        <p className="text-gray-400 text-sm">
          Additional usage beyond plan limits is billed monthly at:
        </p>

        <ul className="mt-4 text-gray-300 text-sm">
          <li>• $0.02 per build minute overage</li>
          <li>• $0.15 per extra pipeline executed</li>
          <li>• $0.0001 per API call overage</li>
        </ul>
      </div>
    </main>
  );
}
