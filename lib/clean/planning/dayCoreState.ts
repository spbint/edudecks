import type { CleanMyDayPresentationState } from "@/lib/clean/setup/setupStatus";

export type CleanDayCoreState = "blocked" | "loading" | "error" | "ready";

export function getCleanDayCoreState(input: {
  readyForDay: boolean;
  itemsLoading: boolean;
  itemsError: string | null;
  dayPrimaryKey: string | null;
  itemsResolvedKey: string | null;
  presentationState: CleanMyDayPresentationState | null;
}): CleanDayCoreState {
  if (!input.readyForDay) return "blocked";
  if (input.itemsError) return "error";
  if (
    input.itemsLoading ||
    !input.dayPrimaryKey ||
    input.itemsResolvedKey !== input.dayPrimaryKey ||
    !input.presentationState
  ) {
    return "loading";
  }
  return "ready";
}
