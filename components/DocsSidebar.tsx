// components/DocsSidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DocsSidebar() {
  const path = usePathname();

  const sections = [
    {
      title: "Getting Started",
      items: [
        { label: "Installation", href: "/docs/installation" },
      ],
    },
    {
      title: "Cloud Providers",
      items: [
        { label: "AWS", href: "/docs/providers/aws" },
        { label: "Azure", href: "/docs/providers/azure" },
        { label: "Google Cloud", href: "/docs/providers/gcp" },
        { label: "Oracle Cloud (OCI)", href: "/docs/providers/oci" },
        { label: "DigitalOcean", href: "/docs/providers/digitalocean" },
        { label: "Linode", href: "/docs/providers/linode" },
        { label: "Vultr", href: "/docs/providers/vultr" },
      ],
    },
  ];

  return (
    <div className="p-6 text-sm">
      {sections.map((section, i) => (
        <div key={i} className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {section.title}
          </h3>

          <ul className="space-y-2">
            {section.items.map((item, j) => {
              const active = path === item.href;

              return (
                <li key={j}>
                  <Link
                    href={item.href}
                    className={`block px-3 py-2 rounded-md ${
                      active
                        ? "bg-green-50 text-green-800 font-medium"
                        : "text-gray-700 hover:bg-gray-100 hover:text-green-800"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
