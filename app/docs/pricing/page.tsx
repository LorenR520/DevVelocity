export const metadata = {
  title: "Pricing – DevVelocity",
};

export default function PricingPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-6">
      <h1 className="text-3xl font-bold mb-6">Pricing</h1>

      <p className="text-gray-600 dark:text-gray-300 mb-12">
        Choose a DevVelocity subscription tier based on your workflow, team
        size, and image automation needs.
      </p>

      <section className="space-y-10">
        <div>
          <h2 className="text-xl font-semibold mb-2">Starter Tier</h2>
          <ul className="list-disc ml-6 text-gray-600 dark:text-gray-300">
            <li>Basic enterprise images</li>
            <li>Up to 5 automated builds per month</li>
            <li>$9.99 / month</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Developer Tier</h2>
          <ul className="list-disc ml-6 text-gray-600 dark:text-gray-300">
            <li>All Starter features</li>
            <li>Multi-cloud automation</li>
            <li>Unlimited build history</li>
            <li>$29.99 / month</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Enterprise Tier</h2>
          <ul className="list-disc ml-6 text-gray-600 dark:text-gray-300">
            <li>Unlimited builds</li>
            <li>Hardened enterprise images</li>
            <li>Custom integrations</li>
            <li>$199+ / month</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
