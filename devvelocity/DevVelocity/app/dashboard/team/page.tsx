"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function TeamPage() {
  const [team, setTeam] = useState([]);
  const [org, setOrg] = useState(null);
  const [includedSeats, setIncludedSeats] = useState(0);
  const [usedSeats, setUsedSeats] = useState(0);

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: orgData } = await supabase
      .from("organizations")
      .select("*")
      .single();

    setOrg(orgData);

    const plan = orgData.plan_id;

    const pricing = await fetch("/pricing.json").then((r) => r.json());
    const current = pricing.plans.find((p) => p.id === plan);

    setIncludedSeats(current.seats_included);

    const { data: members } = await supabase
      .from("organization_members")
      .select("*")
      .eq("org_id", orgData.id);

    setTeam(members);
    setUsedSeats(members.length);
  }

  if (!org) return <p className="text-white p-6">Loading...</p>;

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 text-white">
      <h1 className="text-3xl font-bold mb-6">Team</h1>

      <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 mb-8">
        <p className="text-lg">
          <strong>Seats:</strong> {usedSeats} / {includedSeats}
        </p>

        {usedSeats > includedSeats && (
          <p className="text-red-400 mt-2">
            You are over the seat limit — an additional seat fee will apply.
          </p>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-4">Members</h2>

      <ul className="space-y-2 mb-6">
        {team.map((m) => (
          <li
            key={m.user_id}
            className="bg-neutral-800 border border-neutral-700 p-4 rounded-lg flex justify-between"
          >
            <span>{m.email}</span>

            {m.role !== "owner" && (
              <form action={`/dashboard/team/remove`} method="POST">
                <input type="hidden" name="memberId" value={m.user_id} />
                <button className="text-red-400 hover:text-red-300 text-sm">
                  Remove
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>

      <form action="/dashboard/team/invite" method="POST" className="space-y-3">
        <input
          type="email"
          name="email"
          placeholder="Invite by email"
          className="w-full p-2 rounded bg-neutral-800 border border-neutral-700"
          required
        />
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">
          Invite Member
        </button>
      </form>
    </main>
  );
}
