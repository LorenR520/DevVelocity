// components/Breadcrumb.tsx

import Link from "next/link";

export default function Breadcrumb({ items }) {
  return (
    <nav className="text-xs text-gray-500 mb-4">
      {items.map((item, i) => (
        <span key={i}>
          {item.href ? (
            <Link href={item.href} className="hover:text-green-700">
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}

          {i < items.length - 1 && " / "}
        </span>
      ))}
    </nav>
  );
}
