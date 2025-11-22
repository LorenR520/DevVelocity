"use client";

import Link from "next/link";
import MobileSidebar from "./MobileSidebar";
import { useState, useEffect } from "react";
import { IoMoon, IoSunny } from "react-icons/io5";

export default function Navbar() {
  const [dark, setDark] = useState(false);

  // Load from localStorage on first load
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDark(true);
    }
  };

  return (
    <header className="w-full border-b border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">

        {/* LEFT */}
        <div className="flex items-center gap-3">
          <MobileSidebar />
          <Link href="/" className="text-xl font-semibold">
            DevVelocity
          </Link>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
          >
            {dark ? (
              <IoSunny size={20} className="text-yellow-300" />
            ) : (
              <IoMoon size={20} className="text-gray-700" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
