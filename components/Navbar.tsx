"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IoMoon, IoSunny } from "react-icons/io5";
import MobileSidebar from "./MobileSidebar";
import SearchBar from "./SearchBar";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState(null);

  // Load theme & user on first load
  useEffect(() => {
    // Theme
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }

    // Supabase auth state
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    }

    loadUser();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

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

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <header className="w-full border-b border-gray-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">

        {/* LEFT: Mobile Menu + Brand */}
        <div className="flex items-center gap-3">
          <MobileSidebar />

          <Link href="/" className="text-xl font-semibold">
            DevVelocity
          </Link>
        </div>

        {/* RIGHT SECTION (Desktop only) */}
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

          {/* AUTH BUTTONS */}
          {!user ? (
            <>
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
              >
                Login
              </Link>

              <Link
                href="/auth/signup"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
              >
                Dashboard
              </Link>

              <button
                onClick={logout}
                className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
