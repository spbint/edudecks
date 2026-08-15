import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MicrosoftCalendarRepository } from "@/lib/clean/calendar-integrations/microsoftRepository";
import { processMicrosoftCalendarSyncBatch } from "@/lib/clean/calendar-integrations/microsoftSync";
import { encryptCalendarSecret } from "@/lib/clean/calendar-integrations/secretProtection";

const original = { ...process.env };

beforeEach(() => {
  process.env.CALENDAR_INTEGRATION_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");
  process.env.MICROSOFT_CALENDAR_CLIENT_ID = "client-id";
  process.env.MICROSOFT_CALENDAR_CLIENT_SECRET = "client-secret";
  process.env.MICROSOFT_CALENDAR_REDIRECT_URI =
    "https://preview.test/api/calendar-connections/microsoft/callback";
});

afterEach(() => {
  process.env = { ...original };
  vi.unstubAllGlobals();
});

function repository(input: {
  operation?: "upsert" | "delete";
  existingEventId?: string | null;
} = {}) {
  const calls = {
    saved: vi.fn(),
    completed: vi.fn(),
    failed: vi.fn(),
    removed: vi.fn(),
    updatedToken: vi.fn(),
  };
  const fake = {
    provider: "microsoft" as const,
    reclaimStaleJobs: vi.fn(),
    claimJobs: vi.fn().mockResolvedValue([
      {
        id: "job-1",
        provider: "microsoft" as const,
        familyId: "family-1",
        calendarItemId: "item-1",
        operation: input.operation ?? "upsert",
        attempts: 0,
        lockToken: "00000000-0000-4000-8000-000000000001",
      },
    ]),
    getConnection: vi.fn().mockResolvedValue({
      id: "connection-1",
      familyId: "family-1",
      connectedByUserId: "user-1",
      provider: "microsoft",
      externalCalendarId: "calendar-1",
      externalCalendarName: "MyLearna Homeschool",
      refreshTokenCiphertext: encryptCalendarSecret("refresh-token"),
      grantedScopes: ["Calendars.ReadWrite"],
      status: "active",
      lastSyncAt: null,
      lastSyncStatus: "pending",
      lastErrorCode: null,
      connectedAt: null,
      disconnectedAt: null,
    }),
    loadProjectionSource: vi.fn().mockResolvedValue({
      id: "item-1",
      title: "Learning block",
      plannedDate: "2026-08-15",
      startsAt: null,
      endsAt: null,
      learningArea: "Mathematics",
      updatedAt: "2026-08-15T08:00:00.000Z",
    }),
    getExternalLink: vi.fn().mockResolvedValue(
      input.existingEventId
        ? { eventId: input.existingEventId, etag: null, version: null }
        : null,
    ),
    updateRefreshToken: calls.updatedToken,
    saveExternalLink: calls.saved,
    completeJob: calls.completed,
    failJob: calls.failed,
    removeExternalLink: calls.removed,
    discardJob: vi.fn(),
  };
  return {
    fake: fake as unknown as MicrosoftCalendarRepository,
    calls,
  };
}

function tokenResponse(status = 200, refreshToken = "rotated-refresh-token") {
  return new Response(
    JSON.stringify(
      status === 200
        ? {
            access_token: "access-token",
            refresh_token: refreshToken,
            expires_in: 3600,
            scope: "Calendars.ReadWrite offline_access",
          }
        : { error: "invalid_grant" },
    ),
    { status },
  );
}

describe("Microsoft Calendar durable sync", () => {
  it("creates a mirrored event with a retry-safe transaction id", async () => {
    const repo = repository();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ id: "provider-event", "@odata.etag": "etag-1" }),
          { status: 201 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await processMicrosoftCalendarSyncBatch({
      repository: repo.fake,
    });
    expect(result).toEqual({ claimed: 1, succeeded: 1, failed: 0 });
    const event = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(event.subject).toBe("Learning block");
    expect(event.transactionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(event.description).toBeUndefined();
    expect(repo.calls.saved).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: "provider-event" }),
    );
    expect(repo.calls.updatedToken).toHaveBeenCalledWith(
      "connection-1",
      expect.stringMatching(/^v1\./),
    );
  });

  it("updates an existing mapping without creating a duplicate", async () => {
    const repo = repository({ existingEventId: "existing-event" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse(200, "refresh-token"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "existing-event" }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    await processMicrosoftCalendarSyncBatch({ repository: repo.fake });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]?.method).toBe("PATCH");
    expect(String(fetchMock.mock.calls[1][0])).toContain("existing-event");
  });

  it("deletes a mapped event idempotently", async () => {
    const repo = repository({ operation: "delete", existingEventId: "event-1" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse(200, "refresh-token"))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await processMicrosoftCalendarSyncBatch({
      repository: repo.fake,
    });
    expect(result.succeeded).toBe(1);
    expect(fetchMock.mock.calls[1][1]?.method).toBe("DELETE");
    expect(repo.calls.removed).toHaveBeenCalledWith("connection-1", "item-1");
  });

  it("marks revoked consent as needing attention and retains the job", async () => {
    const repo = repository();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(tokenResponse(400)));
    const result = await processMicrosoftCalendarSyncBatch({
      repository: repo.fake,
    });
    expect(result.failed).toBe(1);
    expect(repo.calls.failed).toHaveBeenCalledWith(
      expect.anything(),
      "connection-1",
      "authorization_revoked",
      false,
      true,
    );
  });

  it("retries throttled Graph responses without completing work", async () => {
    const repo = repository();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(tokenResponse(200, "refresh-token"))
        .mockResolvedValueOnce(new Response(null, { status: 429 })),
    );
    await processMicrosoftCalendarSyncBatch({ repository: repo.fake });
    expect(repo.calls.failed).toHaveBeenCalledWith(
      expect.anything(),
      "connection-1",
      "rate_limited",
      true,
      false,
    );
    expect(repo.calls.completed).not.toHaveBeenCalled();
  });
});
