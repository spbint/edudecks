import {
  GoogleCalendarApiError,
  deleteGoogleEvent,
  insertGoogleEvent,
  updateGoogleEvent,
} from "@/lib/clean/calendar-integrations/googleApi";
import {
  googleCalendarEventId,
  toGoogleCalendarEvent,
} from "@/lib/clean/calendar-integrations/googleEvent";
import {
  GoogleCalendarRepository,
  type CalendarSyncJob,
} from "@/lib/clean/calendar-integrations/googleRepository";
import { GoogleOAuthError, refreshGoogleAccessToken } from "@/lib/clean/calendar-integrations/googleOAuth";
import { projectCalendarItem } from "@/lib/clean/calendar-integrations/projection";
import { decryptCalendarSecret } from "@/lib/clean/calendar-integrations/secretProtection";

export type GoogleSyncBatchResult = {
  claimed: number;
  succeeded: number;
  failed: number;
};

function safeFailure(error: unknown) {
  if (error instanceof GoogleOAuthError) {
    return {
      code: error.code === "revoked" ? "authorization_revoked" : "token_refresh_failed",
      retryable: error.code !== "revoked",
      needsAttention: error.code === "revoked",
    };
  }
  if (error instanceof GoogleCalendarApiError) {
    return {
      code:
        error.code === "unauthorized"
          ? "authorization_rejected"
          : error.code === "not_found"
            ? "calendar_not_found"
            : error.code,
      retryable: error.retryable,
      needsAttention: error.code === "unauthorized" || error.code === "not_found",
    };
  }
  const code = error instanceof Error ? error.message : "sync_failed";
  if (code === "invalid_planned_date" || code === "invalid_time_range") {
    return { code, retryable: false, needsAttention: false };
  }
  return { code: "sync_failed", retryable: true, needsAttention: false };
}

async function processJob(
  repository: GoogleCalendarRepository,
  job: CalendarSyncJob,
  accessTokens: Map<string, Promise<string>>,
) {
  const connection = await repository.getConnection(job.familyId);
  if (
    !connection ||
    !connection.externalCalendarId ||
    !connection.refreshTokenCiphertext ||
    !["active", "needs_attention"].includes(connection.status)
  ) {
    await repository.discardJob(job);
    return { ok: false as const, skipped: true as const };
  }

  try {
    let accessTokenPromise = accessTokens.get(connection.id);
    if (!accessTokenPromise) {
      const refreshToken = decryptCalendarSecret(connection.refreshTokenCiphertext);
      accessTokenPromise = refreshGoogleAccessToken(refreshToken).then(
        (token) => token.accessToken,
      );
      accessTokens.set(connection.id, accessTokenPromise);
    }
    const accessToken = await accessTokenPromise;
    const eventId = googleCalendarEventId(connection.id, job.calendarItemId);
    const source =
      job.operation === "delete"
        ? null
        : await repository.loadProjectionSource(job.familyId, job.calendarItemId);

    if (!source) {
      await deleteGoogleEvent(
        accessToken,
        connection.externalCalendarId,
        eventId,
      );
      await repository.removeExternalLink(connection.id, job.calendarItemId);
      await repository.completeJob(job, connection.id);
      return { ok: true as const };
    }

    const projection = projectCalendarItem(source);
    const body = toGoogleCalendarEvent(projection, eventId);
    let saved: { id: string; etag?: string };
    try {
      saved = await updateGoogleEvent(
        accessToken,
        connection.externalCalendarId,
        eventId,
        body,
      );
    } catch (error) {
      if (!(error instanceof GoogleCalendarApiError) || error.code !== "not_found") {
        throw error;
      }
      try {
        saved = await insertGoogleEvent(
          accessToken,
          connection.externalCalendarId,
          body,
        );
      } catch (insertError) {
        if (
          !(insertError instanceof GoogleCalendarApiError) ||
          insertError.code !== "duplicate"
        ) {
          throw insertError;
        }
        saved = await updateGoogleEvent(
          accessToken,
          connection.externalCalendarId,
          eventId,
          body,
        );
      }
    }

    await repository.saveExternalLink({
      connection,
      calendarItemId: job.calendarItemId,
      eventId: saved.id || eventId,
      etag: saved.etag ?? null,
      version: projection.version,
    });
    await repository.completeJob(job, connection.id);
    return { ok: true as const };
  } catch (error) {
    const failure = safeFailure(error);
    await repository.failJob(
      job,
      connection.id,
      failure.code,
      failure.retryable,
      failure.needsAttention,
    );
    return { ok: false as const, skipped: false as const };
  }
}

export async function processGoogleCalendarSyncBatch(input: {
  familyId?: string;
  limit?: number;
  repository?: GoogleCalendarRepository;
} = {}): Promise<GoogleSyncBatchResult> {
  const repository = input.repository ?? new GoogleCalendarRepository();
  await repository.reclaimStaleJobs();
  const jobs = await repository.claimJobs(input.limit ?? 25, input.familyId);
  const result: GoogleSyncBatchResult = {
    claimed: jobs.length,
    succeeded: 0,
    failed: 0,
  };
  const accessTokens = new Map<string, Promise<string>>();
  for (const job of jobs) {
    const outcome = await processJob(repository, job, accessTokens);
    if (outcome.ok) result.succeeded += 1;
    else if (!outcome.skipped) result.failed += 1;
  }
  return result;
}
