import {
  trackCoreJourneyEvent,
  type ProductViewportCategory,
} from "@/lib/clean/analytics/productAnalytics";

export type AppleCalendarAnalyticsEvent =
  | "apple_calendar_feed_created"
  | "apple_calendar_feed_rotated"
  | "apple_calendar_feed_revoked";

type AppleCalendarAnalyticsInput = {
  outcome: "succeeded" | "failed";
  route: "/my-settings";
  viewportCategory?: ProductViewportCategory;
};

export function trackAppleCalendarEvent(
  eventName: AppleCalendarAnalyticsEvent,
  input: AppleCalendarAnalyticsInput,
  userId?: string | null,
) {
  trackCoreJourneyEvent(
    eventName,
    {
      area: "calendar_connections",
      source: "apple",
      outcome: input.outcome,
      route: input.route,
      ...(input.viewportCategory
        ? { viewportCategory: input.viewportCategory }
        : {}),
    },
    userId,
  );
}
