import pricing from "@/marketing/pricing.json";

export function calculateSeatOverages(planId: string, used: number) {
  const plan = pricing.plans.find(p => p.id === planId);
  if (!plan) throw new Error("Plan not found");

  const included = plan.seats_included;
  const seatPrice = plan.seat_price;

  const extraSeats = Math.max(0, used - included);

  return {
    included,
    used,
    extraSeats,
    extraCost: extraSeats * seatPrice,
  };
}
