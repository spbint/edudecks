import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GoogleCalendarRepository } from "@/lib/clean/calendar-integrations/googleRepository";
import {
  completeGoogleCalendarConnection,
  startGoogleCalendarConnection,
} from "@/lib/clean/calendar-integrations/googleConnectionService";
import { encryptCalendarSecret } from "@/lib/clean/calendar-integrations/secretProtection";
import { GOOGLE_CALENDAR_SCOPE } from "@/lib/clean/calendar-integrations/googleTypes";

const original = { ...process.env };

beforeEach(() => {
  process.env.CALENDAR_INTEGRATION_ENCRYPTION_KEY = Buffer.alloc(32, 4).toString("base64");
  process.env.GOOGLE_CALENDAR_CLIENT_ID = "client-id";
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET = "client-secret";
  process.env.GOOGLE_CALENDAR_REDIRECT_URI =
    "https://preview.test/api/calendar-connections/google/callback";
});

afterEach(() => {
  process.env = { ...original };
  vi.unstubAllGlobals();
});

function repository(existingCalendarId: string | null = null) {
  const saveConnected = vi.fn().mockImplementation(async (input) => ({
    id: "connection-1",
    familyId: input.familyId,
    connectedByUserId: input.userId,
    externalCalendarId: input.externalCalendarId,
    externalCalendarName: "MyLearna Homeschool",
    refreshTokenCiphertext: input.refreshTokenCiphertext,
    grantedScopes: input.scopes,
    status: "active",
    lastSyncAt: null,
    lastSyncStatus: "pending",
    lastErrorCode: null,
    connectedAt: null,
    disconnectedAt: null,
  }));
  const fake = {
    createOAuthState: vi.fn(),
    consumeOAuthState: vi.fn().mockResolvedValue({
      id: "state-row",
      familyId: "family-1",
      userId: "user-1",
      codeVerifierCiphertext: encryptCalendarSecret("code-verifier"),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    }),
    getConnection: vi.fn().mockResolvedValue(
      existingCalendarId
        ? {
            id: "connection-1",
            familyId: "family-1",
            externalCalendarId: existingCalendarId,
          }
        : null,
    ),
    saveConnected,
    enqueueFamily: vi.fn(),
    reclaimStaleJobs: vi.fn(),
    claimJobs: vi.fn().mockResolvedValue([]),
  };
  return { fake: fake as unknown as GoogleCalendarRepository, saveConnected, raw: fake };
}

function tokenResponse(scopes = GOOGLE_CALENDAR_SCOPE) {
  return new Response(
    JSON.stringify({
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_in: 3600,
      scope: scopes,
    }),
    { status: 200 },
  );
}

describe("Google Calendar connection lifecycle", () => {
  it("stores only hashed/encrypted OAuth material before redirect", async () => {
    const repo = repository();
    const result = await startGoogleCalendarConnection({
      familyId: "family-1",
      userId: "user-1",
      repository: repo.fake,
    });
    expect(result.authorizationUrl).toContain("https://accounts.google.com/");
    const stateInput = repo.raw.createOAuthState.mock.calls[0][0];
    expect(stateInput.rawState).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(stateInput.codeVerifierCiphertext).toMatch(/^v1\./);
    expect(JSON.stringify(stateInput)).not.toContain("code_verifier");
  });

  it("reauthorizes the exact user/family before creating the dedicated calendar", async () => {
    const repo = repository();
    const authorizeFamily = vi.fn().mockResolvedValue(undefined);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "google-calendar-1" }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await completeGoogleCalendarConnection({
      state: "s".repeat(43),
      code: "authorization-code",
      authenticatedUserId: "user-1",
      authorizeFamily,
      repository: repo.fake,
    });
    expect(authorizeFamily).toHaveBeenCalledWith("family-1", "user-1");
    expect(repo.saveConnected).toHaveBeenCalledWith(
      expect.objectContaining({ externalCalendarId: "google-calendar-1" }),
    );
    expect(result.connection).not.toHaveProperty("refreshTokenCiphertext");
    expect(result.connection).not.toHaveProperty("externalCalendarId");
  });

  it("reuses an accessible dedicated calendar on reconnect", async () => {
    const repo = repository("google-calendar-existing");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "google-calendar-existing" }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    await completeGoogleCalendarConnection({
      state: "s".repeat(43),
      code: "authorization-code",
      authenticatedUserId: "user-1",
      authorizeFamily: vi.fn(),
      repository: repo.fake,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]?.method).toBeUndefined();
    expect(repo.saveConnected).toHaveBeenCalledWith(
      expect.objectContaining({ externalCalendarId: "google-calendar-existing" }),
    );
  });

  it("removes a newly created calendar if connection persistence fails", async () => {
    const repo = repository();
    repo.saveConnected.mockRejectedValueOnce(new Error("database unavailable"));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "google-calendar-orphan" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      completeGoogleCalendarConnection({
        state: "s".repeat(43),
        code: "authorization-code",
        authenticatedUserId: "user-1",
        authorizeFamily: vi.fn(),
        repository: repo.fake,
      }),
    ).rejects.toThrow("database unavailable");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][0]).toContain(
      "/calendars/google-calendar-orphan",
    );
    expect(fetchMock.mock.calls[2][1]?.method).toBe("DELETE");
  });

  it("rejects callback replay under another authenticated user before provider calls", async () => {
    const repo = repository();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      completeGoogleCalendarConnection({
        state: "s".repeat(43),
        code: "authorization-code",
        authenticatedUserId: "attacker-user",
        authorizeFamily: vi.fn(),
        repository: repo.fake,
      }),
    ).rejects.toMatchObject({ code: "wrong_user" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects incomplete consent without persisting a connection", async () => {
    const repo = repository();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(tokenResponse("other-scope")));
    await expect(
      completeGoogleCalendarConnection({
        state: "s".repeat(43),
        code: "authorization-code",
        authenticatedUserId: "user-1",
        authorizeFamily: vi.fn(),
        repository: repo.fake,
      }),
    ).rejects.toMatchObject({ code: "missing_scope" });
    expect(repo.saveConnected).not.toHaveBeenCalled();
  });
});
