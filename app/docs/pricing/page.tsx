export default function PricingPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-bold mb-4">Pricing</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-12">
        Choose the plan that matches your workflow. Upgrade anytime.
      </p>

      <div className="grid md:grid-cols-3 gap-8">

        {/* FREE */}
        <div className="border dark:border-neutral-800 rounded-xl p-6 bg-white dark:bg-neutral-900 shadow">
          <h2 className="text-2xl font-semibold mb-2">Free</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Great for beginners and testing environments.
          </p>
          <p className="text-4xl font-bold mb-6">$0</p>

          <ul className="text-sm space-y-2 mb-6">
            <li>• Access to docs</li>
            <li>• Access to free builds</li>
            <li>• Community templates</li>
          </ul>

          <a
            href="/auth/signup"
            className="block text-center px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            Get Started
          </a>
        </div>

        {/* PRO */}
        <div className="border-2 border-blue-600 rounded-xl p-6 bg-white dark:bg-neutral-900 shadow-lg">
          <h2 className="text-2xl font-semibold mb-2">Pro</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Best for DevOps engineers building frequently.
          </p>
          <p className="text-4xl font-bold mb-1">$39</p>
          <p className="text-sm text-gray-500 mb-6">per month</p>

          <ul className="text-sm space-y-2 mb-6">
            <li>• Unlimited image builds</li>
            <li>• Priority queue access</li>
            <li>• Multi-cloud deployments</li>
            <li>• Full provider templates</li>
          </ul>

          <a
            href="/auth/signup"
            className="block text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Upgrade
          </a>
        </div>

        {/* ENTERPRISE */}
        <div className="border dark:border-neutral-800 rounded-xl p-6 bg-white dark:bg-neutral-900 shadow">
          <h2 className="text-2xl font-semibold mb-2">Enterprise</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Hardened images. Multi-region builds. Zero-touch automation.
          </p>
          <p className="text-4xl font-bold mb-1">Custom</p>
          <p className="text-sm text-gray-500 mb-6">volume pricing</p>

          <ul className="text-sm space-y-2 mb-6">
            <li>• Hardened enterprise images</li>
            <li>• Multi-region build pipeline</li>
            <li>• Compliance baselines</li>
            <li>• API build automation</li>
          </ul>

          <a
            href="/auth/signup"
            className="block text-center px-4 py-2 bg-gray-900 dark:bg-white dark:text-black text-white rounded-md hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  );
}
