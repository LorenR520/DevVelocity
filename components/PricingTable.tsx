// components/PricingTable.tsx

interface Plan {
  id: string;
  name: string;
  price: number | string;
  providers: number | string;
  updates: string;
  builder: string;
  sso: string;
  badge?: string; // optional badge like "Most Popular"
  href?: string;  // optional CTA link
  cta?: string;   // optional CTA text
}

export default function PricingTable({ plans }: { plans: Plan[] }) {
  return (
    <div className="grid md:grid-cols-3 gap-8 text-white">
      {plans.map((plan) => {
        // Auto-generate feature list from plan attributes
        const features = [
          `${plan.providers} Cloud Providers`,
          `${plan.updates} Auto-Updates`,
          `Template Builder: ${plan.builder}`,
          `SSO: ${plan.sso}`,
        ];

        const priceDisplay =
          plan.price === "custom" || plan.id === "enterprise"
            ? "Custom"
            : `$${plan.price}`;

        return (
          <div
            key={plan.id}
            className={`p-6 rounded-xl border ${
              plan.badge
                ? "border-blue-700 shadow-blue-700/40 shadow-lg"
                : "border-neutral-800"
            } bg-neutral-900`}
          >
            {plan.badge && (
              <span className="inline-block mb-3 text-xs px-2 py-0.5 bg-blue-700/40 text-blue-300 rounded-full">
                {plan.badge}
              </span>
            )}

            <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>

            <p className="text-4xl font-bold mb-6">{priceDisplay}</p>

            <ul className="space-y-2 text-gray-300 mb-6">
              {features.map((f, i) => (
                <li key={i}>✔ {f}</li>
              ))}
            </ul>

            <a
              href={plan.href ?? `/dashboard/billing/upgrade?plan=${plan.id}`}
              className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              {plan.cta ?? "Select Plan"}
            </a>
          </div>
        );
      })}
    </div>
  );
}
