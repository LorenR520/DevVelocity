// app/docs/installation/page.tsx

import DocsContent from "../../../components/DocsContent";

export const metadata = {
  title: "Installation – DevVelocity Docs",
  description: "How to install and deploy DevVelocity enterprise cloud images.",
};

export default function InstallationPage() {
  return (
    <DocsContent>
      <h1>Installation</h1>

      <p>
        DevVelocity provides enterprise-grade cloud images designed for AWS, Azure,
        Google Cloud, OCI, Linode, DigitalOcean, and Vultr. This guide walks you
        through setting up access, deploying your first image, and managing builds.
      </p>

      <h2>1. Create an Account</h2>
      <p>
        Before deploying, you&apos;ll need a DevVelocity account. Sign up and choose a
        subscription tier based on your needs.
      </p>

      <ul>
        <li>Free – limited testing images</li>
        <li>Pro – all images + automation tools</li>
        <li>Enterprise – hardened builds, multi-cloud orchestration</li>
      </ul>

      <h2>2. Configure Your Cloud Provider</h2>
      <p>
        Connect your provider to allow one-click deployment. DevVelocity never stores 
        your credentials — authentication happens through secure OAuth or API tokens.
      </p>

      <ol>
        <li>AWS → IAM Role + Policy</li>
        <li>Azure → Service Principal</li>
        <li>GCP → Service Account JSON</li>
        <li>OCI → Tenancy + API Key</li>
      </ol>

      <h2>3. Deploy Your First Image</h2>
      <p>
        After connection, navigate to <strong>Providers</strong> and choose your cloud.
      </p>

      <pre>
        <code>
{`# Example: Deploying AWS Image
1. Select Provider → AWS
2. Choose Enterprise AMI
3. Click “Deploy”
4. Confirm region and instance type
`}
        </code>
      </pre>

      <h2>4. What Happens Next?</h2>
      <p>
        DevVelocity provisions, configures, and hardens your environment automatically
        using enterprise security best practices.
      </p>

      <p>
        You can track build status in your <strong>Dashboard</strong>.
      </p>
    </DocsContent>
  );
}
