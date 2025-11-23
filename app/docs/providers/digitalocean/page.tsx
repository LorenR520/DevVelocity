// app/docs/providers/digitalocean/page.tsx

import DocsContent from "../../../../components/DocsContent";

export const metadata = {
  title: "DigitalOcean Provider – DevVelocity Docs",
  description:
    "Deploy enterprise-grade DevVelocity Droplet images on DigitalOcean with automatic hardening, cloud-init, and optimized performance.",
};

export default function DigitalOceanPage() {
  return (
    <DocsContent>
      <h1>DigitalOcean Provider</h1>

      <p>
        DevVelocity provides hardened, production-ready base images for
        DigitalOcean Droplets. These images are fully optimized for Droplet
        networking, performance, and cloud-init automation—ideal for startups,
        SMBs, and enterprise teams that depend on simple, scalable infrastructure.
      </p>

      <h2>Supported Regions</h2>
      <p>DevVelocity images are available across all major DigitalOcean regions.</p>

      <ul>
        <li>New York (NYC1, NYC3)</li>
        <li>San Francisco (SFO3)</li>
        <li>Toronto (TOR1)</li>
        <li>Amsterdam (AMS3)</li>
        <li>Frankfurt (FRA1)</li>
        <li>Singapore (SGP1)</li>
        <li>Bangalore (BLR1)</li>
      </ul>

      <h2>Image Features</h2>
      <p>
        Every DigitalOcean image is configured with DevVelocity’s enterprise
        baseline for performance and security:
      </p>

      <ul>
        <li>DigitalOcean cloud-init integration</li>
        <li>DoAgent for metrics + monitoring</li>
        <li>DOSnapshot-friendly filesystem layout</li>
        <li>SSH hardening & disabled root login</li>
        <li>Pre-installed firewall baseline (UFW)</li>
        <li>Automatic security updates enabled</li>
        <li>Optimized kernel parameters for Droplet networking stack</li>
      </ul>

      <h2>Deployment Options</h2>

      <h3>1. DigitalOcean Control Panel</h3>
      <ol>
        <li>Go to <strong>Create → Droplets</strong></li>
        <li>Select <strong>Custom Image</strong></li>
        <li>Choose the DevVelocity image from your library</li>
        <li>Select Droplet size (CPU, RAM, disk)</li>
        <li>Deploy in your desired region</li>
      </ol>

      <h3>2. doctl CLI</h3>
      <pre>
        <code>
{`doctl compute droplet create devvelocity-droplet \\
  --region nyc3 \\
  --size s-2vcpu-4gb \\
  --image devvelocity-image \\
  --enable-monitoring`}
        </code>
      </pre>

      <h3>3. Terraform</h3>
      <pre>
        <code>
{`resource "digitalocean_droplet" "devvelocity" {
  name   = "devvelocity-droplet"
  region = "nyc3"
  size   = "s-2vcpu-4gb"
  image  = "devvelocity-image"

  monitoring = true
}`}
        </code>
      </pre>

      <h2>Recommended Droplet Types</h2>
      <ul>
        <li><strong>Basic</strong> — low-cost workloads</li>
        <li><strong>General Purpose</strong> — balanced CPU + RAM</li>
        <li><strong>CPU-Optimized</strong> — CI/CD pipelines, microservices</li>
        <li><strong>Memory-Optimized</strong> — caching, analytics, JVM workloads</li>
      </ul>

      <h2>Networking Best Practices</h2>
      <ul>
        <li>Enable VPC networking for internal traffic</li>
        <li>Use Cloud Firewalls for zero-trust perimeter</li>
        <li>Disable password authentication (SSH keys only)</li>
        <li>Use Load Balancers for HA architectures</li>
      </ul>

      <h2>Monitoring & Alerting</h2>
      <p>
        DevVelocity images integrate directly with DigitalOcean Monitoring:
      </p>

      <ul>
        <li>CPU, RAM, disk, and network metric collection</li>
        <li>Integrated uptime checks</li>
        <li>alert policies via the DO dashboard</li>
        <li>Automatic logging with systemd journal</li>
      </ul>

      <h2>Security Model</h2>
      <ul>
        <li>SSH root login disabled</li>
        <li>UFW enabled with minimal inbound rules</li>
        <li>Kernel hardening applied</li>
        <li>Automatic unattended upgrades</li>
        <li>Secure cloud-init user provisioning</li>
      </ul>

      <h2>Next Steps</h2>
      <p>
        Deploy images directly from your <strong>/dashboard</strong> using your
        active subscription. All paid tiers include enterprise hardening and
        automatic monthly image updates.
      </p>
    </DocsContent>
  );
}
