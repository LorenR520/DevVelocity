export default function Introduction() {
  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Introduction</h1>

      <p className="text-lg opacity-80 mb-4">
        Welcome to DevVelocity — the multi-cloud image marketplace designed for fast,
        consistent, and automated deployment across all major cloud providers.
      </p>

      <p className="mb-4">
        Our mission is simple: provide developers, DevOps engineers, and enterprises
        with fully pre-configured OS images for AWS, Azure, GCP, OCI, DigitalOcean,
        Linode, Vultr, and IBM Cloud.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">What DevVelocity Solves</h2>
      <ul className="list-disc ml-6 space-y-2">
        <li>Cloud image inconsistencies</li>
        <li>Time-consuming setup</li>
        <li>Multi-cloud compatibility issues</li>
        <li>Slow enterprise onboarding</li>
      </ul>
    </div>
  );
}
