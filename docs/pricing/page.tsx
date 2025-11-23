export const metadata = {
  title: "Pricing – DevVelocity",
  description: "Choose the right DevVelocity plan for your cloud automation needs.",
};

export default function PricingPage() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for hobbyists, students, and testing environments.",
      features: [
        "Access to basic documentation",
        "Community support",
        "Single-cloud quickstart images (limited)",
        "Manual deployments only",
      ],
      cta: {
        label: "Start Free",
        href: "/auth/signup",
      },
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "For professionals who need automated multi-cloud environments.",
      features: [
        "All Free features",
        "Enterprise-grade cloud images",
        "Multi-cloud deployments (AWS, Azure, GCP, DO, Linode, OCI, Vultr)",
        "Automated hardened builds",
        "Versioned image history",
        "Priority processing",
      ],
      cta: {
        label: "Upgrade to Pro",
        href: "/billing",
      },
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For teams requiring compliance, SLAs, and private cloud delivery.",
      features: [
        "Everything in Pro",
        "Private registry delivery",
        "Bulk licensing",
        "SOC2 / HIPAA compliant pipelines",
        "Team-level dashboard",
        "Dedicated infrastructure lanes",
      ],
      cta: {
        label: "Contact Sales",
        href: "mailto:sales@devvelocity.io",
      },
      highlighted: false,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-bold text-center mb-6">
        Simple, transparent pricing
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-16">
        Scale from hobby projects to enterprise-grade cloud automation. No hidden fees,
        ever.
      </p>

      {/* PRICING GRID */}
      <div className="grid md:grid-cols-3 gap-8">
        {tiers.map((tier, idx) => (
          <div
            key={idx}
            className={`
              border rounded-xl p-8 shadow-sm dark:border-neutral-800 
              bg-white dark:bg-neutral-900 flex flex-col
              ${tier.highlighted ? "border-blue-600 shadow-lg" : ""}
            `}
          >
            <h2 className="text-2xl font-bold mb-2">{tier.name}</h2>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {tier.description}
            </p>

            <div className="text-4xl font-bold mb-6">
              {tier.price}
              <span className="text-lg font-medium text-gray-500">
                {tier.period}
              </span>
            </div>

            {/* FEATURES */}
            <ul className="space-y-2 mb-8 flex-1">
              {tier.features.map((f, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-700 dark:text-gray-300 flex items-start"
                >
                  <span className="text-blue-600 mr-2">✓</span> {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href={tier.cta.href}
              className={`
                block text-center w-full px-4 py-3 rounded-md font-medium transition
                ${
                  tier.highlighted
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300"
                }
              `}
            >
              {tier.cta.label}
            </a>
          </div>
        ))}
      </div>

      {/* FOOTNOTE */}
      <p className="text-center text-gray-500 dark:text-gray-400 mt-12 text-sm">
        All subscriptions can be canceled anytime. No long-term contracts.
      </p>
    </div>
  );
}
