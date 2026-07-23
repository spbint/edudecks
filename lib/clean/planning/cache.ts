import type { CleanCalendarItem } from "@/lib/clean/calendar/types";

type CacheEntry<T> = {
  value: T;
  savedAt: number;
};

const calendarItemsCache = new Map<string, CacheEntry<CleanCalendarItem[]>>();
const calendarItemsInFlight = new Map<string, Promise<CleanCalendarItem[]>>();

export function buildCleanPlanningCacheKey(input: {
  userId: string | null | undefined;
  familyId: string | null | undefined;
  route: "day" | "calendar";
  learnerId?: string | null;
  fromDate: string;
  toDate: string;
  view?: string | null;
}) {
  return [
    String(input.userId ?? "").trim(),
    String(input.familyId ?? "").trim(),
    input.route,
    String(input.learnerId ?? "").trim(),
    input.fromDate,
    input.toDate,
    String(input.view ?? "").trim(),
  ].join("|");
}

export function readCleanPlanningCalendarItems(key: string) {
  return calendarItemsCache.get(key)?.value ?? null;
}

export function writeCleanPlanningCalendarItems(key: string, items: CleanCalendarItem[]) {
  calendarItemsCache.set(key, {
    value: items,
    savedAt: Date.now(),
  });
}

export function clearCleanPlanningCache() {
  calendarItemsCache.clear();
  calendarItemsInFlight.clear();
}

export function getOrCreateCleanPlanningCalendarItemsRequest(
  key: string,
  request: () => Promise<CleanCalendarItem[]>,
) {
  const existing = calendarItemsInFlight.get(key);
  if (existing) return existing;

  const requestPromise = request();
  const nextRequest = requestPromise.finally(() => {
    if (calendarItemsInFlight.get(key) === nextRequest) {
      calendarItemsInFlight.delete(key);
    }
  });
  calendarItemsInFlight.set(key, nextRequest);
  return nextRequest;
}

export function getCleanPlanningCacheAge(key: string) {
  const entry = calendarItemsCache.get(key);
  return entry ? Date.now() - entry.savedAt : null;
}
