// app/docs/providers/gcp/page.tsx

import DocsContent from "../../../../components/DocsContent";

export const metadata = {
  title: "Google Cloud (GCP) Provider – DevVelocity Docs",
  description:
    "Deploy enterprise-grade GCP Compute Engine images with hardened security, optimized performance, and automated DevVelocity pipelines.",
};

export default function GCPProviderPage() {
  return (
    <DocsContent>
      <h1>Google Cloud Provider</h1>

      <p>
        DevVelocity provides hardened, enterprise-grade machine images optimized
        for Google Cloud Compute Engine (GCE). Each image is preconfigured for
        high performance and secure-by-default operation inside GCP.
      </p>

      <h2>Supported Regions</h2>
      <p>Images are replicated globally for low-latency multi-region deployment.</p>

      <ul>
        <li>us-central1 (Iowa)</li>
        <li>us-east1 (South Carolina)</li>
        <li>us-east4 (Northern Virginia)</li>
        <li>us-west1 (Oregon)</li>
        <li>europe-west1 (Belgium)</li>
        <li>europe-west4 (Netherlands)</li>
        <li>asia-southeast1 (Singapore)</li>
      </ul>

      <h2>Image Architecture</h2>
      <p>All GCP images follow DevVelocity’s enterprise baseline:</p>
      <ul>
        <li>Optimized for Google Compute Engine KVM</li>
        <li>gVNIC + VirtIO drivers preinstalled</li>
        <li>Startup scripts via cloud-init</li>
        <li>Google Ops Agent preinstalled</li>
        <li>Automatic patching enabled</li>
        <li>CIS-inspired hardened security baseline</li>
      </ul>

      <h2>Deployment Methods</h2>

      <h3>1. Google Cloud Console</h3>
      <ol>
        <li>Open <strong>Compute Engine → VM Instances</strong></li>
        <li>Click <strong>Create Instance</strong></li>
        <li>Select <strong>Custom Image</strong></li>
        <li>Choose the DevVelocity image from your project or shared library</li>
      </ol>

      <h3>2. gcloud CLI</h3>
      <pre>
        <code>
{`gcloud compute instances create devvelocity-vm \\
  --zone=us-central1-a \\
  --machine-type=e2-standard-2 \\
  --image=devvelocity-image \\
  --image-project=my-project`}
        </code>
      </pre>

      <h3>3. Terraform</h3>
      <pre>
        <code>
{`resource "google_compute_instance" "devvelocity" {
  name         = "devvelocity-vm"
  machine_type = "e2-standard-2"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "projects/<project>/global/images/<devvelocity-image>"
    }
  }

  network_interface {
    network = "default"
    access_config {}
  }
}`}
        </code>
      </pre>

      <h2>Networking Best Practices</h2>
      <ul>
        <li>Use VPC Service Controls for boundary security</li>
        <li>Apply Firewall Rules restricting SSH/RDP</li>
        <li>Prefer Cloud NAT + Private Google Access</li>
        <li>Enable HTTPS load balancing for all public apps</li>
      </ul>

      <h2>Monitoring & Logging</h2>
      <p>Every image includes GCP-native monitoring:</p>

      <ul>
        <li>Ops Agent (logging + metrics)</li>
        <li>Cloud Logging integration</li>
        <li>Cloud Monitoring dashboards</li>
        <li>Automatic serial console logs</li>
      </ul>

      <h2>Recommended Machine Types</h2>
      <ul>
        <li><strong>e2-standard</strong> — cost efficient baseline</li>
        <li><strong>n2-standard</strong> — 365+ MB/s I/O throughput</li>
        <li><strong>c2-standard</strong> — CPU-optimized builds</li>
        <li><strong>t2d-standard</strong> — AMD-based performance/value</li>
      </ul>

      <h2>Security Enhancements</h2>
      <ul>
        <li>IP forwarding disabled</li>
        <li>SSH root login disabled</li>
        <li>Login via OS Login + IAM recommended</li>
        <li>Hardened SSH, sudo, sysctl, journald policies</li>
        <li>Kernel hardening enabled</li>
      </ul>

      <h2>Next Steps</h2>
      <p>
        Visit your <strong>/dashboard</strong> to deploy GCP images using your
        subscription tier. Automated monthly updates and enterprise hardening are
        included for all paid subscriptions.
      </p>
    </DocsContent>
  );
}
