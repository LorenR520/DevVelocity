// components/PricingTable.tsx

import pricing from "@/marketing/pricing.json";

interface Plan {
  id: string;
  name: string;
  display_price: string;
  price: number | string;
  providers: number | string;
  updates: string;
  builder: string;
  sso: string;
  seats_included: number | string;
  seat_price: number | string;

  limits: {
    build_minutes: number | string;
    pipelines: number | string;
    api_calls: number | string;
  };

  metered: {
    build_minute_price: number | string;
    pipeline_price: number | string;
    api_call_price: number | string;
  };

  badge?: string;
  href?: string;
  cta?: string;
}

export default function PricingTable({
  plans = pricing.plans,
}: {
  plans?: Plan[];
}) {
  return (
    <div className="grid md:grid-cols-4 gap-8 text-white">
      {plans.map((plan) => {
        return (
          <div
            key={plan.id}
            className={`p-6 rounded-xl border bg-neutral-900 ${
              plan.badge
                ? "border-blue-700 shadow-blue-700/40 shadow-lg"
                : "border-neutral-800"
            }`}
          >
            {/* Badge */}
            {plan.badge && (
              <span className="inline-block mb-3 text-xs px-2 py-0.5 bg-blue-700/40 text-blue-300 rounded-full">
                {plan.badge}
              </span>
            )}

            {/* Title */}
            <h2 className="text-2xl font-semibold mb-1">{plan.name}</h2>

            {/* Price */}
            <p className="text-4xl font-bold mb-6 text-blue-400">
              {plan.display_price}
            </p>

            {/* Feature List */}
            <ul className="space-y-2 text-gray-300 mb-6 text-sm">
              <li>✔ {plan.providers} Cloud Providers</li>
              <li>✔ Updates: {plan.updates}</li>
              <li>✔ Builder Tier: {plan.builder}</li>
              <li>✔ SSO: {plan.sso}</li>
              <li>✔ Seats Included: {plan.seats_included}</li>

              {/* Limits */}
              <li className="pt-3 font-semibold text-gray-400 text-xs">
                Usage Limits
              </li>
              <li>• Build Minutes: {plan.limits.build_minutes}</li>
              <li>• Pipelines: {plan.limits.pipelines}</li>
              <li>• API Calls: {plan.limits.api_calls}</li>

              {/* Metered */}
              <li className="pt-3 font-semibold text-gray-400 text-xs">
                Metered Pricing
              </li>
              <li>
                • ${plan.metered.build_minute_price}/extra build minute
              </li>
              <li>• ${plan.metered.pipeline_price}/extra pipeline</li>
              <li>• ${plan.metered.api_call_price}/extra API call</li>
            </ul>

            {/* CTA Button */}
            <a
              href={plan.href ?? `/dashboard/billing/upgrade?plan=${plan.id}`}
              className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium"
            >
              {plan.cta ?? "Select Plan"}
            </a>
          </div>
        );
      })}
    </div>
  );
}
