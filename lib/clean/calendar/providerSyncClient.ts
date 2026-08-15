import {
  currentGoogleCalendarAnalyticsRoute,
  trackGoogleCalendarEvent,
} from "@/lib/clean/calendar-integrations/googleAnalytics";

export function requestCalendarProviderSync(familyId: string) {
  if (typeof window === "undefined" || !familyId) return;
  void fetch("/api/calendar-sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ familyId }),
    keepalive: true,
  })
    .then(async (response) => {
      if (!response.ok) return;
      const body = (await response.json().catch(() => null)) as {
        result?: { claimed?: number; failed?: number };
      } | null;
      if (!body?.result?.claimed) return;
      trackGoogleCalendarEvent(
        body.result.failed
          ? "google_calendar_sync_failed"
          : "google_calendar_sync_succeeded",
        {
          outcome: body.result.failed ? "failed" : "succeeded",
          route: currentGoogleCalendarAnalyticsRoute(),
        },
      );
    })
    .catch(() => {
      // The durable database outbox retains work for retry.
    });
}
