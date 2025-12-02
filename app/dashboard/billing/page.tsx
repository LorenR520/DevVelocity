// app/dashboard/billing/page.tsx

import BillingSummaryCard from "@/components/BillingSummaryCard";
import BillingUsageChart from "@/components/BillingUsageChart";
import BillingUsageTable from "@/components/BillingUsageTable";
import BillingUpgradeCard from "@/components/BillingUpgradeCard";

import { cookies } from "next/headers";

async function getBillingSummary() {
  const orgId = cookies().get("org_id")?.value;
  const plan = cookies().get("user_plan")?.value ?? "developer";

  if (!orgId) return null;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/summary`,
    {
      method: "POST",
      body: JSON.stringify({ orgId, plan }),
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 10 }, // auto-refresh every 10 seconds on server
    }
  );

  return res.json();
}

export default async function BillingPage() {
  const plan = cookies().get("user_plan")?.value ?? "developer";
  const summary = await getBillingSummary();

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 text-white">

      <h1 className="text-3xl font-bold mb-8">Billing & Usage</h1>

      {/* ------------------------------- */}
      {/* Billing Summary */}
      {/* ------------------------------- */}
      {summary ? (
        <BillingSummaryCard
          plan={plan}
          usage={summary.usage}
          upcoming={summary.upcoming}
          cycle={summary.cycle}
        />
      ) : (
        <div className="text-gray-400">Loading billing summary…</div>
      )}

      {/* ------------------------------- */}
      {/* Usage Chart */}
      {/* ------------------------------- */}
      <div className="mt-10">
        <BillingUsageChart />
      </div>

      {/* ------------------------------- */}
      {/* Detailed Usage Table */}
      {/* ------------------------------- */}
      <div className="mt-10">
        <BillingUsageTable />
      </div>

      {/* ------------------------------- */}
      {/* Upgrade Suggestion */}
      {/* ------------------------------- */}
      <BillingUpgradeCard plan={plan} />
    </main>
  );
}
