import { getSeatCounts } from "./seats";

export async function canAddSeat(teamId: string, env: any) {
  const { used, included } = await getSeatCounts(teamId, env);

  return used < included;
}
