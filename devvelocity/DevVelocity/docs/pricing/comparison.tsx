import pricingData from "../../../../marketing/pricing.json";
import PricingTable from "../../../../components/PricingTable";

export default function ComparisonPage() {
  const plans = pricingData.plans;

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 text-white">
      <h1 className="text-4xl font-bold text-center mb-12">Plan Comparison</h1>

      <div className="grid md:grid-cols-4 gap-6">
        {plans.map((plan: any) => (
          <PricingTable key={plan.id} plan={plan} />
        ))}
      </div>
    </main>
  );
}
