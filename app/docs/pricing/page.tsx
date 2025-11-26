export const dynamic = "force-static";

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 text-white">
      <h1 className="text-4xl font-bold mb-8 text-center">Pricing</h1>

      <p className="text-gray-300 text-center mb-14">
        Simple, transparent, usage-based pricing.  
        No hidden fees. Cancel anytime.
      </p>

      {/* PRICING GRID */}
      <div className="grid md:grid-cols-3 gap-10">
        {/* STARTER */}
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Starter</h2>
          <p className="text-4xl font-bold mb-2">$19</p>
          <p className="text-gray-400 mb-6">per month</p>

          <ul className="text-gray-300 space-y-3 mb-6">
            <li>• Single cloud provider</li>
            <li>• 5 builds / month</li>
            <li>• Community support</li>
          </ul>

          <a
            href="/auth/signup"
            className="block text-center py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition"
          >
            Get Started
          </a>
        </div>

        {/* PRO */}
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg ring-2 ring-blue-600">
          <h2 className="text-2xl font-semibold mb-4">Pro</h2>
          <p className="text-4xl font-bold mb-2">$99</p>
          <p className="text-gray-400 mb-6">per month</p>

          <ul className="text-gray-300 space-y-3 mb-6">
            <li>• Multi-cloud support</li>
            <li>• 100 builds / month</li>
            <li>• Template Builder UI access</li>
            <li>• Email support</li>
          </ul>

          <a
            href="/auth/signup"
            className="block text-center py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition"
          >
            Upgrade Now
          </a>
        </div>

        {/* ENTERPRISE */}
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Enterprise</h2>
          <p className="text-4xl font-bold mb-2">Custom</p>
          <p className="text-gray-400 mb-6">Contact sales</p>

          <ul className="text-gray-300 space-y-3 mb-6">
            <li>• Unlimited multi-cloud builds</li>
            <li>• Air-gapped / GovCloud options</li>
            <li>• SSO + RBAC</li>
            <li>• SLAs & phone support</li>
            <li>• Dedicated architect</li>
          </ul>

          <a
            href="/contact"
            className="block text-center py-2 rounded-md border border-neutral-700 hover:bg-neutral-800 transition"
          >
            Contact Sales
          </a>
        </div>
      </div>

      <p className="text-center text-gray-500 mt-16 text-sm">
        All plans include full access to DevVelocity's CLI, documentation, and
        future updates.
      </p>
    </div>
  );
}
