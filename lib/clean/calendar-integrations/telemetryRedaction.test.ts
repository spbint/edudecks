import { describe, expect, it } from "vitest";
import { redactCalendarFeedTelemetry } from "@/lib/clean/calendar-integrations/telemetryRedaction";

describe("calendar feed observability redaction", () => {
  it("removes feed bearer tokens from nested telemetry fields", () => {
    const token = "A".repeat(43);
    const event = redactCalendarFeedTelemetry({
      request: {
        url: `https://www.mylearna.com/api/calendar-feeds/${token}.ics`,
      },
      transaction: `GET /api/calendar-feeds/${token}.ics`,
      breadcrumbs: [
        { message: `Opened webcal://www.mylearna.com/api/calendar-feeds/${token}.ics` },
      ],
    });

    expect(JSON.stringify(event)).not.toContain(token);
    expect(event.request.url).toContain("/api/calendar-feeds/[redacted].ics");
  });
});
