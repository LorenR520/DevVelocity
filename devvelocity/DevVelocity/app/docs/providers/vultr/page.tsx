export const dynamic = "force-static";

export default function VultrDocs() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-4xl font-bold mb-6">Vultr Setup</h1>

      <p className="text-gray-300 mb-10">
        DevVelocity integrates with Vultr to build and publish custom ISO and snapshot
        images globally. Vultr’s Object Storage and Image API make it simple to automate
        provisioning through DevVelocity pipelines.
      </p>

      {/* SECTION 1 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">1. Generate an API Key</h2>
        <p className="text-gray-400 mb-3">
          DevVelocity authenticates using a Vultr API key with full access to Images,
          Snapshots, and Object Storage.
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`Vultr Console → Account → API → Generate API Key`}
        </pre>
      </section>

      {/* SECTION 2 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">2. Enable Vultr Object Storage</h2>
        <p className="text-gray-400 mb-3">
          DevVelocity uploads build artifacts into your Vultr Object Storage bucket
          before converting them into deployable images.
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`vultr-cli object-storage create devvelocity-builds --location ewr`}
        </pre>
      </section>

      {/* SECTION 3 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">
          3. Confirm Required Permissions
        </h2>
        <p className="text-gray-400 mb-3">The API key must include:</p>

        <ul className="list-disc list-inside text-gray-400 space-y-1">
          <li>Snapshots: Read/Write</li>
          <li>Images: Read/Write</li>
          <li>Instances: Read/Write</li>
          <li>Object Storage: Read/Write</li>
        </ul>
      </section>

      {/* SECTION 4 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">
          4. Connect Vultr to DevVelocity
        </h2>

        <p className="text-gray-400 mb-3">
          Provide your API Key and preferred deployment region:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`devvelocity configure vultr \
  --api-key <VULTR_API_KEY> \
  --region ewr`}
        </pre>
      </section>

      {/* SECTION 5 */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-3">
          5. Launch Your First Vultr Build
        </h2>

        <p className="text-gray-400 mb-3">
          Start a DevVelocity build that includes Vultr:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`devvelocity build --provider vultr`}
        </pre>
      </section>

      {/* FOOTER NAV */}
      <div className="border-t border-neutral-800 pt-8 flex justify-between text-sm">
        <a
          href="/docs/providers/linode"
          className="text-gray-400 hover:text-white transition"
        >
          ← Linode Setup
        </a>

        <a
          href="/docs/pricing"
          className="text-blue-500 hover:underline"
        >
          Pricing →
        </a>
      </div>
    </div>
  );
}
