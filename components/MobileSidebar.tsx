"use client";

import { useState } from "react";
import DocsSidebar from "./DocsSidebar";
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

      {/* BACKDROP OVERLAY */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        />
      )}

      {/* SLIDE-IN DRAWER */}
      <div
        className={`fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="w-64 h-full bg-white dark:bg-neutral-900 shadow-xl">
          {/* CLOSE BUTTON */}
          <div className="flex justify-end p-4">
            <button onClick={() => setOpen(false)}>
              <IoClose size={26} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* SIDEBAR LINKS */}
          <DocsSidebar isMobile onClose={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}
