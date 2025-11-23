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

  const mainLinks = [
    { name: "Installation", href: "/docs/installation" },
    { name: "Pricing", href: "/docs/pricing" },
  ];

  const providerLinks = [
    { name: "AWS", href: "/docs/providers/aws" },
    { name: "Azure", href: "/docs/providers/azure" },
    { name: "GCP", href: "/docs/providers/gcp" },
    { name: "DigitalOcean", href: "/docs/providers/digitalocean" },
    { name: "Linode", href: "/docs/providers/linode" },
    { name: "OCI", href: "/docs/providers/oci" },
    { name: "Vultr", href: "/docs/providers/vultr" },
  ];

  const Item = ({ href, name }: { href: string; name: string }) => {
    const active = pathname.startsWith(href);
    return (
      <Link
        href={href}
        onClick={() => isMobile && onClose?.()}
        className={`block px-3 py-2 rounded-md text-sm font-medium transition
          ${
            active
              ? "bg-blue-600 text-white"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
          }
        `}
      >
        {name}
      </Link>
    );
  };

  return (
    <aside
      className={`flex flex-col gap-4 p-4 ${
        isMobile
          ? "bg-white dark:bg-neutral-900 w-64"
          : "border-r border-gray-200 dark:border-neutral-800 w-64 h-full"
      }`}
    >
      {/* MAIN SECTION */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
          General
        </p>
        <div className="flex flex-col gap-1">
          {mainLinks.map((item) => (
            <Item key={item.href} href={item.href} name={item.name} />
          ))}
        </div>
      </div>

      {/* PROVIDERS SECTION */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
          Cloud Providers
        </p>
        <div className="flex flex-col gap-1">
          {providerLinks.map((item) => (
            <Item key={item.href} href={item.href} name={item.name} />
          ))}
        </div>
      </div>
    </aside>
  );
}
