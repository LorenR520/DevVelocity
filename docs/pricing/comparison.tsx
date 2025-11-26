// docs/pricing/comparison.tsx

export const dynamic = "force-static";

export const metadata = {
  title: "Plan Comparison – DevVelocity",
  description:
    "Compare all DevVelocity plans and choose the best automation tier for your team.",
};

export default function PricingComparisonPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-20 text-white">
      <h1 className="text-4xl font-bold mb-10 text-center">
        Compare Plans
      </h1>

      <p className="text-gray-300 text-center mb-16 max-w-3xl mx-auto">
        DevVelocity offers fully autonomous infrastructure automation across
        all major cloud providers. Compare features across all plans below.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-neutral-900 text-gray-300">
              <th className="p-4">Feature</th>
              <th className="p-4">Developer<br/><span className="text-sm">$39/mo</span></th>
              <th className="p-4">Startup<br/><span className="text-sm">$99/mo</span></th>
              <th className="p-4">Team<br/><span className="text-sm">$299/mo</span></th>
              <th className="p-4">Enterprise<br/><span className="text-sm">From $1,250/mo</span></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-800">

            {/* Cloud Providers */}
            <tr>
              <td className="p-4 font-medium">Cloud Providers Included</td>
              <td className="p-4">1</td>
              <td className="p-4">3</td>
              <td className="p-4">7</td>
              <td className="p-4">Unlimited</td>
            </tr>

            {/* Update Frequency */}
            <tr>
              <td className="p-4 font-medium">Image Update Frequency</td>
              <td className="p-4">Monthly Auto-Updates</td>
              <td className="p-4">Weekly Auto-Updates</td>
              <td className="p-4">Daily Auto-Updates</td>
              <td className="p-4">Real-Time Continuous</td>
            </tr>

            {/* Builders */}
            <tr>
              <td className="p-4 font-medium">Template Builder</td>
              <td className="p-4">Basic</td>
              <td className="p-4">Advanced</td>
              <td className="p-4">Enterprise Library</td>
              <td className="p-4">Private + Custom Pipelines</td>
            </tr>

            {/* Scraped Docs */}
            <tr>
              <td className="p-4 font-medium">Auto-Scraped Provider Docs</td>
              <td className="p-4">✔</td>
              <td className="p-4">✔</td>
              <td className="p-4">✔ + Pipelines</td>
              <td className="p-4">✔ + Compliance Mode</td>
            </tr>

            {/* SSO */}
            <tr>
              <td className="p-4 font-medium">SSO</td>
              <td className="p-4 text-gray-600">—</td>
              <td className="p-4">Basic SSO</td>
              <td className="p-4">Advanced SSO + RBAC</td>
              <td className="p-4">Enterprise SSO + Governance</td>
            </tr>

            {/* Concurrency */}
            <tr>
              <td className="p-4 font-medium">Build Concurrency</td>
              <td className="p-4">1 Concurrent Build</td>
              <td className="p-4">3 Concurrent Builds</td>
              <td className="p-4">10 Concurrent Builds</td>
              <td className="p-4">Unlimited</td>
            </tr>

            {/* Support */}
            <tr>
              <td className="p-4 font-medium">Support</td>
              <td className="p-4">Automated</td>
              <td className="p-4">Automated + Email</td>
              <td className="p-4">Automated + Priority Queue</td>
              <td className="p-4">Dedicated Automation Lane</td>
            </tr>

            {/* Target */}
            <tr>
              <td className="p-4 font-medium">Best For</td>
              <td className="p-4">Solo Devs</td>
              <td className="p-4">Startups</td>
              <td className="p-4">Multi-Cloud Teams</td>
              <td className="p-4">Large-Scale Gov/Enterprise</td>
            </tr>

          </tbody>
        </table>
      </div>
    </main>
  );
}
