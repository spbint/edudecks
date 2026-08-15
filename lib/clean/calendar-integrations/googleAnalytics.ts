import {
  trackCoreJourneyEvent,
  type ProductViewportCategory,
} from "@/lib/clean/analytics/productAnalytics";

export type GoogleCalendarAnalyticsEvent =
  | "google_calendar_connection_started"
  | "google_calendar_connection_succeeded"
  | "google_calendar_connection_failed"
  | "google_calendar_connection_disconnected"
  | "google_calendar_sync_succeeded"
  | "google_calendar_sync_failed";

type Input = {
  outcome: "succeeded" | "failed";
  route: "/my-calendar" | "/my-day" | "/my-settings";
  viewportCategory?: ProductViewportCategory;
};

export function currentGoogleCalendarAnalyticsRoute(): Input["route"] {
  if (typeof window === "undefined") return "/my-settings";
  if (window.location.pathname === "/my-day") return "/my-day";
  if (window.location.pathname === "/my-calendar") return "/my-calendar";
  return "/my-settings";
}

export function trackGoogleCalendarEvent(
  eventName: GoogleCalendarAnalyticsEvent,
  input: Input,
) {
  trackCoreJourneyEvent(
    eventName,
    {
      area: "calendar_connections",
      source: "google",
      outcome: input.outcome,
      route: input.route,
      ...(input.viewportCategory
        ? { viewportCategory: input.viewportCategory }
        : {}),
    },
  );
}
