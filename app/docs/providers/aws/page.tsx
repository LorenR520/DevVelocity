// app/docs/providers/aws/page.tsx

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
