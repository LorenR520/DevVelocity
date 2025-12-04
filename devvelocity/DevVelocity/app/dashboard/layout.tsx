import "../globals.css";
import Link from "next/link";
import { cookies } from "next/headers";

export const metadata = {
  title: "DevVelocity Dashboard",
  description: "Manage AI builds, saved files, file versions, billing and organization settings.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pull the user's plan from cookies
  const plan = cookies().get("user_plan")?.value ?? "developer";
  const isDev = plan === "developer";

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">

      {/* ---------------- Sidebar ---------------- */}
      <aside className="w-64 border-r border-neutral-800 p-6 flex flex-col gap-6 bg-neutral-900/40">
        <h2 className="text-xl font-bold mb-4">DevVelocity</h2>

        <nav className="flex flex-col gap-3 text-gray-300">

          {/* Overview */}
          <Link href="/dashboard" className="hover:text-white">
            Overview
          </Link>

          {/* AI Builder – locked for Developer plan */}
          <Link
            href={isDev ? "/upgrade?from=ai-builder" : "/dashboard/ai-builder"}
            className={`${isDev ? "text-gray-500" : ""} hover:text-white`}
          >
            AI Builder
            {isDev && <span className="ml-2 text-xs text-blue-400">(Upgrade)</span>}
          </Link>

          {/* File Portal – locked for Developer plan */}
          <Link
            href={isDev ? "/upgrade?from=file-portal" : "/dashboard/files"}
            className={`${isDev ? "text-gray-500" : ""} hover:text-white`}
          >
            File Portal
            {isDev && <span className="ml-2 text-xs text-blue-400">(Upgrade)</span>}
          </Link>

          {/* Billing */}
          <Link href="/dashboard/billing" className="hover:text-white">
            Billing
          </Link>
        </nav>

        {/* Plan indicator */}
        <div className="mt-auto text-gray-400 text-sm border-t border-neutral-800 pt-4">
          Current Plan:{" "}
          <span className="text-white font-semibold capitalize">{plan}</span>
        </div>
      </aside>

      {/* ---------------- Main Content ---------------- */}
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}
