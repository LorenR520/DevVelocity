// docs/pricing/comparison/page.tsx

import pricingData from "@/marketing/pricing.json";
import PricingTable from "@/components/PricingTable";

export const dynamic = "force-static";

export const metadata = {
  title: "Compare Plans – DevVelocity",
  description:
    "Side-by-side comparison of DevVelocity pricing plans, features, seats, and provider limits.",
};

export default function ComparisonPage() {
  const plans = pricingData.plans.map((plan) => ({
    name: plan.name,
    price:
      plan.price === "custom" || plan.price === "Custom"
        ? "Custom"
        : `$${plan.price}`,
    badge: plan.id === "startup" ? "Most Popular" : undefined,
    features: [
      `${plan.providers} Cloud Providers`,
      `${plan.updates} Image Updates`,
      `Template Builder: ${plan.builder}`,
      `SSO: ${plan.sso}`,
      `Seats Included: ${plan.seats_included}`,
      `Seat Price: ${
        plan.seat_price === "custom"
          ? "Custom"
          : `$${plan.seat_price} / seat`
      }`,
    ],
    cta:
      plan.id === "enterprise"
        ? "Contact Sales"
        : `Choose ${plan.name}`,
    href:
      plan.id === "enterprise"
        ? "mailto:sales@devvelocity.app"
        : `/dashboard/billing/upgrade?plan=${plan.id}`,
  }));

  return (
    <main className="max-w-6xl mx-auto px-6 py-20 text-white">
      <h1 className="text-4xl font-bold text-center mb-6">
        Compare All DevVelocity Plans
      </h1>

      <p className="text-center text-gray-300 mb-12">
        Find the right plan for your multi-cloud automation workflow.
      </p>

      <PricingTable plans={plans} />
    </main>
  );
}
