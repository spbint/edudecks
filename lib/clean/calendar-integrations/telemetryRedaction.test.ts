import { Buffer } from "node:buffer";
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

  it("removes HTTP feed credentials from URLs, headers and structured fields", () => {
    const password = "B".repeat(43);
    const basic = Buffer.from(`mylearna:${password}`, "utf8").toString("base64");
    const event = redactCalendarFeedTelemetry({
      request: {
        url: `https://mylearna:${password}@www.mylearna.com/api/calendar-feeds/BBBBBBBB.ics`,
        headers: { authorization: `Basic ${basic}` },
      },
      breadcrumbs: [
        {
          message: `Opened webcal://mylearna:${password}@www.mylearna.com/api/calendar-feeds/BBBBBBBB.ics`,
        },
      ],
      password,
    });
    const serialized = JSON.stringify(event);
    expect(serialized).not.toContain(password);
    expect(serialized).not.toContain(basic);
    expect(serialized).toContain("[redacted]");
  });

  it("removes Google OAuth codes, state and authorization request parameters", () => {
    const event = redactCalendarFeedTelemetry({
      request: {
        url: "https://www.mylearna.com/api/calendar-connections/google/callback?code=secret-code&state=secret-state",
      },
      breadcrumbs: [
        {
          data: {
            url: "https://accounts.google.com/o/oauth2/v2/auth?client_id=id&state=secret-state&code_challenge=secret-challenge",
          },
        },
      ],
      contexts: {
        oauth: {
          code: "structured-secret-code",
          state: "structured-secret-state",
          refresh_token: "structured-refresh-token",
        },
      },
    });
    const serialized = JSON.stringify(event);
    expect(serialized).not.toContain("secret-code");
    expect(serialized).not.toContain("secret-state");
    expect(serialized).not.toContain("secret-challenge");
    expect(serialized).not.toContain("structured-secret");
    expect(serialized).toContain("[redacted]");
  });

  it("removes Microsoft OAuth codes, state and authorization request parameters", () => {
    const event = redactCalendarFeedTelemetry({
      request: {
        url: "https://www.mylearna.com/api/calendar-connections/microsoft/callback?code=microsoft-secret-code&state=microsoft-secret-state",
      },
      breadcrumb: {
        url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=id&state=microsoft-secret-state&code_challenge=microsoft-secret-challenge",
      },
    });
    const serialized = JSON.stringify(event);
    expect(serialized).not.toContain("microsoft-secret-code");
    expect(serialized).not.toContain("microsoft-secret-state");
    expect(serialized).not.toContain("microsoft-secret-challenge");
    expect(serialized).toContain("[redacted]");
  });
});
