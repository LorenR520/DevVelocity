export const dynamic = "force-static";

export default function DigitalOceanDocs() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-4xl font-bold mb-6">DigitalOcean Setup</h1>

      <p className="text-gray-300 mb-10">
        DevVelocity builds optimized, hardened images for DigitalOcean Droplets.
        These images integrate with DigitalOcean cloud-init, security defaults,
        networking stack, and monitoring ecosystem—perfect for startups,
        fast-moving teams, and enterprise workloads that prefer DO simplicity.
      </p>

      {/* REGION SECTION */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">Supported Regions</h2>
        <p className="text-gray-400 mb-3">
          DevVelocity images are replicated globally across all major DO regions:
        </p>

        <ul className="list-disc list-inside text-gray-400 space-y-1">
          <li>New York (NYC1, NYC3)</li>
          <li>San Francisco (SFO3)</li>
          <li>Toronto (TOR1)</li>
          <li>Amsterdam (AMS3)</li>
          <li>Frankfurt (FRA1)</li>
          <li>Singapore (SGP1)</li>
          <li>Bangalore (BLR1)</li>
        </ul>
      </section>

      {/* FEATURES SECTION */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">Image Features</h2>
        <p className="text-gray-400 mb-3">
          All DevVelocity DigitalOcean images include production-grade
          performance and security controls:
        </p>

        <ul className="list-disc list-inside text-gray-400 space-y-1">
          <li>cloud-init integration with DO metadata</li>
          <li>DoAgent for metrics + monitoring</li>
          <li>DOSnapshot-friendly filesystem layout</li>
          <li>SSH hardening + root login disabled</li>
          <li>UFW enabled with a minimal inbound policy</li>
          <li>Automatic security upgrades enabled</li>
          <li>Optimized kernel parameters for Droplet networking</li>
        </ul>
      </section>

      {/* DEPLOYMENT SECTION */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">Deployment Options</h2>

        <h3 className="text-xl font-semibold mt-4 mb-2">
          1. DigitalOcean Control Panel
        </h3>
        <ol className="list-decimal list-inside text-gray-400 space-y-1">
          <li>Navigate to <strong>Create → Droplets</strong></li>
          <li>Select <strong>Custom Image</strong></li>
          <li>Choose your DevVelocity image</li>
          <li>Select Droplet size</li>
          <li>Deploy in the region of your choice</li>
        </ol>

        <h3 className="text-xl font-semibold mt-6 mb-2">2. doctl CLI</h3>
        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`doctl compute droplet create devvelocity-droplet \\
  --region nyc3 \\
  --size s-2vcpu-4gb \\
  --image devvelocity-image \\
  --enable-monitoring`}
        </pre>

        <h3 className="text-xl font-semibold mt-6 mb-2">3. Terraform</h3>
        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`resource "digitalocean_droplet" "devvelocity" {
  name       = "devvelocity-droplet"
  region     = "nyc3"
  size       = "s-2vcpu-4gb"
  image      = "devvelocity-image"
  monitoring = true
}`}
        </pre>
      </section>

      {/* DROPLET TYPES */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">Recommended Droplet Types</h2>

        <ul className="list-disc list-inside text-gray-400 space-y-1">
          <li><strong>Basic</strong> — budget Linux workloads, basic apps</li>
          <li><strong>General Purpose</strong> — balanced CPU + RAM</li>
          <li><strong>CPU-Optimized</strong> — CI/CD, compute services</li>
          <li><strong>Memory-Optimized</strong> — analytics, caching, JVM</li>
        </ul>
      </section>

      {/* NETWORKING */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">Networking Best Practices</h2>

        <ul className="list-disc list-inside text-gray-400 space-y-1">
          <li>Enable VPC networking for private east-west traffic</li>
          <li>Use Cloud Firewalls for a zero-trust perimeter</li>
          <li>Disable password login (SSH-keys only)</li>
          <li>Use DO Load Balancers for HA deployments</li>
        </ul>
      </section>

      {/* MONITORING */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">Monitoring & Alerting</h2>

        <p className="text-gray-400 mb-3">
          DevVelocity images integrate cleanly with DigitalOcean Monitoring:
        </p>

        <ul className="list-disc list-inside text-gray-400 space-y-1">
          <li>CPU, RAM, network, and disk metrics via DoAgent</li>
          <li>Built-in uptime checks</li>
          <li>Alert policies directly in DO Dashboard</li>
          <li>Systemd-based structured logging</li>
        </ul>
      </section>

      {/* SECURITY */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">Security Model</h2>

        <ul className="list-disc list-inside text-gray-400 space-y-1">
          <li>SSH root login disabled</li>
          <li>UFW enabled with minimal inbound access</li>
          <li>Kernel hardening applied</li>
          <li>Unattended security upgrades enabled</li>
          <li>Secure user provisioning through cloud-init</li>
        </ul>
      </section>

      {/* NEXT STEPS */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Next Steps</h2>
        <p className="text-gray-400 mb-3">
          Deploy DigitalOcean images directly from your{" "}
          <strong>/dashboard</strong> once your subscription is active.
          All paid tiers include monthly image updates and enterprise
          security hardening.
        </p>
      </section>

      {/* FOOTER NAV */}
      <div className="border-t border-neutral-800 pt-8 flex justify-between text-sm mt-16">
        <a
          href="/docs/providers/oci"
          className="text-gray-400 hover:text-white transition"
        >
          ← OCI Setup
        </a>

        <a
          href="/docs/providers/linode"
          className="text-blue-500 hover:underline"
        >
          Linode Setup →
        </a>
      </div>
    </div>
  );
}
