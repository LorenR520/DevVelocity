export const dynamic = "force-static";

const providers = [
  {
    name: "AWS",
    desc: "EC2 AMIs for enterprise workloads",
    href: "/docs/providers/aws",
  },
  {
    name: "Azure",
    desc: "Compute Gallery VM images",
    href: "/docs/providers/azure",
  },
  {
    name: "GCP",
    desc: "GCE images for global scale",
    href: "/docs/providers/gcp",
  },
  {
    name: "OCI",
    desc: "Custom images for OCI compute",
    href: "/docs/providers/oci",
  },
  {
    name: "Linode",
    desc: "Marketplace-ready images",
    href: "/docs/providers/linode",
  },
  {
    name: "DigitalOcean",
    desc: "Droplet-optimized snapshots",
    href: "/docs/providers/digitalocean",
  },
  {
    name: "Vultr",
    desc: "High-performance VPS images",
    href: "/docs/providers/vultr",
  },
];

export default function ProvidersIndex() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 text-white">
      <h1 className="text-4xl font-bold mb-6">Supported Cloud Providers</h1>

      <p className="text-gray-300 mb-10">
        DevVelocity supports automated, hardened, production-ready image builds
        across all major public cloud platforms. Select a provider to view setup
        steps, deployment options, and best practices.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((p) => (
          <a
            key={p.name}
            href={p.href}
            className="p-6 bg-gray-800/60 rounded-xl border border-gray-700 hover:border-blue-600
                       hover:shadow-lg hover:shadow-blue-600/20 transition group"
          >
            <h2 className="text-xl font-semibold group-hover:text-blue-400 transition">
              {p.name}
            </h2>

            <p className="text-gray-400 text-sm mt-2">
              {p.desc}
            </p>

            <p className="text-blue-500 text-sm mt-4 group-hover:underline">
              View Documentation →
            </p>
          </a>
        ))}
      </div>

      {/* FOOTER NAV */}
      <div className="border-t border-neutral-800 pt-8 text-sm mt-16 flex justify-start">
        <a
          href="/docs/installation"
          className="text-gray-400 hover:text-white transition"
        >
          ← Back to Installation
        </a>
      </div>
    </div>
  );
}
