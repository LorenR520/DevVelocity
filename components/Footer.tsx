// components/Footer.tsx

export default function Footer() {
  return (
    <footer className="w-full mt-20 border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10 text-sm text-gray-600">
        <div className="flex justify-between">
          <div>
            <p className="font-semibold text-green-800">DevVelocity</p>
            <p className="mt-2 text-gray-500">
              Prebuilt multi-cloud environments for developers, startups, and enterprise.
            </p>
          </div>

          <div className="space-y-2">
            <a href="/docs/installation" className="hover:text-green-800 block">Docs</a>
            <a href="/pricing" className="hover:text-green-800 block">Pricing</a>
            <a href="/support" className="hover:text-green-800 block">Support</a>
          </div>
        </div>

        <p className="text-gray-400 text-xs mt-10">
          © {new Date().getFullYear()} DevVelocity. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
