// app/pricing/comparison/page.tsx

import pricing from "@/marketing/pricing.json";
import PricingTable from "@/components/PricingTable";

export const dynamic = "force-static";

export default function ComparisonPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-20 text-white">
      <h1 className="text-4xl font-bold text-center mb-6">
        Compare All Plans
      </h1>

      <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
        Choose the plan that matches your cloud scale — from solo developers to
        global enterprise infrastructure teams.
      </p>

      <PricingTable plans={pricing.plans} />
    </main>
  );
}
