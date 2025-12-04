export const dynamic = "force-static";

export default function InstallationDocs() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-4xl font-bold mb-6">Installation Guide</h1>

      <p className="text-gray-300 mb-10">
        Start using DevVelocity by configuring your project, connecting your cloud
        providers, and enabling automated build pipelines.
      </p>

      {/* SECTION 1 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">1. Install DevVelocity CLI</h2>
        <p className="text-gray-400 mb-3">
          Install the DevVelocity command-line interface to initialize builds and
          templates locally:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`npm install -g devvelocity-cli`}
        </pre>
      </section>

      {/* SECTION 2 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">2. Configure Your Providers</h2>
        <p className="text-gray-400 mb-3">
          DevVelocity works across AWS, Azure, GCP, OCI, Linode, DigitalOcean
          and Vultr. Provider credentials are stored securely using Key Vaults
          or external secrets.
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`devvelocity configure`}
        </pre>
      </section>

      {/* SECTION 3 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">3. Initialize a Template</h2>
        <p className="text-gray-400 mb-3">
          Templates define how images are built, validated, and signed.
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`devvelocity template init --provider aws`}
        </pre>
      </section>

      {/* SECTION 4 */}
      <section className="mb-20">
        <h2 className="text-2xl font-semibold mb-3">4. Launch Your First Build</h2>
        <p className="text-gray-400 mb-3">
          Once configured, trigger your first automated multi-cloud build:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`devvelocity build --all-providers`}
        </pre>
      </section>

      {/* FOOTER NAV */}
      <div className="border-t border-neutral-800 pt-8 flex justify-between text-sm">
        <a href="/docs" className="text-gray-400 hover:text-white transition">
          ← Back to Docs
        </a>

        <a href="/docs/usage" className="text-blue-500 hover:underline">
          Continue to Usage →
        </a>
      </div>
    </div>
  );
}
