import { cookies } from "next/headers";
import Link from "next/link";

export const metadata = {
  title: "Dashboard — DevVelocity",
  description: "Your AI-powered infrastructure workspace.",
};

export default function DashboardHome() {
  const plan = cookies().get("user_plan")?.value ?? "developer";
  const isDev = plan === "developer";

  return (
    <div className="text-white space-y-12">

      {/* -------- Header -------- */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Welcome to DevVelocity</h1>
        <p className="text-gray-400 text-lg">
          Build, save, and optimize your cloud infrastructure with AI.
        </p>
      </div>

      {/* -------- Current Plan -------- */}
      <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
        <h2 className="text-2xl font-semibold mb-3">Your Plan</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold capitalize">{plan}</p>
            <p className="text-gray-400 text-sm">
              {isDev
                ? "Access to basic features. Upgrade to unlock AI Builder, File Portal, and automation."
                : "Full access to your DevVelocity tier features."}
            </p>
          </div>

          {isDev && (
            <Link
              href="/upgrade"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
            >
              Upgrade Now
            </Link>
          )}
        </div>
      </div>

      {/* -------- Quick Actions -------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* AI Builder */}
        <Link
          href={isDev ? "/upgrade?from=ai-builder" : "/dashboard/ai-builder"}
          className="block p-6 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-blue-600 transition"
        >
          <h3 className="text-xl font-semibold mb-2">AI Builder</h3>
          <p className="text-gray-400 text-sm">
            Automatically generate cloud infrastructure, pipelines, cloud-init,
            docker-compose, security models, and more.
          </p>
          {isDev && (
            <p className="text-blue-400 text-xs mt-2">(Upgrade required)</p>
          )}
        </Link>

        {/* File Portal */}
        <Link
          href={isDev ? "/upgrade?from=file-portal" : "/dashboard/files"}
          className="block p-6 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-blue-600 transition"
        >
          <h3 className="text-xl font-semibold mb-2">File Portal</h3>
          <p className="text-gray-400 text-sm">
            Save, organize, and version your AI-generated DevOps files.
            Upgrade to access your file repository and version control.
          </p>
          {isDev && (
            <p className="text-blue-400 text-xs mt-2">(Upgrade required)</p>
          )}
        </Link>

        {/* Billing */}
        <Link
          href="/dashboard/billing"
          className="block p-6 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-blue-600 transition"
        >
          <h3 className="text-xl font-semibold mb-2">Billing</h3>
          <p className="text-gray-400 text-sm">
            Manage payment methods, invoices, usage, and plan details.
          </p>
        </Link>

        {/* Documentation */}
        <a
          href="https://devvelocity-docs.com"
          target="_blank"
          className="block p-6 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-blue-600 transition"
        >
          <h3 className="text-xl font-semibold mb-2">Documentation</h3>
          <p className="text-gray-400 text-sm">
            Learn how to maximize DevVelocity’s AI automation features.
          </p>
        </a>
      </div>

      {/* -------- Footer -------- */}
      <p className="text-center text-gray-500 text-xs mt-16">
        DevVelocity © {new Date().getFullYear()} — AI-Powered DevOps Productivity
      </p>
    </div>
  );
}
