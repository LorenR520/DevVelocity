// app/pricing/comparison/page.tsx

import pricing from "@/marketing/pricing.json";

export default function ComparisonPage() {
  const plans = pricing.plans;

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 text-white">
      <h1 className="text-4xl font-bold mb-10 text-center">
        Compare Plans
      </h1>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-gray-300">
          <thead>
            <tr>
              <th className="p-4 text-gray-400">Feature</th>
              {plans.map((plan) => (
                <th
                  key={plan.id}
                  className="p-4 text-center text-xl font-semibold"
                >
                  {plan.name}
                  <p className="text-gray-500 text-sm">
                    {plan.price === "custom"
                      ? "Custom"
                      : `$${plan.price}/mo`}
                  </p>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-800">

            {/* Cloud Providers */}
            <tr>
              <td className="p-4">Cloud Providers Supported</td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center">
                  {plan.providers}
                </td>
              ))}
            </tr>

            {/* Update frequency */}
            <tr>
              <td className="p-4">Template Update Frequency</td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center">
                  {plan.updates}
                </td>
              ))}
            </tr>

            {/* Builder level */}
            <tr>
              <td className="p-4">AI Template Builder</td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center">
                  {plan.builder}
                </td>
              ))}
            </tr>

            {/* SSO */}
            <tr>
              <td className="p-4">Single Sign-On (SSO)</td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center">
                  {plan.sso}
                </td>
              ))}
            </tr>

            {/* Seats Included */}
            <tr>
              <td className="p-4">Seats Included</td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center">
                  {plan.seats_included}
                </td>
              ))}
            </tr>

            {/* Seat overage */}
            <tr>
              <td className="p-4">Additional Seat Price</td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center">
                  {plan.seat_price === "custom"
                    ? "Custom"
                    : `$${plan.seat_price}`}
                </td>
              ))}
            </tr>

            {/* Build Minutes */}
            <tr>
              <td className="p-4">Build Minutes Included</td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center">
                  {plan.limits.build_minutes}
                </td>
              ))}
            </tr>

            {/* Pipelines */}
            <tr>
              <td className="p-4">Pipelines Included</td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center">
                  {plan.limits.pipelines}
                </td>
              ))}
            </tr>

            {/* API Calls */}
            <tr>
              <td className="p-4">API Calls Included</td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center">
                  {plan.limits.api_calls}
                </td>
              ))}
            </tr>

            {/* Metered Pricing */}
            <tr className="bg-neutral-900/40">
              <td className="p-4 font-semibold">Metered Pricing</td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center space-y-1">
                  {plan.metered.build_minute_price === "custom"
                    ? "Custom"
                    : `$${plan.metered.build_minute_price}/build min`}
                  <br />
                  {plan.metered.pipeline_price === "custom"
                    ? "Custom"
                    : `$${plan.metered.pipeline_price}/pipeline`}
                  <br />
                  {plan.metered.api_call_price === "custom"
                    ? "Custom"
                    : `$${plan.metered.api_call_price}/API call`}
                </td>
              ))}
            </tr>

            {/* CTA */}
            <tr className="bg-black/30">
              <td></td>
              {plans.map((plan) => (
                <td key={plan.id} className="p-4 text-center">
                  <a
                    href={`/dashboard/billing/upgrade?plan=${plan.id}`}
                    className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Choose {plan.name}
                  </a>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
