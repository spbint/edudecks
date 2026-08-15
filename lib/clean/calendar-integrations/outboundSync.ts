import { projectCalendarItem } from "@/lib/clean/calendar-integrations/projection";
import type { OutboundCalendarRepository } from "@/lib/clean/calendar-integrations/outboundRepository";
import type {
  CalendarEventProjection,
  CalendarItemExternalLink,
  OutboundCalendarConnection,
  OutboundCalendarProvider,
} from "@/lib/clean/calendar-integrations/types";

export type OutboundSyncFailure = {
  code: string;
  retryable: boolean;
  needsAttention: boolean;
};

export type OutboundCalendarAdapter = {
  provider: OutboundCalendarProvider;
  getAccessToken: (
    connection: OutboundCalendarConnection,
    repository: OutboundCalendarRepository,
  ) => Promise<string>;
  upsertEvent: (input: {
    accessToken: string;
    connection: OutboundCalendarConnection;
    projection: CalendarEventProjection;
    existingLink: CalendarItemExternalLink | null;
  }) => Promise<{ id: string; etag?: string | null }>;
  deleteEvent: (input: {
    accessToken: string;
    connection: OutboundCalendarConnection;
    calendarItemId: string;
    existingLink: CalendarItemExternalLink | null;
  }) => Promise<void>;
  classifyFailure: (error: unknown) => OutboundSyncFailure;
};

export type OutboundSyncBatchResult = {
  claimed: number;
  succeeded: number;
  failed: number;
};

export async function processOutboundCalendarSyncBatch(input: {
  adapter: OutboundCalendarAdapter;
  repository: OutboundCalendarRepository;
  familyId?: string;
  limit?: number;
}): Promise<OutboundSyncBatchResult> {
  if (input.repository.provider !== input.adapter.provider) {
    throw new Error("calendar_provider_mismatch");
  }
  await input.repository.reclaimStaleJobs();
  const jobs = await input.repository.claimJobs(input.limit ?? 25, input.familyId);
  const result: OutboundSyncBatchResult = {
    claimed: jobs.length,
    succeeded: 0,
    failed: 0,
  };
  const accessTokens = new Map<string, Promise<string>>();

  for (const job of jobs) {
    const connection = await input.repository.getConnection(job.familyId);
    if (
      !connection ||
      !connection.externalCalendarId ||
      !connection.refreshTokenCiphertext ||
      !["active", "needs_attention"].includes(connection.status)
    ) {
      await input.repository.discardJob(job);
      continue;
    }

    try {
      let accessToken = accessTokens.get(connection.id);
      if (!accessToken) {
        accessToken = input.adapter.getAccessToken(connection, input.repository);
        accessTokens.set(connection.id, accessToken);
      }
      const token = await accessToken;
      const existingLink = await input.repository.getExternalLink(
        connection.id,
        job.calendarItemId,
      );
      const source =
        job.operation === "delete"
          ? null
          : await input.repository.loadProjectionSource(
              job.familyId,
              job.calendarItemId,
            );

      if (!source) {
        await input.adapter.deleteEvent({
          accessToken: token,
          connection,
          calendarItemId: job.calendarItemId,
          existingLink,
        });
        await input.repository.removeExternalLink(
          connection.id,
          job.calendarItemId,
        );
      } else {
        const projection = projectCalendarItem(source);
        const saved = await input.adapter.upsertEvent({
          accessToken: token,
          connection,
          projection,
          existingLink,
        });
        await input.repository.saveExternalLink({
          connection,
          calendarItemId: job.calendarItemId,
          eventId: saved.id,
          etag: saved.etag ?? null,
          version: projection.version,
        });
      }
      await input.repository.completeJob(job, connection.id);
      result.succeeded += 1;
    } catch (error) {
      accessTokens.delete(connection.id);
      const failure = input.adapter.classifyFailure(error);
      await input.repository.failJob(
        job,
        connection.id,
        failure.code,
        failure.retryable,
        failure.needsAttention,
      );
      result.failed += 1;
    }
  }
  return result;
}
