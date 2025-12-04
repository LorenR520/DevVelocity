"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumb() {
  const pathname = usePathname();

  // Split into parts, remove the empty first item '/'
  const parts = pathname.split("/").filter(Boolean);

  // Build breadcrumbs with links
  const breadcrumbs = parts.map((part, index) => {
    const href = "/" + parts.slice(0, index + 1).join("/");

    return {
      label: part
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      href,
      isLast: index === parts.length - 1,
    };
  });

  // Hide breadcrumb on homepage
  if (pathname === "/") return null;

  return (
    <nav className="text-sm text-gray-600 dark:text-gray-400 mb-6">
      <ol className="flex items-center gap-2 flex-wrap">
        <li>
          <Link
            href="/"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            Home
          </Link>
        </li>

        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="flex items-center gap-2">
            <span>/</span>

            {!crumb.isLast ? (
              <Link
                href={crumb.href}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-gray-900 dark:text-gray-300 font-medium">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
