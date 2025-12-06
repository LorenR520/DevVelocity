import pricingData from "../../../marketing/pricing.json";

export const dynamic = "force-static";

const builderLabels: Record<string, string> = {
  basic: "Standard Builder",
  advanced: "Multi-Cloud Builder",
  enterprise: "Enterprise Builder",
  private: "Private AI Builder",
};

export default function PricingPage() {
  const plans = pricingData.plans;

  return (
    <main className="max-w-6xl mx-auto px-6 py-20 text-white">
      <h1 className="text-4xl font-bold text-center mb-6">Pricing</h1>
      <p className="text-gray-300 text-center mb-12">
        Fully autonomous multi-cloud builds. No maintenance. No support calls.
        Just pure automation.
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        {plans
          .filter((p) => p.id !== "enterprise")
          .map((plan) => (
            <div
              key={plan.id}
              className="p-6 bg-neutral-900 rounded-xl border border-neutral-800"
            >
              <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>

              {/* Use marketing display price */}
              <p className="text-4xl font-bold mb-6">
                {plan.display_price}
              </p>

              <ul className="space-y-2 text-gray-300 mb-6">
                <li>✔ {plan.providers} Cloud Providers</li>
                <li>✔ {plan.updates} Auto-Updates</li>

                {/* Human-friendly builder description */}
                <li>✔ Builder: {builderLabels[plan.builder] ?? plan.builder}</li>

                <li>✔ SSO Level: {plan.sso}</li>
              </ul>

              <a
                href={`/dashboard/billing/upgrade?plan=${plan.id}`}
                className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Get Started
              </a>
            </div>
          ))}

        {/* Enterprise Plan */}
        <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800 md:col-span-3">
          <h2 className="text-2xl font-semibold mb-2">Enterprise</h2>

          {/* Pull price dynamically */}
          <p className="text-4xl font-bold mb-6">
            {pricingData.plans.find((p) => p.id === "enterprise")?.display_price}
          </p>

          <ul className="space-y-2 text-gray-300 mb-6">
            <li>✔ Unlimited Providers</li>
            <li>✔ Continuous Updates</li>
            <li>✔ Private Builder Modules</li>
            <li>✔ Gov/Enterprise SSO</li>
          </ul>

          <a
            href="mailto:sales@devvelocity.app"
            className="inline-block px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </main>
  );
}
