import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildGoogleAuthorizationUrl,
  createGoogleOAuthRequest,
  exchangeGoogleAuthorizationCode,
  googleCalendarEnvironmentReady,
  refreshGoogleAccessToken,
} from "@/lib/clean/calendar-integrations/googleOAuth";
import { GOOGLE_CALENDAR_SCOPE } from "@/lib/clean/calendar-integrations/googleTypes";

const original = { ...process.env };

beforeEach(() => {
  process.env.GOOGLE_CALENDAR_CLIENT_ID = "test-client-id";
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET = "test-client-secret";
  process.env.GOOGLE_CALENDAR_REDIRECT_URI =
    "https://preview.mylearna.test/api/calendar-connections/google/callback";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
  process.env.CRON_SECRET = "test-cron-secret";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
});

afterEach(() => {
  process.env = { ...original };
  vi.unstubAllGlobals();
});

describe("Google Calendar OAuth", () => {
  it("requires the server-side database, encryption, OAuth and retry configuration", () => {
    process.env.CALENDAR_INTEGRATION_ENCRYPTION_KEY = Buffer.alloc(32, 8).toString("base64");
    expect(googleCalendarEnvironmentReady()).toBe(true);
    delete process.env.CRON_SECRET;
    expect(googleCalendarEnvironmentReady()).toBe(false);
  });

  it("uses least privilege, offline access, state and PKCE", () => {
    const request = createGoogleOAuthRequest();
    expect(request.state).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(request.codeVerifier.length).toBeGreaterThanOrEqual(43);
    const url = new URL(buildGoogleAuthorizationUrl(request.state, request.codeChallenge));
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("scope")).toBe(GOOGLE_CALENDAR_SCOPE);
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("state")).toBe(request.state);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("redirect_uri")).toBe(
      process.env.GOOGLE_CALENDAR_REDIRECT_URI,
    );
  });

  it("exchanges codes and refreshes tokens only on the server endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "access-one",
            refresh_token: "refresh-one",
            expires_in: 3600,
            scope: GOOGLE_CALENDAR_SCOPE,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "access-two", expires_in: 3600 }), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const exchanged = await exchangeGoogleAuthorizationCode("code", "verifier");
    expect(exchanged.refreshToken).toBe("refresh-one");
    const refreshed = await refreshGoogleAccessToken("refresh-one");
    expect(refreshed.accessToken).toBe("access-two");
    expect(fetchMock.mock.calls[0][0]).toBe("https://oauth2.googleapis.com/token");
    const exchangeBody = fetchMock.mock.calls[0][1]?.body as URLSearchParams;
    expect(exchangeBody.get("client_secret")).toBe("test-client-secret");
    expect(exchangeBody.get("code_verifier")).toBe("verifier");
  });
});
