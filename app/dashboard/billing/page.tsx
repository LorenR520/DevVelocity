// app/dashboard/billing/page.tsx

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import pricing from "@/marketing/pricing.json";
import UpgradeButtons from "@/components/UpgradeButtons";

export default async function BillingPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // 1. Fetch session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const user = session.user;

  // 2. Fetch user's organization
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", session.user.user_metadata.org_id)
    .single();

  if (!org) {
    return (
      <div className="text-white p-8">
        <h2 className="text-2xl font-bold mb-4">Billing</h2>
        <p>No organization found.</p>
      </div>
    );
  }

  // 3. Current plan object
  const plan = pricing.plans.find((p) => p.id === org.plan_id);

  const isEnterprise = plan?.id === "enterprise";
  const nextInvoice =
    org.pending_overage_amount > 0
      ? org.pending_overage_amount.toFixed(2)
      : null;

  return (
    <div className="p-8 text-white space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold">Billing</h1>
        <p className="text-gray-400">
          Manage subscription, usage, and payment history.
        </p>
      </div>

      {/* CURRENT PLAN CARD */}
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
        <h2 className="text-xl font-semibold">Current Plan</h2>

        <p className="text-3xl font-bold">
          {plan?.display_price ?? "Custom Pricing"}
        </p>

        <p className="text-gray-400">{plan?.name}</p>

        <UpgradeButtons
          planId={plan?.id ?? "developer"}
          currentPlan={plan?.id ?? null}
        />
      </div>

      {/* USAGE BLOCK */}
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-6">
        <h2 className="text-xl font-semibold">Usage Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UsageCard
            label="Build Minutes"
            used={org.usage_build_minutes ?? 0}
            limit={plan?.limits.build_minutes}
          />
          <UsageCard
            label="Pipelines Run"
            used={org.usage_pipelines ?? 0}
            limit={plan?.limits.pipelines}
          />
          <UsageCard
            label="Provider API Calls"
            used={org.usage_api_calls ?? 0}
            limit={plan?.limits.api_calls}
          />
        </div>
      </div>

      {/* SEAT MANAGEMENT */}
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-6">
        <h2 className="text-xl font-semibold">Seats</h2>

        <p className="text-gray-300">
          Seats Included: {plan?.seats_included}
          {plan?.seats_included !== "custom" &&
            ` — Extra Seats: $${plan?.seat_price}/mo`}
        </p>

        <a
          href="/dashboard/team/invite"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          Manage Seats
        </a>
      </div>

      {/* UPCOMING CHARGES */}
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
        <h2 className="text-xl font-semibold">Upcoming Charges</h2>

        {nextInvoice ? (
          <p className="text-lg">
            Estimated Overage Charge:{" "}
            <span className="font-bold text-red-400">${nextInvoice}</span>
          </p>
        ) : (
          <p className="text-gray-400">No overage charges pending.</p>
        )}
      </div>

      {/* BILLING HISTORY */}
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
        <h2 className="text-xl font-semibold">Billing History</h2>

        <a
          href="/dashboard/billing/invoices"
          className="inline-block px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-md"
        >
          View Invoices
        </a>
      </div>
    </div>
  );
}

function UsageCard({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | string;
}) {
  const isUnlimited = limit === "custom";

  let pct = 0;
  if (!isUnlimited) pct = Math.min(100, (used / (limit as number)) * 100);

  return (
    <div className="p-4 bg-neutral-800 rounded-lg space-y-2">
      <p className="text-gray-300">{label}</p>
      <p className="text-xl font-bold">{used}</p>

      {isUnlimited ? (
        <p className="text-blue-400 text-sm">Unlimited</p>
      ) : (
        <>
          <div className="w-full h-2 bg-neutral-700 rounded">
            <div
              className="h-2 bg-blue-600 rounded"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-sm text-gray-400">{used} / {limit}</p>
        </>
      )}
    </div>
  );
}
