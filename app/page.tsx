// app/page.tsx

export const dynamic = "force-dynamic"; // Required for Cloudflare Pages

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      
      {/* HERO SECTION */}
      <section className="max-w-6xl mx-auto px-6 pt-28 md:pt-32 pb-24 text-center">
        <h1 className="text-5xl md:text-7xl font-bold drop-shadow-xl">
          DevVelocity
        </h1>

        <p className="mt-6 text-xl md:text-2xl text-gray-300">
          Automated Multi-Cloud Image Marketplace for Enterprise Infrastructure
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="/docs/installation"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-lg font-medium transition"
          >
            Get Started
          </a>

          <a
            href="/pricing"
            className="px-6 py-3 border border-gray-500 hover:bg-gray-800 rounded-lg text-lg font-medium transition"
          >
            View Pricing
          </a>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="max-w-6xl mx-auto px-6 pb-28 md:pb-32">
        <h2 className="text-3xl font-semibold mb-10 text-center">
          Why DevVelocity?
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          
          <div className="p-6 bg-gray-800/60 rounded-xl border border-gray-700">
            <h3 className="text-xl font-semibold">Multi-Cloud Support</h3>
            <p className="mt-2 text-gray-300 leading-relaxed">
              Deploy images across AWS, Azure, GCP, OCI, Linode, Vultr,
              and DigitalOcean.
            </p>
          </div>

          <div className="p-6 bg-gray-800/60 rounded-xl border border-gray-700">
            <h3 className="text-xl font-semibold">Fully Automated</h3>
            <p className="mt-2 text-gray-300 leading-relaxed">
              One workflow builds, validates, signs, and publishes your cloud images.
            </p>
          </div>

          <div className="p-6 bg-gray-800/60 rounded-xl border border-gray-700">
            <h3 className="text-xl font-semibold">Enterprise Ready</h3>
            <p className="mt-2 text-gray-300 leading-relaxed">
              SSO, governance, audit logs, and role-based access for global teams.
            </p>
          </div>

        </div>
      </section>

    </main>
  );
}
