import Link from "next/link";

export default function PricingTable({ plan }: any) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
      <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>

      <p className="text-3xl font-bold mb-4">
        {plan.price === "custom" ? "Custom" : `$${plan.price}`}
      </p>

      <ul className="space-y-1 text-gray-400 text-sm mb-6">
        <li>✔ {plan.providers} Cloud Providers</li>
        <li>✔ {plan.updates} Auto-Updates</li>
        <li>✔ Template Builder: {plan.builder}</li>
        <li>✔ SSO Level: {plan.sso}</li>
      </ul>

      <Link
        href={`/dashboard/billing/upgrade?plan=${plan.id}`}
        className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
      >
        Select Plan
      </Link>
    </div>
  );
}
