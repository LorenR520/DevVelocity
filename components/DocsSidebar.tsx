"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DocsSidebar({
  isMobile = false,
  onClose,
}: {
  isMobile?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const links = [
    { name: "Installation", href: "/docs/installation" },
    { name: "Pricing", href: "/docs/pricing" },

    // Providers main entry point
    { name: "Providers", href: "/docs/providers/aws" },
  ];

  return (
    <div
      className={`h-full flex flex-col gap-2 p-4 ${
        isMobile
          ? "bg-white dark:bg-neutral-900 w-64"
          : "border-r border-gray-200 dark:border-neutral-800 w-64"
      }`}
    >
      {links.map((item) => {
        const active = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => isMobile && onClose && onClose()}
            className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
              active
                ? "bg-blue-600 text-white"
                : "text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`}
          >
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}
