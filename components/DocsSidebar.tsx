"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Installation", href: "/docs/installation" },
  { label: "Pricing", href: "/docs/pricing" },
  {
    label: "Providers",
    children: [
      { label: "AWS", href: "/docs/providers/aws" },
      { label: "Azure", href: "/docs/providers/azure" },
      { label: "DigitalOcean", href: "/docs/providers/digitalocean" },
      { label: "GCP", href: "/docs/providers/gcp" },
      { label: "Linode", href: "/docs/providers/linode" },
      { label: "OCI", href: "/docs/providers/oci" },
      { label: "Vultr", href: "/docs/providers/vultr" },
    ],
  },
  { label: "Support", href: "/support" },
];

export default function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="p-6 space-y-4">
      {links.map((item, i) => (
        <div key={i}>
          {!item.children ? (
            <Link
              href={item.href!}
              className={`block py-2 text-sm ${
                pathname === item.href
                  ? "text-blue-400 font-semibold"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ) : (
            <div>
              <div className="text-xs uppercase text-white/40 mb-2">
                {item.label}
              </div>
              <div className="pl-4 space-y-1">
                {item.children.map((c, j) => (
                  <Link
                    key={j}
                    href={c.href}
                    className={`block py-1 text-sm ${
                      pathname === c.href
                        ? "text-blue-400 font-semibold"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
