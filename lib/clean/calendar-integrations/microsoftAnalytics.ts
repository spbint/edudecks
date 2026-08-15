import {
  trackCoreJourneyEvent,
  type ProductViewportCategory,
} from "@/lib/clean/analytics/productAnalytics";

export type MicrosoftCalendarAnalyticsEvent =
  | "microsoft_calendar_connection_started"
  | "microsoft_calendar_connection_succeeded"
  | "microsoft_calendar_connection_failed"
  | "microsoft_calendar_sync_succeeded"
  | "microsoft_calendar_sync_failed"
  | "microsoft_calendar_connection_disconnected";

type SafeProperties = {
  outcome: "succeeded" | "failed";
  route: "/my-calendar" | "/my-day" | "/my-settings";
  viewportCategory?: ProductViewportCategory;
};

export function currentMicrosoftCalendarAnalyticsRoute(): SafeProperties["route"] {
  if (typeof window === "undefined") return "/my-settings";
  if (window.location.pathname === "/my-day") return "/my-day";
  if (window.location.pathname === "/my-calendar") return "/my-calendar";
  return "/my-settings";
}

export function trackMicrosoftCalendarEvent(
  event: MicrosoftCalendarAnalyticsEvent,
  properties: SafeProperties,
) {
  trackCoreJourneyEvent(
    event,
    {
      area: "calendar_connections",
      source: "microsoft",
      outcome: properties.outcome,
      route: properties.route,
      ...(properties.viewportCategory
        ? { viewportCategory: properties.viewportCategory }
        : {}),
    },
  );
}
