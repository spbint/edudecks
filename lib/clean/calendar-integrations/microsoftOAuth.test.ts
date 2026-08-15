import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildMicrosoftAuthorizationUrl,
  exchangeMicrosoftAuthorizationCode,
  microsoftCalendarEnvironmentReady,
  refreshMicrosoftAccessToken,
} from "@/lib/clean/calendar-integrations/microsoftOAuth";

const original = { ...process.env };

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://staging.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-placeholder";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-placeholder";
  process.env.CRON_SECRET = "cron-placeholder";
  process.env.CALENDAR_INTEGRATION_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  process.env.MICROSOFT_CALENDAR_CLIENT_ID = "client-id";
  process.env.MICROSOFT_CALENDAR_CLIENT_SECRET = "client-secret";
  process.env.MICROSOFT_CALENDAR_REDIRECT_URI =
    "https://preview.test/api/calendar-connections/microsoft/callback";
});

afterEach(() => {
  process.env = { ...original };
  vi.unstubAllGlobals();
});

describe("Microsoft Calendar OAuth", () => {
  it("uses common accounts, PKCE, one state value and least privilege", () => {
    const url = new URL(buildMicrosoftAuthorizationUrl("s".repeat(43), "challenge"));
    expect(url.origin).toBe("https://login.microsoftonline.com");
    expect(url.pathname).toBe("/common/oauth2/v2.0/authorize");
    expect(url.searchParams.get("scope")).toBe(
      "offline_access Calendars.ReadWrite",
    );
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("state")).toBe("s".repeat(43));
    expect(url.searchParams.has("openid")).toBe(false);
  });

  it("keeps the client secret in the server-side code exchange", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "access-token",
          refresh_token: "refresh-token",
          expires_in: 3600,
          scope: "Calendars.ReadWrite offline_access",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const token = await exchangeMicrosoftAuthorizationCode(
      "authorization-code",
      "verifier",
    );
    expect(token.refreshToken).toBe("refresh-token");
    const body = String(fetchMock.mock.calls[0][1]?.body);
    expect(body).toContain("client_secret=client-secret");
    expect(fetchMock.mock.calls[0][0]).toContain("/common/oauth2/v2.0/token");
  });

  it("classifies invalid_grant refresh as revoked without exposing provider text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: "invalid_grant", error_description: "private" }),
          { status: 400 },
        ),
      ),
    );
    await expect(refreshMicrosoftAccessToken("refresh-token")).rejects.toMatchObject({
      code: "revoked",
      message: "Microsoft Calendar authorization could not be completed.",
    });
  });

  it("requires a fixed secure callback", () => {
    expect(microsoftCalendarEnvironmentReady()).toBe(true);
    process.env.MICROSOFT_CALENDAR_REDIRECT_URI =
      "https://preview.test/api/calendar-connections/microsoft/callback?next=evil";
    expect(microsoftCalendarEnvironmentReady()).toBe(false);
  });
});
