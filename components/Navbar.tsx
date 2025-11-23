"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import MobileSidebar from "./MobileSidebar";
import SearchBar from "./SearchBar";
import { IoMoon, IoSunny } from "react-icons/io5";

export default function Navbar() {
  const pathname = usePathname();

  const [dark, setDark] = useState(false);
  const [user, setUser] = useState<any>(null);

  /* ----------------------- */
  /*   THEME INITIALIZATION   */
  /* ----------------------- */
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const enabled = saved === "dark" || (!saved && prefersDark);
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  const toggleTheme = () => {
    const newMode = !dark;
    setDark(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newMode);
  };

  /* ----------------------- */
  /*    LOAD AUTH USER       */
  /* ----------------------- */
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    }
    loadUser();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  /* ----------------------- */
  /*         RENDER          */
  /* ----------------------- */

  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-gray-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">

        {/* LEFT SECTION */}
        <div className="flex items-center gap-4">
          <MobileSidebar />
          <Link href="/" className="text-xl font-semibold">
            DevVelocity
          </Link>
        </div>

        {/* RIGHT SECTION */}
        <div className="hidden md:flex items-center gap-4">

          {/* Search */}
          <SearchBar />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
          >
            {dark ? (
              <IoSunny size={20} className="text-yellow-300" />
            ) : (
              <IoMoon size={20} className="text-gray-700 dark:text-gray-300" />
            )}
          </button>

          {/* AUTH CONTROLS */}
          {!user ? (
            <>
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                Login
              </Link>

              <Link
                href="/auth/signup"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                Dashboard
              </Link>

              <button
                onClick={logout}
                className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
