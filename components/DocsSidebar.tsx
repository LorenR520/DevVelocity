"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function DocsSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path
      ? "text-indigo-600 font-semibold"
      : "text-gray-700 hover:text-indigo-600";

  const [providersOpen, setProvidersOpen] = useState(true);

  return (
    <nav className="space-y-6 text-sm">

      {/* =============== SECTION: Getting Started =============== */}
      <div>
        <h4 className="uppercase text-gray-500 text-xs font-bold mb-2">
          Getting Started
        </h4>

        <ul className="space-y-2">
          <li>
            <Link href="/docs/installation" className={isActive("/docs/installation")}>
              Installation
            </Link>
          </li>

          <li>
            <Link href="/docs/pricing" className={isActive("/docs/pricing")}>
              Pricing
            </Link>
          </li>
        </ul>
      </div>


      {/* =============== SECTION: Cloud Providers =============== */}
      <div>
        <button
          onClick={() => setProvidersOpen(!providersOpen)}
          className="flex justify-between w-full text-left uppercase text-gray-500 text-xs font-bold mb-2"
        >
          Cloud Providers
          <span>{providersOpen ? "▾" : "▸"}</span>
        </button>

        {providersOpen && (
          <ul className="space-y-2 ml-2">
            <li>
              <Link href="/docs/providers/aws" className={isActive("/docs/providers/aws")}>
                AWS
              </Link>
            </li>
            <li>
              <Link href="/docs/providers/azure" className={isActive("/docs/providers/azure")}>
                Azure
              </Link>
            </li>
            <li>
              <Link href="/docs/providers/gcp" className={isActive("/docs/providers/gcp")}>
                Google Cloud (GCP)
              </Link>
            </li>
            <li>
              <Link href="/docs/providers/oci" className={isActive("/docs/providers/oci")}>
                Oracle Cloud (OCI)
              </Link>
            </li>
            <li>
              <Link href="/docs/providers/digitalocean" className={isActive("/docs/providers/digitalocean")}>
                DigitalOcean
              </Link>
            </li>
            <li>
              <Link href="/docs/providers/linode" className={isActive("/docs/providers/linode")}>
                Linode
              </Link>
            </li>
            <li>
              <Link href="/docs/providers/vultr" className={isActive("/docs/providers/vultr")}>
                Vultr
              </Link>
            </li>
          </ul>
        )}
      </div>


      {/* =============== SECTION: Support =============== */}
      <div>
        <h4 className="uppercase text-gray-500 text-xs font-bold mb-2">
          Support
        </h4>

        <ul className="space-y-2">
          <li>
            <Link href="/docs/support" className={isActive("/docs/support")}>
              Support Overview
            </Link>
          </li>
          <li>
            <Link href="/docs/support/getting-started" className={isActive("/docs/support/getting-started")}>
              Getting Help
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
