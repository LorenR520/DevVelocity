import { createClient } from "@supabase/supabase-js";

export async function getSeatCounts(teamId: string, env: any) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  const { count: seats } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);

  const { data: billing } = await supabase
    .from("team_billing")
    .select("*")
    .eq("team_id", teamId)
    .single();

  return {
    used: seats,
    included: billing.included_seats,
    extra_price: billing.extra_seat_price,
  };
}

export function seatsOverLimit(used: number, included: number) {
  return used > included;
}
