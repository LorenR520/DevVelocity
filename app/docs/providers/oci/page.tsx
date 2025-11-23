// app/docs/providers/oci/page.tsx

import DocsContent from "../../../../components/DocsContent";

export const metadata = {
  title: "OCI Provider – DevVelocity Docs",
  description:
    "Deploy optimized DevVelocity images on Oracle Cloud Infrastructure with hardened security, cloud-init automation, and high-performance compute tuning.",
};

export default function OCIPage() {
  return (
    <DocsContent>
      <h1>Oracle Cloud (OCI) Provider</h1>

      <p>
        DevVelocity provides optimized, production-ready base images for Oracle
        Cloud Infrastructure (OCI). These images are engineered for high-performance
        compute, hardened security, and seamless automation through native
        cloud-init and OCI Instance Configuration workflows.
      </p>

      <h2>Supported Regions</h2>
      <p>DevVelocity images deploy on all major OCI regions, including:</p>

      <ul>
        <li>US East (Ashburn)</li>
        <li>US West (Phoenix)</li>
        <li>Canada Southeast (Toronto)</li>
        <li>Germany Central (Frankfurt)</li>
        <li>UK South (London)</li>
        <li>Japan Central (Tokyo)</li>
        <li>India West (Mumbai)</li>
        <li>Australia East (Sydney)</li>
        <li>Brazil East (São Paulo)</li>
      </ul>

      <h2>Image Features</h2>
      <p>Every DevVelocity OCI image includes:</p>

      <ul>
        <li>Full cloud-init support for automated provisioning</li>
        <li>Default hardened security profile</li>
        <li>SSH key–only access (password login disabled)</li>
        <li>Optimized for Ampere ARM and x86 shapes</li>
        <li>Firewall defaults using iptables + UFW</li>
        <li>Fail2ban intrusion detection enabled</li>
        <li>System/kernel tuning for high-throughput workloads</li>
        <li>Tuned block volume performance settings</li>
      </ul>

      <h2>Deployment Options</h2>

      <h3>1. OCI Console</h3>
      <ol>
        <li>Go to <strong>Create → Compute Instance</strong></li>
        <li>Select <strong>Custom Image</strong></li>
        <li>Choose your imported DevVelocity image</li>
        <li>Select shape (AMPERE A1, E4, E5, Standard, Dense-IO, etc.)</li>
        <li>Attach your SSH key</li>
        <li>Deploy</li>
      </ol>

      <h3>2. OCI CLI</h3>
      <pre>
        <code>
{`oci compute instance launch \\
  --image-id <devvelocity-image-ocid> \\
  --shape VM.Standard.E5.Flex \\
  --ocpu-count 2 \\
  --memory-in-gbs 16 \\
  --subnet-id <subnet-ocid> \\
  --assign-public-ip true`}
        </code>
      </pre>

      <h3>3. Terraform</h3>
      <pre>
        <code>
{`resource "oci_core_instance" "devvelocity" {
  availability_domain = "Uocm:PHX-AD-1"
  compartment_id      = var.compartment_id
  shape               = "VM.Standard.E5.Flex"

  shape_config {
    ocpus         = 2
    memory_in_gbs = 16
  }

  source_details {
    source_type = "image"
    image_id    = var.devvelocity_image_ocid
  }

  display_name = "devvelocity-oci"
}`}
        </code>
      </pre>

      <h2>Recommended OCI Shapes</h2>
      <ul>
        <li>
          <strong>Ampere A1 ARM</strong> — high-efficiency workloads, APIs,
          microservices (free tier eligible)
        </li>
        <li>
          <strong>E5 Flex</strong> — balanced x86 production workloads
        </li>
        <li>
          <strong>E4 Flex</strong> — cost-optimized compute
        </li>
        <li>
          <strong>Dense I/O Shapes</strong> — DB, Elasticsearch, Kafka
        </li>
        <li>
          <strong>GPU Shapes</strong> — ML, inference, rendering
        </li>
      </ul>

      <h2>Networking Best Practices</h2>
      <ul>
        <li>Create a dedicated VCN for production workloads</li>
        <li>Restrict ingress rules to only required ports</li>
        <li>Use Network Security Groups for service-level isolation</li>
        <li>Enable OCI Cloud Guard for threat detection</li>
        <li>Use Bastion Service for administrative access</li>
      </ul>

      <h2>Monitoring & Observability</h2>
      <p>
        DevVelocity images integrate cleanly with OCI Observability and
        Management:
      </p>

      <ul>
        <li>OCI Metrics (compute, network, disk)</li>
        <li>Logging service with journald ingestion</li>
        <li>Alarm rules and notifications</li>
        <li>OS Management Service for patch automation</li>
      </ul>

      <h2>Security Model</h2>
      <ul>
        <li>SSH key access only</li>
        <li>Root login disabled</li>
        <li>UFW with minimal inbound rules</li>
        <li>Fail2ban aggressive jail profiles</li>
        <li>Automatic kernel + package security updates</li>
      </ul>

      <h2>Next Steps</h2>
      <p>
        Once subscribed through your DevVelocity dashboard, OCI images can be
        imported and deployed instantly using the OCI Console, CLI, or
        Terraform.
      </p>
    </DocsContent>
  );
}
