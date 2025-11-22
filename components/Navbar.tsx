// components/Navbar.tsx
"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* LEFT — LOGO */}
        <Link href="/" className="text-xl font-semibold text-green-800">
          DevVelocity
        </Link>

        {/* RIGHT — NAVIGATION */}
        <nav className="flex space-x-8 text-sm font-medium text-gray-700">
          <Link href="/docs/installation" className="hover:text-green-700">
            Docs
          </Link>
          <Link href="/pricing" className="hover:text-green-700">
            Pricing
          </Link>
          <Link href="/support" className="hover:text-green-700">
            Support
          </Link>
          <Link href="/login" className="hover:text-green-700">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
