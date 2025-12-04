export const dynamic = "force-static";

export default function LinodeDocs() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-4xl font-bold mb-6">Linode (Akamai Cloud) Setup</h1>

      <p className="text-gray-300 mb-10">
        DevVelocity integrates with Linode to build, store, and distribute custom
        machine images across Linode regions using secure API tokens and upload
        endpoints.
      </p>

      {/* SECTION 1 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">1. Create a Personal Access Token</h2>
        <p className="text-gray-400 mb-3">
          DevVelocity authenticates with Linode using a Personal Access Token (PAT).
          Create one with <strong>Read/Write</strong> permissions for Images, Linodes,
          and Object Storage.
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`Linode Console → Profile → API Tokens → Create Token`}
        </pre>
      </section>

      {/* SECTION 2 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">2. Enable Object Storage</h2>
        <p className="text-gray-400 mb-3">
          DevVelocity uses Object Storage to upload raw image artifacts before they
          are converted into deployable Linode Images.
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`linode-cli obj buckets create devvelocity-builds --cluster us-ord-1`}
        </pre>
      </section>

      {/* SECTION 3 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">
          3. Confirm Required Permissions
        </h2>
        <p className="text-gray-400 mb-3">
          The token must allow DevVelocity to upload, create, and delete images:
        </p>

        <ul className="list-disc list-inside text-gray-400 space-y-1">
          <li>Images: Read/Write</li>
          <li>Object Storage: Read/Write</li>
          <li>Linodes: Read/Write</li>
          <li>Account: Read</li>
        </ul>
      </section>

      {/* SECTION 4 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">
          4. Connect Linode to DevVelocity
        </h2>
        <p className="text-gray-400 mb-3">
          Use your token and preferred region (e.g., <code>us-ord</code>):
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`devvelocity configure linode \
  --token <LINODE_API_TOKEN> \
  --region us-ord`}
        </pre>
      </section>

      {/* SECTION 5 */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-3">5. Launch Your First Linode Image Build</h2>
        <p className="text-gray-400 mb-3">
          Trigger a multi-cloud build that includes Linode:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`devvelocity build --provider linode`}
        </pre>
      </section>

      {/* FOOTER NAV */}
      <div className="border-t border-neutral-800 pt-8 flex justify-between text-sm">
        <a
          href="/docs/providers/oci"
          className="text-gray-400 hover:text-white transition"
        >
          ← OCI Setup
        </a>

        <a
          href="/docs/providers/vultr"
          className="text-blue-500 hover:underline"
        >
          Vultr Setup →
        </a>
      </div>
    </div>
  );
}
