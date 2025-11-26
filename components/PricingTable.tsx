// components/PricingTable.tsx

interface Plan {
  name: string;
  price: string;
  badge?: string;
  features: string[];
  cta: string;
  href: string;
}

export default function PricingTable({ plans }: { plans: Plan[] }) {
  return (
    <div className="grid md:grid-cols-3 gap-8 text-white">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={`p-6 rounded-xl border ${
            plan.badge ? "border-blue-700 shadow-blue-700/40 shadow-lg" : "border-neutral-800"
          } bg-neutral-900`}
        >
          {plan.badge && (
            <span className="inline-block mb-3 text-xs px-2 py-0.5 bg-blue-700/40 text-blue-300 rounded-full">
              {plan.badge}
            </span>
          )}

          <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>

          <p className="text-4xl font-bold mb-6">{plan.price}</p>

          <ul className="space-y-2 text-gray-300 mb-6">
            {plan.features.map((f, i) => (
              <li key={i}>✔ {f}</li>
            ))}
          </ul>

          <a
            href={plan.href}
            className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            {plan.cta}
          </a>
        </div>
      ))}
    </div>
  );
}
