export default function ArchitectureOverview() {
  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Architecture Overview</h1>

      <p className="opacity-80 mb-4">
        DevVelocity uses an automated multi-stage build pipeline for OS image creation,
        optimization, and cloud-provider packaging.
      </p>

      <h2 className="text-2xl font-semibold mb-2">Core Components</h2>
      <ul className="list-disc ml-6 space-y-2 mb-4">
        <li>Image Builder Engine (base OS + configuration)</li>
        <li>Cloud Formatter Modules (AMI, VHD, VMDK, QCOW2)</li>
        <li>Distribution Pipeline (registry upload + marketplace sync)</li>
        <li>Documentation & Deployment Guides</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Supported Providers</h2>
      <p className="opacity-80">
        AWS • Azure • GCP • Oracle • DigitalOcean • Linode • Vultr • IBM Cloud
      </p>
    </div>
  );
}
