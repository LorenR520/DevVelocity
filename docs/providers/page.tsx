export default function Providers() {
  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Supported Cloud Providers</h1>

      <p className="opacity-80 mb-4">
        DevVelocity supports the top 8 cloud platforms with uniform image output and
        deployment instructions for each.
      </p>

      <ul className="list-disc ml-6 space-y-2">
        <li>AWS</li>
        <li>Microsoft Azure</li>
        <li>Google Cloud Platform</li>
        <li>Oracle Cloud Infrastructure</li>
        <li>DigitalOcean</li>
        <li>Linode</li>
        <li>Vultr</li>
        <li>IBM Cloud</li>
      </ul>

      <p className="mt-6 opacity-80">
        Each provider includes three tiers: Sandbox, Developer, and Enterprise.
      </p>
    </div>
  );
}
