{/* RIGHT SECTION */}
<div className="hidden md:flex items-center gap-4">

  {/* Search bar */}
  <SearchBar />

  {/* Theme Toggle */}
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

  {/* USER AUTH BUTTONS */}
  {!user ? (
    <>
      <a
        href="/auth/login"
        className="px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
      >
        Login
      </a>

      <a
        href="/auth/signup"
        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        Sign Up
      </a>
    </>
  ) : (
    <>
      <a
        href="/dashboard"
        className="px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
      >
        Dashboard
      </a>

      <button
        onClick={logout}
        className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition"
      >
        Logout
      </button>
    </>
  )}
</div>
