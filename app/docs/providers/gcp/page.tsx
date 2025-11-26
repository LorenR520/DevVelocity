export const dynamic = "force-static";

export default function GCPDocs() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-4xl font-bold mb-6">Google Cloud Provider Setup</h1>

      <p className="text-gray-300 mb-10">
        DevVelocity integrates with Google Cloud to build, replicate, and manage
        Compute Engine images across any region or project using service accounts
        and IAM permissions.
      </p>

      {/* SECTION 1 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">1. Create a Service Account</h2>
        <p className="text-gray-400 mb-3">
          DevVelocity authenticates to Google Cloud through a dedicated service account:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`gcloud iam service-accounts create devvelocity \
  --description="DevVelocity automation" \
  --display-name="devvelocity"`}          
        </pre>
      </section>

      {/* SECTION 2 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">2. Grant Required Roles</h2>
        <p className="text-gray-400 mb-3">
          Apply the minimum roles needed for image operations:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:devvelocity@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/compute.admin"`}          
        </pre>

        <p className="text-gray-400 mt-3">
          Optional for Storage-based template builds:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`roles/storage.admin
roles/iam.serviceAccountUser`}          
        </pre>
      </section>

      {/* SECTION 3 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">3. Generate a JSON Key</h2>
        <p className="text-gray-400 mb-3">
          Download a service account key and store it securely for DevVelocity:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`gcloud iam service-accounts keys create key.json \
  --iam-account=devvelocity@<PROJECT_ID>.iam.gserviceaccount.com`}
        </pre>
      </section>

      {/* SECTION 4 */}
      <section className="mb-20">
        <h2 className="text-2xl font-semibold mb-3">4. Connect GCP to DevVelocity</h2>
        <p className="text-gray-400 mb-3">
          Import the JSON key and configure the DevVelocity provider:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`devvelocity configure gcp \
  --project <PROJECT_ID> \
  --key-file ./key.json`}
        </pre>
      </section>

      {/* FOOTER NAV */}
      <div className="border-t border-neutral-800 pt-8 flex justify-between text-sm">
        <a href="/docs/providers/azure" className="text-gray-400 hover:text-white transition">
          ← Azure Setup
        </a>

        <a href="/docs/providers/oci" className="text-blue-500 hover:underline">
          OCI Setup →
        </a>
      </div>
    </div>
  );
}
