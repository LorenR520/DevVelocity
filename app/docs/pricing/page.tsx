// app/docs/pricing/page.tsx

import DocsContent from "../../../components/DocsContent";

export const metadata = {
  title: "Pricing – DevVelocity Docs",
  description: "Pricing structure for DevVelocity cloud images, automation, and enterprise builds.",
};

export default function PricingPage() {
  return (
    <DocsContent>
      <h1>Pricing</h1>

      <p>
        DevVelocity provides predictable pricing for individuals, teams, and enterprise 
        organizations. All plans include secure access to cloud images, automated 
        deployments, and multi-cloud support.
      </p>

      <h2>Subscription Tiers</h2>

      <h3>Free Tier</h3>
      <ul>
        <li>Basic sandbox images</li>
        <li>Single-provider testing environment</li>
        <li>No automation features</li>
        <li>No hardened enterprise builds</li>
      </ul>

      <h3>Pro Tier</h3>
      <ul>
        <li>Access to all enterprise-grade images</li>
        <li>Unlimited deployments</li>
        <li>Basic automation + versioned builds</li>
        <li>Email notifications</li>
      </ul>

      <h3>Enterprise Tier</h3>
      <ul>
        <li>Hardened & fully-secured enterprise images</li>
        <li>Zero-trust architecture templates</li>
        <li>Multi-cloud orchestration</li>
        <li>Pipeline automation</li>
        <li>Private builds</li>
      </ul>

      <h2>Image Usage</h2>
      <p>
        DevVelocity uses a consumption-based model for cloud image deployments.  
        Costs vary slightly based on the provider:
      </p>

      <ul>
        <li>AWS AMI deployments – standard marketplace pricing</li>
        <li>Azure VM images – region-based cost modifiers</li>
        <li>GCP Compute images – hourly billing</li>
        <li>OCI/Linode/DigitalOcean/Vultr – flat monthly or hourly</li>
      </ul>

      <h2>Build Automation Credits</h2>
      <p>
        Enterprise plans include automation credits used for:
      </p>

      <ul>
        <li>Custom image generation</li>
        <li>Security hardening</li>
        <li>Pipeline rebuilds</li>
        <li>Multi-cloud replication</li>
      </ul>

      <p>
        Additional credits can be purchased at discounted volume pricing.
      </p>

      <h2>Need Help Choosing?</h2>
      <p>
        Most teams start with <strong>Pro</strong> and upgrade to 
        <strong>Enterprise</strong> when they expand multi-cloud or need 
        hardened security templates.
      </p>
    </DocsContent>
  );
}
