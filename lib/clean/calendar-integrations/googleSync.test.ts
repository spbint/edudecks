import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GoogleCalendarRepository } from "@/lib/clean/calendar-integrations/googleRepository";
import { processGoogleCalendarSyncBatch } from "@/lib/clean/calendar-integrations/googleSync";
import { encryptCalendarSecret } from "@/lib/clean/calendar-integrations/secretProtection";
import { GOOGLE_CALENDAR_SCOPE } from "@/lib/clean/calendar-integrations/googleTypes";

const original = { ...process.env };

beforeEach(() => {
  process.env.CALENDAR_INTEGRATION_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");
  process.env.GOOGLE_CALENDAR_CLIENT_ID = "client-id";
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET = "client-secret";
  process.env.GOOGLE_CALENDAR_REDIRECT_URI =
    "https://preview.test/api/calendar-connections/google/callback";
});

afterEach(() => {
  process.env = { ...original };
  vi.unstubAllGlobals();
});

function repository(operation: "upsert" | "delete" = "upsert") {
  const calls = {
    saved: vi.fn(),
    completed: vi.fn(),
    failed: vi.fn(),
    removed: vi.fn(),
  };
  const fake = {
    reclaimStaleJobs: vi.fn(),
    claimJobs: vi.fn().mockResolvedValue([
      {
        id: "job-1",
        familyId: "family-1",
        calendarItemId: "item-1",
        operation,
        attempts: 0,
        lockToken: "00000000-0000-4000-8000-000000000001",
      },
    ]),
    getConnection: vi.fn().mockImplementation(async (familyId: string) => ({
      id: "connection-1",
      familyId,
      connectedByUserId: "user-1",
      externalCalendarId: "calendar-1",
      externalCalendarName: "MyLearna Homeschool",
      refreshTokenCiphertext: encryptCalendarSecret("refresh-token"),
      grantedScopes: [GOOGLE_CALENDAR_SCOPE],
      status: "active",
      lastSyncAt: null,
      lastSyncStatus: "pending",
      lastErrorCode: null,
      connectedAt: null,
      disconnectedAt: null,
    })),
    loadProjectionSource: vi.fn().mockResolvedValue({
      id: "item-1",
      title: "Learning block",
      plannedDate: "2026-08-15",
      startsAt: null,
      endsAt: null,
      learningArea: "Mathematics",
      updatedAt: "2026-08-15T08:00:00.000Z",
    }),
    saveExternalLink: calls.saved,
    completeJob: calls.completed,
    failJob: calls.failed,
    removeExternalLink: calls.removed,
    discardJob: vi.fn(),
  };
  return { fake: fake as unknown as GoogleCalendarRepository, calls };
}

function tokenResponse(status = 200) {
  return new Response(JSON.stringify({ access_token: "access-token", expires_in: 3600 }), {
    status,
  });
}

describe("Google Calendar durable sync", () => {
  it("creates a missing event and persists its stable mapping", async () => {
    const repo = repository();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response("", { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "provider-event", etag: "etag-1" }), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await processGoogleCalendarSyncBatch({ repository: repo.fake });
    expect(result).toEqual({ claimed: 1, succeeded: 1, failed: 0 });
    expect(repo.calls.saved).toHaveBeenCalledWith(
      expect.objectContaining({ calendarItemId: "item-1", eventId: "provider-event" }),
    );
    expect(repo.calls.completed).toHaveBeenCalled();
    const insertBody = JSON.parse(String(fetchMock.mock.calls[2][1]?.body));
    expect(insertBody.summary).toBe("Learning block");
    expect(insertBody.description).toBeUndefined();
    expect(insertBody.id).toMatch(/^[0-9a-f]{64}$/);
  });

  it("updates idempotently without creating a duplicate", async () => {
    const repo = repository();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "stable-event", etag: "etag-2" }), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    await processGoogleCalendarSyncBatch({ repository: repo.fake });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]?.method).toBe("PUT");
  });

  it("refreshes one access token per connection for a multi-event batch", async () => {
    const repo = repository();
    const firstJob = await repo.fake.claimJobs(25);
    vi.mocked(repo.fake.claimJobs).mockResolvedValue([
      firstJob[0],
      { ...firstJob[0], id: "job-2", calendarItemId: "item-2" },
    ]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "event-1" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "event-2" }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await processGoogleCalendarSyncBatch({ repository: repo.fake });
    expect(result).toEqual({ claimed: 2, succeeded: 2, failed: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toBe("https://oauth2.googleapis.com/token");
  });

  it("resolves an insert race by updating the deterministic event", async () => {
    const repo = repository();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response("", { status: 404 }))
      .mockResolvedValueOnce(new Response("", { status: 409 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "stable-event" }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await processGoogleCalendarSyncBatch({ repository: repo.fake });
    expect(result.succeeded).toBe(1);
    expect(fetchMock.mock.calls[3][1]?.method).toBe("PUT");
  });

  it("deletes provider events idempotently", async () => {
    const repo = repository("delete");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await processGoogleCalendarSyncBatch({ repository: repo.fake });
    expect(result.succeeded).toBe(1);
    expect(fetchMock.mock.calls[1][1]?.method).toBe("DELETE");
    expect(repo.calls.removed).toHaveBeenCalledWith("connection-1", "item-1");
  });

  it("marks revoked authorization as needing attention without discarding work", async () => {
    const repo = repository();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(tokenResponse(400)));
    const result = await processGoogleCalendarSyncBatch({ repository: repo.fake });
    expect(result.failed).toBe(1);
    expect(repo.calls.failed).toHaveBeenCalledWith(
      expect.anything(),
      "connection-1",
      "authorization_revoked",
      false,
      true,
    );
    expect(repo.calls.completed).not.toHaveBeenCalled();
  });

  it("retries Google 403 quota responses with a safe error code", async () => {
    const repo = repository();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { errors: [{ reason: "userRateLimitExceeded" }] },
          }),
          { status: 403 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await processGoogleCalendarSyncBatch({ repository: repo.fake });
    expect(result.failed).toBe(1);
    expect(repo.calls.failed).toHaveBeenCalledWith(
      expect.anything(),
      "connection-1",
      "rate_limited",
      true,
      false,
    );
  });
});
