export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-5xl font-bold mb-4 text-[#7CFF6B]">DevVelocity</h1>

      <p className="text-lg opacity-80 mb-12">
        Automated Multi-Cloud Image Marketplace
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">

        <a href="/docs/providers/aws" className="p-4 border border-[#7CFF6B] rounded-lg hover:bg-[#7CFF6B] hover:text-black transition">
          AWS
        </a>

        <a href="/docs/providers/azure" className="p-4 border border-[#7CFF6B] rounded-lg hover:bg-[#7CFF6B] hover:text-black transition">
          Azure
        </a>

        <a href="/docs/providers/gcp" className="p-4 border border-[#7CFF6B] rounded-lg hover:bg-[#7CFF6B] hover:text-black transition">
          Google Cloud
        </a>

        <a href="/docs/providers/oci" className="p-4 border border-[#7CFF6B] rounded-lg hover:bg-[#7CFF6B] hover:text-black transition">
          Oracle Cloud (OCI)
        </a>

        <a href="/docs/providers/digitalocean" className="p-4 border border-[#7CFF6B] rounded-lg hover:bg-[#7CFF6B] hover:text-black transition">
          DigitalOcean
        </a>

        <a href="/docs/providers/linode" className="p-4 border border-[#7CFF6B] rounded-lg hover:bg-[#7CFF6B] hover:text-black transition">
          Linode
        </a>

        <a href="/docs/providers/vultr" className="p-4 border border-[#7CFF6B] rounded-lg hover:bg-[#7CFF6B] hover:text-black transition">
          Vultr
        </a>

      </div>

      <footer className="mt-20 opacity-60 text-sm">
        © 2025 DevVelocity — All Rights Reserved.
      </footer>
    </main>
  );
}
