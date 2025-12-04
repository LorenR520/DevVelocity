export const dynamic = "force-static";

export default function OCIDocs() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-4xl font-bold mb-6">Oracle Cloud Infrastructure Setup</h1>

      <p className="text-gray-300 mb-10">
        DevVelocity integrates with Oracle Cloud (OCI) to build, replicate, and manage
        custom machine images across compartments, tenancies, and regions using secure
        API keys and IAM policies.
      </p>

      {/* SECTION 1 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">
          1. Create a User for DevVelocity
        </h2>
        <p className="text-gray-400 mb-3">
          Start by creating a dedicated IAM user that DevVelocity will authenticate as:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`oci iam user create --name devvelocity --description "DevVelocity automation user"`}
        </pre>
      </section>

      {/* SECTION 2 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">
          2. Add User to a Group
        </h2>
        <p className="text-gray-400 mb-3">
          OCI permissions are assigned through groups. Create a group and add the user:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`oci iam group create --name devvelocity-group --description "Automation group"

oci iam group add-user \
  --group-id <GROUP_OCID> \
  --user-id <USER_OCID>`}
        </pre>
      </section>

      {/* SECTION 3 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">3. Assign Required Policies</h2>
        <p className="text-gray-400 mb-3">
          Allow the group to manage compute images and buckets:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`allow group devvelocity-group to manage instance-configurations in tenancy
allow group devvelocity-group to manage instance-family in tenancy
allow group devvelocity-group to manage object-family in tenancy`}
        </pre>
      </section>

      {/* SECTION 4 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">
          4. Generate an API Signing Key
        </h2>
        <p className="text-gray-400 mb-3">
          DevVelocity authenticates to OCI using a public/private RSA keypair:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`openssl genrsa -out oci_api_key.pem 2048
openssl rsa -pubout -in oci_api_key.pem -out oci_api_key_public.pem`}
        </pre>

        <p className="text-gray-400 mt-3">
          Upload the public key to the user's API keys in the OCI Console.
        </p>
      </section>

      {/* SECTION 5 */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-3">
          5. Connect OCI to DevVelocity
        </h2>
        <p className="text-gray-400 mb-3">
          Finally, configure the provider using your tenancy, region, and user details:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`devvelocity configure oci \
  --tenancy <TENANCY_OCID> \
  --user <USER_OCID> \
  --fingerprint <PUBLIC_KEY_FINGERPRINT> \
  --key-file ./oci_api_key.pem \
  --region us-ashburn-1`}
        </pre>
      </section>

      {/* FOOTER NAV */}
      <div className="border-t border-neutral-800 pt-8 flex justify-between text-sm">
        <a href="/docs/providers/gcp" className="text-gray-400 hover:text-white transition">
          ← GCP Setup
        </a>

        <a href="/docs/providers/linode" className="text-blue-500 hover:underline">
          Linode Setup →
        </a>
      </div>
    </div>
  );
}
