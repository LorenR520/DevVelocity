// app/dashboard/billing/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BillingPage() {
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/org");
        const data = await res.json();
        setOrg(data.org ?? null);
      } catch (err) {
        console.error("Billing load error:", err);
      }
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <main className="text-center text-gray-300 py-20">
        Loading billing...
      </main>
    );
  }

  if (!org) {
    return (
      <main className="text-center text-gray-300 py-20">
        No billing profile found.
      </main>
    );
  }

  const planName = org.plan_id
    ? org.plan_id.charAt(0).toUpperCase() + org.plan_id.slice(1)
    : "Unknown";

  const seatsUsed = org.seats_used ?? 1;
  const seatsIncluded = org.seats_included ?? 1;

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-white">
      <h1 className="text-3xl font-bold mb-8">Billing</h1>

      {/* PLAN CARD */}
      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 mb-10">
        <h2 className="text-xl font-semibold mb-2">Current Plan</h2>
        <p className="text-lg text-blue-400 mb-1">{planName}</p>

        <p className="text-gray-400 text-sm mb-4">
          You are subscribed to the <strong>{planName}</strong> plan.
        </p>

        <Link
          href="/dashboard/billing/upgrade"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          Change Plan
        </Link>
      </section>

      {/* SEAT USAGE */}
      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 mb-10">
        <h2 className="text-xl font-semibold mb-4">Seat Usage</h2>

        <p className="text-gray-300 mb-2">
          Seats Used: <strong>{seatsUsed}</strong>
        </p>

        <p className="text-gray-300">
          Seats Included:{" "}
          <strong>
            {seatsIncluded === "custom" ? "Custom" : seatsIncluded}
          </strong>
        </p>

        {typeof seatsIncluded === "number" && seatsUsed > seatsIncluded && (
          <p className="text-red-400 mt-3">
            You are over your included seats — overage charges apply.
          </p>
        )}

        <Link
          href="/dashboard/team"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          Manage Team
        </Link>
      </section>

      {/* LINKS */}
      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
        <h2 className="text-xl font-semibold mb-3">Billing Actions</h2>

        <ul className="text-blue-400 space-y-2">
          <li>
            <Link
              href="/dashboard/billing/invoices"
              className="hover:underline"
            >
              View Invoices
            </Link>
          </li>

          <li>
            <Link
              href="/dashboard/billing/usage"
              className="hover:underline"
            >
              View Usage & Overage Details
            </Link>
          </li>

          <li>
            <Link
              href="/dashboard/billing/upgrade"
              className="hover:underline"
            >
              Change / Upgrade Plan
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
