import "../globals.css";
import Link from "next/link";
import { cookies } from "next/headers";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Read plan (set at login or profile load)
  const plan = cookies().get("user_plan")?.value ?? "developer";

  const isDev = plan === "developer";

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">

      {/* -------- Sidebar Navigation -------- */}
      <aside className="w-64 border-r border-neutral-800 p-6 flex flex-col gap-6 bg-neutral-900/40">
        <h2 className="text-xl font-bold mb-4">DevVelocity</h2>

        <nav className="flex flex-col gap-3 text-gray-300">

          <Link href="/dashboard" className="hover:text-white">
            Overview
          </Link>

          {/* AI Builder */}
          <Link
            href={isDev ? "/upgrade?from=ai-builder" : "/dashboard/ai-builder"}
            className={`${isDev ? "text-gray-500" : ""} hover:text-white`}
          >
            AI Builder
            {isDev && <span className="ml-2 text-xs text-blue-400">(Upgrade)</span>}
          </Link>

          {/* File Portal */}
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

        {/* Plan Tag */}
        <div className="mt-auto text-gray-400 text-sm border-t border-neutral-800 pt-4">
          Current Plan:{" "}
          <span className="text-white font-semibold capitalize">{plan}</span>
        </div>
      </aside>

      {/* -------- Main Content -------- */}
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}
