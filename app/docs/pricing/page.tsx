export default function Pricing() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Pricing</h1>

      <p className="opacity-70 mb-6">
        Choose a DevVelocity subscription tier based on your workflow, team size,
        and required image automation features. Pricing is transparent and simple.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Starter Tier</h2>
      <ul className="list-disc ml-6 opacity-80 space-y-1">
        <li>Basic image deployment scripts</li>
        <li>Up to 5 automated builds per month</li>
        <li>Email support</li>
        <li>$9.99 / month</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Developer Tier</h2>
      <ul className="list-disc ml-6 opacity-80 space-y-1">
        <li>All Starter features</li>
        <li>Multi-cloud automation support</li>
        <li>Unlimited build history</li>
        <li>Priority support</li>
        <li>$29.99 / month</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Enterprise Tier</h2>
      <ul className="list-disc ml-6 opacity-80 space-y-1">
        <li>Unlimited automated builds</li>
        <li>Advanced analytics dashboard</li>
        <li>Dedicated success engineer</li>
        <li>Custom integrations</li>
        <li>$199+ / month</li>
      </ul>
    </div>
  );
}
