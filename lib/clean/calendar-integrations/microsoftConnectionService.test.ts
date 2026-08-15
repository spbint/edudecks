import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MicrosoftCalendarRepository } from "@/lib/clean/calendar-integrations/microsoftRepository";
import {
  completeMicrosoftCalendarConnection,
  disconnectMicrosoftCalendar,
  startMicrosoftCalendarConnection,
} from "@/lib/clean/calendar-integrations/microsoftConnectionService";
import { encryptCalendarSecret } from "@/lib/clean/calendar-integrations/secretProtection";

const original = { ...process.env };

beforeEach(() => {
  process.env.CALENDAR_INTEGRATION_ENCRYPTION_KEY = Buffer.alloc(32, 4).toString("base64");
  process.env.MICROSOFT_CALENDAR_CLIENT_ID = "client-id";
  process.env.MICROSOFT_CALENDAR_CLIENT_SECRET = "client-secret";
  process.env.MICROSOFT_CALENDAR_REDIRECT_URI =
    "https://preview.test/api/calendar-connections/microsoft/callback";
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
    provider: "microsoft",
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
    provider: "microsoft" as const,
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
  return {
    fake: fake as unknown as MicrosoftCalendarRepository,
    saveConnected,
    raw: fake,
  };
}

function tokenResponse(scopes = "Calendars.ReadWrite offline_access") {
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

describe("Microsoft Calendar connection lifecycle", () => {
  it("stores encrypted PKCE material before redirect", async () => {
    const repo = repository();
    const result = await startMicrosoftCalendarConnection({
      familyId: "family-1",
      userId: "user-1",
      repository: repo.fake,
    });
    expect(result.authorizationUrl).toContain("login.microsoftonline.com/common");
    const stateInput = repo.raw.createOAuthState.mock.calls[0][0];
    expect(stateInput.rawState).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(stateInput.codeVerifierCiphertext).toMatch(/^v1\./);
  });

  it("reauthorizes the exact user/family and creates one dedicated calendar", async () => {
    const repo = repository();
    const authorizeFamily = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(tokenResponse())
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: "microsoft-calendar-1" }), {
            status: 201,
          }),
        ),
    );
    const result = await completeMicrosoftCalendarConnection({
      state: "s".repeat(43),
      code: "authorization-code",
      authenticatedUserId: "user-1",
      authorizeFamily,
      repository: repo.fake,
    });
    expect(authorizeFamily).toHaveBeenCalledWith("family-1", "user-1");
    expect(repo.saveConnected).toHaveBeenCalledWith(
      expect.objectContaining({ externalCalendarId: "microsoft-calendar-1" }),
    );
    expect(result.connection).not.toHaveProperty("refreshTokenCiphertext");
    expect(result.connection).not.toHaveProperty("externalCalendarId");
  });

  it("reuses an accessible dedicated calendar on reconnect", async () => {
    const repo = repository("microsoft-calendar-existing");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "microsoft-calendar-existing" }), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    await completeMicrosoftCalendarConnection({
      state: "s".repeat(43),
      code: "authorization-code",
      authenticatedUserId: "user-1",
      authorizeFamily: vi.fn(),
      repository: repo.fake,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]?.method).toBeUndefined();
  });

  it("cleans up a newly created calendar if persistence fails", async () => {
    const repo = repository();
    repo.saveConnected.mockRejectedValueOnce(new Error("database unavailable"));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "orphan-calendar" }), { status: 201 }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      completeMicrosoftCalendarConnection({
        state: "s".repeat(43),
        code: "authorization-code",
        authenticatedUserId: "user-1",
        authorizeFamily: vi.fn(),
        repository: repo.fake,
      }),
    ).rejects.toThrow("database unavailable");
    expect(fetchMock.mock.calls[2][1]?.method).toBe("DELETE");
    expect(String(fetchMock.mock.calls[2][0])).toContain("orphan-calendar");
  });

  it("disconnects locally even when revoked consent prevents provider cleanup", async () => {
    const markDisconnected = vi.fn();
    const fake = {
      provider: "microsoft" as const,
      getConnection: vi.fn().mockResolvedValue({
        id: "connection-1",
        familyId: "family-1",
        provider: "microsoft",
        externalCalendarId: "calendar-1",
        refreshTokenCiphertext: encryptCalendarSecret("refresh-token"),
        status: "active",
      }),
      markDisconnected,
    } as unknown as MicrosoftCalendarRepository;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }),
      ),
    );
    const result = await disconnectMicrosoftCalendar({
      familyId: "family-1",
      repository: fake,
    });
    expect(result.warningCode).toBe("external_calendar_cleanup_failed");
    expect(markDisconnected).toHaveBeenCalledWith(
      "connection-1",
      "external_calendar_cleanup_failed",
    );
  });

  it("rejects callback replay under another MyLearna user", async () => {
    const repo = repository();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      completeMicrosoftCalendarConnection({
        state: "s".repeat(43),
        code: "authorization-code",
        authenticatedUserId: "attacker",
        authorizeFamily: vi.fn(),
        repository: repo.fake,
      }),
    ).rejects.toMatchObject({ code: "wrong_user" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects incomplete calendar consent", async () => {
    const repo = repository();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(tokenResponse("offline_access")));
    await expect(
      completeMicrosoftCalendarConnection({
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
