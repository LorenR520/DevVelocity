export const dynamic = "force-static";

export default function AzureDocs() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-4xl font-bold mb-6">Azure Provider Setup</h1>

      <p className="text-gray-300 mb-10">
        DevVelocity integrates with Microsoft Azure to build, distribute, and
        automatically version managed VM images across your subscriptions and
        regions.
      </p>

      {/* SECTION 1 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">1. Register an App in Azure AD</h2>
        <p className="text-gray-400 mb-3">
          Create an Azure Active Directory application to authorize DevVelocity:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`Azure Portal → Azure Active Directory → App Registrations → New Registration`}
        </pre>
      </section>

      {/* SECTION 2 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">2. Create a Client Secret</h2>
        <p className="text-gray-400 mb-3">
          Generate a client secret for your registered application:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`Azure Portal → App → Certificates & Secrets → New Client Secret`}
        </pre>
      </section>

      {/* SECTION 3 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">3. Assign Image Permissions</h2>
        <p className="text-gray-400 mb-3">
          Give the service principal access to manage Compute Gallery images:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`Azure Portal → Subscriptions → IAM → Add Role Assignment:
• Contributor
• or: Virtual Machine Contributor + Managed Identity Operator`}
        </pre>
      </section>

      {/* SECTION 4 */}
      <section className="mb-20">
        <h2 className="text-2xl font-semibold mb-3">4. Connect Azure to DevVelocity</h2>
        <p className="text-gray-400 mb-3">
          Use the Azure CLI-style DevVelocity setup command:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`devvelocity configure azure \
  --tenant <TENANT_ID> \
  --client-id <APP_ID> \
  --client-secret <CLIENT_SECRET> \
  --subscription <SUBSCRIPTION_ID>`}
        </pre>
      </section>

      {/* FOOTER NAV */}
      <div className="border-t border-neutral-800 pt-8 flex justify-between text-sm">
        <a href="/docs/providers/aws" className="text-gray-400 hover:text-white transition">
          ← AWS Setup
        </a>

        <a href="/docs/providers/gcp" className="text-blue-500 hover:underline">
          GCP Setup →
        </a>
      </div>
    </div>
  );
}
