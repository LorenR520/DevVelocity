export default function Home() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-4xl font-bold mb-4 text-green-400">
        DevVelocity
      </h1>

      <p className="text-lg opacity-80 mb-10">
        Automated Multi-Cloud Image Marketplace
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">

        <a href="/docs/introduction" className="p-6 bg-gray-900 rounded-xl border border-gray-700 hover:border-green-400 transition">
          <h2 className="text-xl font-semibold mb-2 text-green-300">📘 Documentation</h2>
          <p className="opacity-80">Learn how DevVelocity works & how to deploy images.</p>
        </a>

        <a href="/docs/providers" className="p-6 bg-gray-900 rounded-xl border border-gray-700 hover:border-green-400 transition">
          <h2 className="text-xl font-semibold mb-2 text-green-300">☁️ Providers</h2>
          <p className="opacity-80">AWS, Azure, GCP, OCI, Linode, DigitalOcean, Vultr</p>
        </a>

        <a href="/docs/pricing" className="p-6 bg-gray-900 rounded-xl border border-gray-700 hover:border-green-400 transition">
          <h2 className="text-xl font-semibold mb-2 text-green-300">💵 Pricing</h2>
          <p className="opacity-80">Simple transparent pricing for all image tiers.</p>
        </a>

      </div>
    </div>
  );
}
