import { trackCoreJourneyEvent } from "@/lib/clean/analytics/productAnalytics";

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
      trackCoreJourneyEvent(
        body.result.failed
          ? "calendar_mirror_sync_failed"
          : "calendar_mirror_sync_succeeded",
        {
          area: "calendar_connections",
          source: "calendar_mutation",
          outcome: body.result.failed ? "failed" : "succeeded",
          route: window.location.pathname,
        },
      );
    })
    .catch(() => {
      // The durable database outbox retains work for retry.
    });
}
