"use client";

import { useState } from "react";
import Link from "next/link";
import { RxHamburgerMenu } from "react-icons/rx";
import { IoClose } from "react-icons/io5";

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* OPEN BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 text-gray-700 dark:text-gray-300"
      >
        <RxHamburgerMenu size={24} />
      </button>

      {/* OVERLAY */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        />
      )}

      {/* SLIDE-OUT DRAWER */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-neutral-900 shadow-xl z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* CLOSE BUTTON */}
        <div className="flex justify-end p-4">
          <button onClick={() => setOpen(false)}>
            <IoClose size={26} className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* MOBILE NAVIGATION LINKS */}
        <nav className="flex flex-col space-y-4 px-6 text-gray-900 dark:text-gray-200">

          <Link href="/installation" onClick={() => setOpen(false)}>
            Installation
          </Link>

          <Link href="/pricing" onClick={() => setOpen(false)}>
            Pricing
          </Link>

          <Link href="/providers" onClick={() => setOpen(false)}>
            Providers
          </Link>

          {/* AUTH */}
          <Link href="/auth/login" onClick={() => setOpen(false)}>
            Login
          </Link>

          <Link href="/auth/signup" onClick={() => setOpen(false)}>
            Sign Up
          </Link>

        </nav>
      </div>
    </>
  );
}
