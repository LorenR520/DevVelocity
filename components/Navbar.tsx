"use client";

import Link from "next/link";
import MobileSidebar from "./MobileSidebar";

export default function Navbar() {
  return (
    <header className="w-full border-b border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        
        {/* LEFT — MOBILE SIDEBAR ICON */}
        <div className="flex items-center gap-3">
          <MobileSidebar />
          <Link href="/" className="text-xl font-semibold">
            DevVelocity
          </Link>
        </div>

        {/* RIGHT — FUTURE: Search / Dark mode / Profile */}
        <div className="flex items-center gap-4">
          {/* placeholder */}
        </div>
      </div>
    </header>
  );
}
