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
import { GoogleCalendarRepository } from "@/lib/clean/calendar-integrations/googleRepository";
import {
  GoogleOAuthError,
  refreshGoogleAccessToken,
} from "@/lib/clean/calendar-integrations/googleOAuth";
import {
  processOutboundCalendarSyncBatch,
  type OutboundCalendarAdapter,
  type OutboundSyncBatchResult,
} from "@/lib/clean/calendar-integrations/outboundSync";
import { decryptCalendarSecret } from "@/lib/clean/calendar-integrations/secretProtection";

export type GoogleSyncBatchResult = OutboundSyncBatchResult;

const googleAdapter: OutboundCalendarAdapter = {
  provider: "google",
  async getAccessToken(connection) {
    const refreshToken = decryptCalendarSecret(connection.refreshTokenCiphertext!);
    return (await refreshGoogleAccessToken(refreshToken)).accessToken;
  },
  async upsertEvent({ accessToken, connection, projection }) {
    const eventId = googleCalendarEventId(connection.id, projection.calendarItemId);
    const body = toGoogleCalendarEvent(projection, eventId);
    try {
      return await updateGoogleEvent(
        accessToken,
        connection.externalCalendarId!,
        eventId,
        body,
      );
    } catch (error) {
      if (!(error instanceof GoogleCalendarApiError) || error.code !== "not_found") {
        throw error;
      }
      try {
        return await insertGoogleEvent(
          accessToken,
          connection.externalCalendarId!,
          body,
        );
      } catch (insertError) {
        if (
          !(insertError instanceof GoogleCalendarApiError) ||
          insertError.code !== "duplicate"
        ) {
          throw insertError;
        }
        return updateGoogleEvent(
          accessToken,
          connection.externalCalendarId!,
          eventId,
          body,
        );
      }
    }
  },
  async deleteEvent({
    accessToken,
    connection,
    calendarItemId,
  }) {
    await deleteGoogleEvent(
      accessToken,
      connection.externalCalendarId!,
      googleCalendarEventId(connection.id, calendarItemId),
    );
  },
  classifyFailure(error) {
    if (error instanceof GoogleOAuthError) {
      return {
        code:
          error.code === "revoked"
            ? "authorization_revoked"
            : "token_refresh_failed",
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
        needsAttention:
          error.code === "unauthorized" || error.code === "not_found",
      };
    }
    const code = error instanceof Error ? error.message : "sync_failed";
    if (code === "invalid_planned_date" || code === "invalid_time_range") {
      return { code, retryable: false, needsAttention: false };
    }
    return { code: "sync_failed", retryable: true, needsAttention: false };
  },
};

export async function processGoogleCalendarSyncBatch(input: {
  familyId?: string;
  limit?: number;
  repository?: GoogleCalendarRepository;
} = {}): Promise<GoogleSyncBatchResult> {
  const repository = input.repository ?? new GoogleCalendarRepository();
  return processOutboundCalendarSyncBatch({
    adapter: googleAdapter,
    repository,
    familyId: input.familyId,
    limit: input.limit,
  });
}
