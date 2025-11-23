export default function ProvidersOverviewPage() {
  const providers = [
    {
      name: "Amazon Web Services (AWS)",
      href: "/docs/providers/aws",
      description: "Enterprise AMIs, secure golden images, hardened Linux/Windows builds.",
      logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg",
    },
    {
      name: "Microsoft Azure",
      href: "/docs/providers/azure",
      description: "Azure VM images built for scale, security, and fast deployment.",
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg",
    },
    {
      name: "Google Cloud (GCP)",
      href: "/docs/providers/gcp",
      description: "GCE images optimized for performance and multi-region workloads.",
      logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg",
    },
    {
      name: "Oracle Cloud (OCI)",
      href: "/docs/providers/oci",
      description: "OCI compute images hardened for enterprise workloads and multi-tenancy.",
      logo: "https://upload.wikimedia.org/wikipedia/commons/0/0d/Oracle_Cloud_Logo.svg",
    },
    {
      name: "DigitalOcean",
      href: "/docs/providers/digitalocean",
      description: "Prebuilt droplets for developers who want speed and simplicity.",
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/ff/DigitalOcean_logo.svg",
    },
    {
      name: "Linode",
      href: "/docs/providers/linode",
      description: "Lightweight, fast images for bare-metal style VM workloads.",
      logo: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Linode-logo-standard.svg",
    },
    {
      name: "Vultr",
      href: "/docs/providers/vultr",
      description: "High-performance images with global network reach.",
      logo: "https://upload.wikimedia.org/wikipedia/commons/0/06/Vultr_logo_2022.svg",
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-16 px-6">
      <h1 className="text-4xl font-bold mb-4">Cloud Providers</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-12">
        Choose a cloud provider to view available enterprise-grade images.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {providers.map((provider) => (
          <a
            key={provider.name}
            href={provider.href}
            className="flex items-center gap-4 p-6 rounded-xl border dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow hover:shadow-lg transition"
          >
            <img src={provider.logo} alt={provider.name} className="w-14 h-14 object-contain" />
            <div>
              <h2 className="text-xl font-semibold">{provider.name}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {provider.description}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
