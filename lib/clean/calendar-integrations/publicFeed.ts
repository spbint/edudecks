import { projectCalendarItem } from "@/lib/clean/calendar-integrations/projection";
import { hashCalendarFeedToken } from "@/lib/clean/calendar-integrations/tokens";
import type {
  CalendarEventProjection,
  CalendarProjectionSource,
} from "@/lib/clean/calendar-integrations/types";

export type CalendarFeedReadStore = {
  findActiveByTokenHash(
    tokenHash: string,
  ): Promise<{ id: string; familyId: string } | null>;
  loadCalendarItems(familyId: string): Promise<CalendarProjectionSource[]>;
  touchLastAccessed(id: string, familyId: string, now: string): Promise<void>;
};

export async function loadAppleCalendarFeed(
  rawToken: string,
  store: CalendarFeedReadStore,
  now = () => new Date().toISOString(),
): Promise<{ familyId: string; events: CalendarEventProjection[] } | null> {
  const tokenHash = hashCalendarFeedToken(rawToken);
  const subscription = await store.findActiveByTokenHash(tokenHash);
  if (!subscription) return null;

  const rows = await store.loadCalendarItems(subscription.familyId);
  await store.touchLastAccessed(subscription.id, subscription.familyId, now());

  return {
    familyId: subscription.familyId,
    events: rows.map(projectCalendarItem),
  };
}
