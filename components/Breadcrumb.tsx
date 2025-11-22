"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Breadcrumb() {
  const path = usePathname().split("/").filter(Boolean);

  return (
    <div className="text-sm text-white/50 mb-6 flex space-x-2">
      <Link href="/">Home</Link>
      {path.map((segment, index) => {
        const href = "/" + path.slice(0, index + 1).join("/");

        return (
          <div className="flex items-center space-x-2" key={index}>
            <span>/</span>
            <Link className="capitalize text-white" href={href}>
              {segment.replace("-", " ")}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
