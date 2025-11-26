// docs/pricing/page.tsx

export const dynamic = "force-static"; // Required for Cloudflare Pages

export const metadata = {
  title: "Pricing – DevVelocity",
  description:
    "Choose the right DevVelocity plan for fully automated multi-cloud image builds powered by autonomous, self-updating infrastructure intelligence.",
};

export default function PricingPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20 text-white">
      <h1 className="text-4xl font-bold mb-6 text-center">Pricing</h1>
      <p className="text-gray-300 text-center mb-12">
        DevVelocity is a fully autonomous cloud engineer. No support calls, no
        maintenance — just continuous, self-updating automation.
      </p>

      <div className="grid md:grid-cols-3 gap-8">

        {/* DEVELOPER */}
        <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800">
          <h2 className="text-2xl font-semibold mb-2">Developer</h2>
          <p className="text-gray-400 mb-4">For solo builders & hobby engineers</p>

          <p className="text-4xl font-bold mb-6">$39</p>

          <ul className="space-y-2 text-gray-300 mb-6">
            <li>✔ 1 Cloud Provider</li>
            <li>✔ Monthly Auto-Updates</li>
            <li>✔ Template Builder (Basic)</li>
            <li>✔ Auto-Scraped Provider Docs</li>
            <li>✔ CLI Access</li>
          </ul>

          <a
            href="/auth/signup"
            className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Start Building
          </a>
        </div>

        {/* STARTUP */}
        <div className="p-6 bg-neutral-900 rounded-xl border border-blue-700 shadow-blue-700/40 shadow-lg">
          <h2 className="text-2xl font-semibold mb-2">Startup</h2>
          <p className="text-gray-400 mb-4">For fast-moving teams & SMBs</p>

          <p className="text-4xl font-bold mb-6">$99</p>

          <ul className="space-y-2 text-gray-300 mb-6">
            <li>✔ 3 Cloud Providers</li>
            <li>✔ Weekly Auto-Updates</li>
            <li>✔ Template Builder (Advanced)</li>
            <li>✔ Auto-Scraped Provider Docs</li>
            <li>✔ Team Workspace</li>
            <li>✔ Basic SSO</li>
          </ul>

          <a
            href="/auth/signup"
            className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Start Startup Plan
          </a>
        </div>

        {/* TEAM */}
        <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800">
          <h2 className="text-2xl font-semibold mb-2">Team</h2>
          <p className="text-gray-400 mb-4">For multi-cloud operational teams</p>

          <p className="text-4xl font-bold mb-6">$299</p>

          <ul className="space-y-2 text-gray-300 mb-6">
            <li>✔ 7 Cloud Providers</li>
            <li>✔ Daily Auto-Updates</li>
            <li>✔ Enterprise Template Library</li>
            <li>✔ Auto-Scraped Provider Docs + Pipelines</li>
            <li>✔ SSO + Role Management</li>
            <li>✔ Build Concurrency & Webhooks</li>
          </ul>

          <a
            href="/auth/signup"
            className="block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Start Team Plan
          </a>
        </div>

        {/* ENTERPRISE */}
        <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800 md:col-span-3">
          <h2 className="text-2xl font-semibold mb-2">Enterprise</h2>
          <p className="text-gray-400 mb-4">Autonomous infrastructure at scale</p>

          <p className="text-4xl font-bold mb-6">Starting at $1,250/mo</p>

          <ul className="space-y-2 text-gray-300 mb-6 md:max-w-lg">
            <li>✔ Unlimited Cloud Providers</li>
            <li>✔ Real-Time Auto-Updates (Continuous)</li>
            <li>✔ Private Templates & Pipelines</li>
            <li>✔ Compliance Mode + SBOM</li>
            <li>✔ Multi-Region Build Network</li>
            <li>✔ On-Prem / GovCloud Optional</li>
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
