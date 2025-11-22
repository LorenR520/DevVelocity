export default function Pricing() {
  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Pricing Overview</h1>

      <p className="opacity-80 mb-4">
        DevVelocity offers flexible, plan-based pricing across all image tiers.
      </p>

      <h2 className="text-2xl font-semibold mb-2">Image Tiers</h2>
      <ul className="list-disc ml-6 space-y-2 mb-6">
        <li><strong>Sandbox:</strong> ideal for testing</li>
        <li><strong>Developer:</strong> optimized for daily workloads</li>
        <li><strong>Enterprise:</strong> hardened builds with security modules</li>
      </ul>

      <p className="opacity-70">
        Prices vary per cloud provider depending on compute and storage requirements.
      </p>
    </div>
  );
}
