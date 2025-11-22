export default function DigitalOcean() {
  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">DigitalOcean Images</h1>

      <p className="opacity-80 mb-4">
        Optimized droplet-ready images suitable for any workload.
      </p>

      <ul className="list-disc ml-6 space-y-2 mb-6">
        <li>DO Custom Images</li>
        <li>Kubernetes-ready builds</li>
        <li>High-performance editions</li>
        <li>Easy 1-click deployment guides</li>
      </ul>
    </div>
  );
}
