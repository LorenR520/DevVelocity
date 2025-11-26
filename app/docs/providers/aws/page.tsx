export const dynamic = "force-static";

export default function AwsDocs() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-4xl font-bold mb-6">AWS Provider Setup</h1>

      <p className="text-gray-300 mb-10">
        DevVelocity integrates directly with Amazon Web Services to build,
        validate, and publish AMIs automatically into your AWS environments.
      </p>

      {/* SECTION 1 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">1. Create an IAM User</h2>
        <p className="text-gray-400 mb-3">
          Create a dedicated IAM user or role for DevVelocity. Assign it the
          following minimal set of permissions:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`ec2:CreateImage
ec2:RegisterImage
ec2:CreateTags
ec2:CopyImage
ec2:DescribeImages
ec2:DescribeInstances`}
        </pre>
      </section>

      {/* SECTION 2 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">2. Create an Access Key</h2>
        <p className="text-gray-400 mb-3">
          Generate an Access Key for the dedicated DevVelocity IAM user:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`AWS → IAM → Users → Security Credentials → Create Access Key`}
        </pre>
      </section>

      {/* SECTION 3 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">3. Connect AWS to DevVelocity</h2>
        <p className="text-gray-400 mb-3">
          Authenticate your AWS account inside DevVelocity using:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`devvelocity configure aws \
  --access-key <ACCESS_KEY> \
  --secret-key <SECRET_KEY> \
  --region us-east-1`}
        </pre>
      </section>

      {/* SECTION 4 */}
      <section className="mb-20">
        <h2 className="text-2xl font-semibold mb-3">4. Run an AWS Build</h2>
        <p className="text-gray-400 mb-3">
          After setup, run your first AWS-specific image build:
        </p>

        <pre className="bg-black/60 border border-neutral-800 p-4 rounded-lg text-sm overflow-x-auto">
{`devvelocity build --provider aws`}
        </pre>
      </section>

      {/* FOOTER NAV */}
      <div className="border-t border-neutral-800 pt-8 flex justify-between text-sm">
        <a href="/docs/providers" className="text-gray-400 hover:text-white transition">
          ← All Providers
        </a>

        <a href="/docs/providers/azure" className="text-blue-500 hover:underline">
          Azure Setup →
        </a>
      </div>
    </div>
  );
}// app/docs/providers/aws/page.tsx

import DocsContent from "../../../../components/DocsContent";

export const metadata = {
  title: "AWS Provider – DevVelocity Docs",
  description: "Deploy hardened, enterprise-grade AWS AMIs using DevVelocity cloud images.",
};

export default function AWSProviderPage() {
  return (
    <DocsContent>
      <h1>AWS Provider</h1>

      <p>
        DevVelocity provides fully-optimized, enterprise-grade AMIs built for 
        security, performance, and reliability. These images integrate seamlessly 
        with Amazon EC2, IAM, VPC, and EBS services.
      </p>

      <h2>Supported AWS Regions</h2>
      <p>
        All DevVelocity AMIs are replicated across major AWS regions for global 
        availability and low-latency deployments.
      </p>

      <ul>
        <li>us-east-1 (N. Virginia)</li>
        <li>us-west-2 (Oregon)</li>
        <li>eu-west-1 (Ireland)</li>
        <li>ap-southeast-1 (Singapore)</li>
        <li>ap-northeast-1 (Tokyo)</li>
      </ul>

      <h2>Image Architecture</h2>
      <p>
        AWS images follow DevVelocity’s hardened enterprise baseline:
      </p>

      <ul>
        <li>Kernel-level security enhancements</li>
        <li>Optimized storage drivers for EBS</li>
        <li>Cloud-init support for auto-provisioning</li>
        <li>Systemd-based service orchestration</li>
        <li>FIPS-aligned crypto configurations</li>
      </ul>

      <h2>Deployment Methods</h2>

      <h3>1. AWS Console</h3>
      <ol>
        <li>Open EC2 → AMIs</li>
        <li>Select &quot;Private Images&quot;</li>
        <li>Launch DevVelocity AMI</li>
      </ol>

      <h3>2. AWS CLI</h3>
      <pre>
        <code>
{`aws ec2 run-instances \
  --image-id ami-xxxxxx \
  --instance-type t3.medium \
  --key-name myKey \
  --security-group-ids sg-xxxxxx \
  --subnet-id subnet-xxxxxx`}
        </code>
      </pre>

      <h3>3. Terraform</h3>
      <pre>
        <code>
{`resource "aws_instance" "devvelocity" {
  ami           = "ami-xxxxxx"
  instance_type = "t3.medium"
}`}
        </code>
      </pre>

      <h2>Network Recommendations</h2>
      <ul>
        <li>Place instances in private subnets</li>
        <li>Use dedicated security groups per environment</li>
        <li>Attach IAM roles instead of inline credentials</li>
        <li>Enable VPC Flow Logs for auditing</li>
      </ul>

      <h2>Monitoring & Logging</h2>
      <p>
        All images ship with native support for:
      </p>

      <ul>
        <li>CloudWatch Agent</li>
        <li>System metrics</li>
        <li>Log streaming (syslog, journald)</li>
        <li>EBS performance monitoring</li>
      </ul>

      <h2>Best Practices</h2>
      <ul>
        <li>Patch monthly using DevVelocity Automation Credits</li>
        <li>Use encrypted EBS volumes (AES-256)</li>
        <li>Run CIS-aligned baselines</li>
      </ul>

      <h2>Next Steps</h2>
      <p>
        Visit <strong>/dashboard</strong> to select a plan and deploy an AWS image.
      </p>

    </DocsContent>
  );
}
