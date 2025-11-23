// app/docs/providers/linode/page.tsx

import DocsContent from "../../../../components/DocsContent";

export const metadata = {
  title: "Linode Provider – DevVelocity Docs",
  description:
    "Deploy optimized DevVelocity images on Linode with cloud-init support, hardened security, and performance tuning for compute, storage, and networking.",
};

export default function LinodePage() {
  return (
    <DocsContent>
      <h1>Linode Provider</h1>

      <p>
        DevVelocity provides fully optimized, hardened base images for Linode’s
        compute platform. These images are engineered for predictable
        performance, robust security, and seamless automation using Linode’s
        cloud-init integration.
      </p>

      <h2>Supported Regions</h2>
      <p>DevVelocity images are deployable in all Linode global data centers:</p>

      <ul>
        <li>Newark (US)</li>
        <li>Dallas (US)</li>
        <li>Atlanta (US)</li>
        <li>Fremont (US)</li>
        <li>Toronto (CA)</li>
        <li>Frankfurt (DE)</li>
        <li>London (UK)</li>
        <li>Tokyo (JP)</li>
        <li>Sydney (AU)</li>
        <li>Mumbai (IN)</li>
      </ul>

      <h2>Image Features</h2>
      <p>
        Each DevVelocity Linode image ships with a hardened and performance-tuned
        baseline optimized for the Linode environment:
      </p>

      <ul>
        <li>Full cloud-init support via Linode StackScripts</li>
        <li>Automatic security patches and kernel updates</li>
        <li>SSH key–only access (password login disabled)</li>
        <li>Optimized CPU scheduler and disk I/O settings</li>
        <li>Firewall defaults using UFW</li>
        <li>Fail2ban preconfigured</li>
        <li>Systemd tweaks for long-running services</li>
      </ul>

      <h2>Deployment Options</h2>

      <h3>1. Linode Cloud Manager</h3>
      <ol>
        <li>Go to <strong>Create → Linode</strong></li>
        <li>Select <strong>Custom Image</strong></li>
        <li>Choose the DevVelocity image from your Image Library</li>
        <li>Select a plan (Shared, Dedicated, Premium CPU, or GPU)</li>
        <li>Deploy in your preferred region</li>
      </ol>

      <h3>2. Linode CLI</h3>
      <pre>
        <code>
{`linode-cli linodes create \\
  --image devvelocity-image \\
  --region us-east \\
  --type g6-standard-2 \\
  --root_pass "CHANGEME"`}
        </code>
      </pre>

      <h3>3. Terraform</h3>
      <pre>
        <code>
{`resource "linode_instance" "devvelocity" {
  label  = "devvelocity-linode"
  region = "us-east"
  type   = "g6-standard-2"
  image  = "devvelocity-image"
}`}
        </code>
      </pre>

      <h2>Recommended Linode Types</h2>
      <ul>
        <li><strong>Shared CPU</strong> — low-traffic apps, staging, prototypes</li>
        <li><strong>Dedicated CPU</strong> — production APIs & microservices</li>
        <li><strong>Premium CPU</strong> — high-frequency workloads</li>
        <li><strong>High Memory</strong> — databases, caching, analytics</li>
        <li><strong>GPU</strong> — ML inference & rendering workloads</li>
      </ul>

      <h2>Networking Best Practices</h2>
      <ul>
        <li>Enable VLANs for private networking and segmentation</li>
        <li>Use Linode Firewalls to restrict inbound traffic</li>
        <li>Activate Backups or LKE Node Auto-repair where applicable</li>
        <li>Use Longview for system analytics</li>
      </ul>

      <h2>Monitoring & Alerting</h2>
      <p>
        DevVelocity images work seamlessly with Linode’s built-in observability:
      </p>

      <ul>
        <li>CPU, RAM, disk, and network metrics</li>
        <li>Longview analytics suite</li>
        <li>Email & webhook alerting</li>
        <li>System logs integrated with journald</li>
      </ul>

      <h2>Security Model</h2>
      <ul>
        <li>Root login disabled</li>
        <li>SSH key authentication only</li>
        <li>UFW minimal inbound rules</li>
        <li>Fail2ban with aggressive profiles</li>
        <li>Kernel and package security updates enabled</li>
      </ul>

      <h2>Next Steps</h2>
      <p>
        You can deploy Linode images directly from the DevVelocity dashboard once
        subscribed. Enterprise and Professional tiers include monthly image
        refreshes, security hardening, and priority updates.
      </p>
    </DocsContent>
  );
}
