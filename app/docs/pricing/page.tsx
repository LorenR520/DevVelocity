export default function Pricing() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Pricing</h1>

      <p className="opacity-80 mb-8">
        Simple, transparent pricing for all cloud providers and image tiers.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Available Tiers</h2>

      <ul className="list-disc ml-6 opacity-80 space-y-1 mb-8">
        <li>Sandbox Tier — entry-level, low-cost environments</li>
        <li>Developer Tier — mid-level performance for real workloads</li>
        <li>Enterprise Tier — optimized for scale, HA, and production</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-2">General Pricing Model</h2>

      <ul className="list-disc ml-6 opacity-80 space-y-1 mb-8">
        <li>Flat one-time image purchase</li>
        <li>Optional monthly support subscription</li>
        <li>No lock-ins, cancel anytime</li>
      </ul>

      <p className="opacity-80">
        Detailed pricing is customized for each provider and tier.  
        Visit the provider pages for exact cost estimates.
      </p>
    </div>
  );
}
