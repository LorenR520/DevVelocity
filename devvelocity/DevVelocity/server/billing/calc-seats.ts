import pricing from "@/marketing/pricing.json";

export function calculateSeatOverages(planId: string, used: number) {
  // Find the matching plan metadata
  const plan = (pricing as any).plans.find((p: any) => p.id === planId);

  if (!plan) {
    throw new Error(`Plan not found: ${planId}`);
  }

  // Handle enterprise (unlimited seats or custom rules)
  if (plan.seats_included === "custom" || plan.seat_price === "custom") {
    return {
      included: "custom",
      used,
      extraSeats: 0,
      extraCost: 0,
    };
  }

  const included: number = Number(plan.seats_included);
  const seatPrice: number = Number(plan.seat_price);

  // Example: 5 used seats, 3 included → extraSeats = 2
  const extraSeats = Math.max(0, used - included);

  return {
    included,
    used,
    extraSeats,
    extraCost: extraSeats * seatPrice,
  };
}
