"use client";

import useSWR from "swr";

export default function TeamPage() {
  const { data } = useSWR("/api/team");

  const seats = data?.billing;

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-8">Team Settings</h1>

      <section className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 mb-8">
        <h2 className="text-xl font-semibold mb-4">Seats</h2>

        <p className="text-gray-300">
          {seats.used} / {seats.included} seats used
        </p>

        {seats.used > seats.included && (
          <p className="text-red-400 mt-2">
            You have exceeded your seat limit. Please upgrade.
          </p>
        )}
      </section>
    </main>
  );
}
