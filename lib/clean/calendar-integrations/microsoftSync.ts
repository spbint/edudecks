import {
  MicrosoftCalendarApiError,
  deleteMicrosoftEvent,
  insertMicrosoftEvent,
  updateMicrosoftEvent,
} from "@/lib/clean/calendar-integrations/microsoftApi";
import {
  microsoftCalendarTransactionId,
  toMicrosoftCalendarEvent,
} from "@/lib/clean/calendar-integrations/microsoftEvent";
import {
  MicrosoftOAuthError,
  refreshMicrosoftAccessToken,
} from "@/lib/clean/calendar-integrations/microsoftOAuth";
import { MicrosoftCalendarRepository } from "@/lib/clean/calendar-integrations/microsoftRepository";
import {
  processOutboundCalendarSyncBatch,
  type OutboundCalendarAdapter,
  type OutboundSyncBatchResult,
} from "@/lib/clean/calendar-integrations/outboundSync";
import {
  decryptCalendarSecret,
  encryptCalendarSecret,
} from "@/lib/clean/calendar-integrations/secretProtection";

export type MicrosoftSyncBatchResult = OutboundSyncBatchResult;

const microsoftAdapter: OutboundCalendarAdapter = {
  provider: "microsoft",
  async getAccessToken(connection, repository) {
    const currentRefreshToken = decryptCalendarSecret(
      connection.refreshTokenCiphertext!,
    );
    const token = await refreshMicrosoftAccessToken(currentRefreshToken);
    if (token.refreshToken && token.refreshToken !== currentRefreshToken) {
      await repository.updateRefreshToken(
        connection.id,
        encryptCalendarSecret(token.refreshToken),
      );
    }
    return token.accessToken;
  },
  async upsertEvent({
    accessToken,
    connection,
    projection,
    existingLink,
  }) {
    const body = toMicrosoftCalendarEvent(
      projection,
      microsoftCalendarTransactionId(
        connection.id,
        projection.calendarItemId,
      ),
    );
    if (existingLink?.eventId) {
      try {
        const updated = await updateMicrosoftEvent(
          accessToken,
          connection.externalCalendarId!,
          existingLink.eventId,
          body,
        );
        return {
          id: updated.id || existingLink.eventId,
          etag: updated["@odata.etag"] ?? null,
        };
      } catch (error) {
        if (
          !(error instanceof MicrosoftCalendarApiError) ||
          error.code !== "not_found"
        ) {
          throw error;
        }
      }
    }
    const created = await insertMicrosoftEvent(
      accessToken,
      connection.externalCalendarId!,
      body,
    );
    return { id: created.id, etag: created["@odata.etag"] ?? null };
  },
  async deleteEvent({ accessToken, connection, existingLink }) {
    if (!existingLink?.eventId) return;
    await deleteMicrosoftEvent(
      accessToken,
      connection.externalCalendarId!,
      existingLink.eventId,
    );
  },
  classifyFailure(error) {
    if (error instanceof MicrosoftOAuthError) {
      return {
        code:
          error.code === "revoked"
            ? "authorization_revoked"
            : "token_refresh_failed",
        retryable: error.code !== "revoked",
        needsAttention: error.code === "revoked",
      };
    }
    if (error instanceof MicrosoftCalendarApiError) {
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

export async function processMicrosoftCalendarSyncBatch(input: {
  familyId?: string;
  limit?: number;
  repository?: MicrosoftCalendarRepository;
} = {}): Promise<MicrosoftSyncBatchResult> {
  const repository = input.repository ?? new MicrosoftCalendarRepository();
  return processOutboundCalendarSyncBatch({
    adapter: microsoftAdapter,
    repository,
    familyId: input.familyId,
    limit: input.limit,
  });
}
