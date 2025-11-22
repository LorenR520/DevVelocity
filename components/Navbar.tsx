"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full border-b border-neutral-200 dark:border-darkmode-border bg-white dark:bg-darkmode-panel">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
        <Link href="/" className="text-xl font-semibold text-brand-dark dark:text-brand-light">
          DevVelocity
        </Link>

        <div className="flex gap-6 text-sm font-medium">
          <Link href="/docs/installation">Installation</Link>
          <Link href="/docs/providers">Providers</Link>
          <Link href="/docs/pricing">Pricing</Link>
          <Link href="/docs/support">Support</Link>
        </div>
      </div>
    </nav>
  );
}
