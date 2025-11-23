export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-10 text-center">
        
        {/* BRAND */}
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          DevVelocity
        </h2>

        {/* SUBTEXT */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Enterprise-grade cloud images & automated DevOps environments.
        </p>

        {/* FOOTER NAV */}
        <nav className="flex justify-center gap-6 text-sm mb-6">
          <a
            href="/docs/installation"
            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition"
          >
            Docs
          </a>
          <a
            href="/docs/pricing"
            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition"
          >
            Pricing
          </a>
          <a
            href="/auth/login"
            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition"
          >
            Login
          </a>
          <a
            href="/auth/signup"
            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition"
          >
            Sign Up
          </a>
        </nav>

        {/* COPYRIGHT */}
        <p className="text-xs text-gray-500 dark:text-gray-500">
          © {year} DevVelocity. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
