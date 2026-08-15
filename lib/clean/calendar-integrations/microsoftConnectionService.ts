import {
  MicrosoftCalendarApiError,
  createMicrosoftCalendar,
  deleteMicrosoftCalendar,
  getMicrosoftCalendar,
} from "@/lib/clean/calendar-integrations/microsoftApi";
import {
  buildMicrosoftAuthorizationUrl,
  createMicrosoftOAuthRequest,
  exchangeMicrosoftAuthorizationCode,
  refreshMicrosoftAccessToken,
} from "@/lib/clean/calendar-integrations/microsoftOAuth";
import {
  MicrosoftCalendarRepository,
  toMicrosoftConnectionMetadata,
} from "@/lib/clean/calendar-integrations/microsoftRepository";
import { processMicrosoftCalendarSyncBatch } from "@/lib/clean/calendar-integrations/microsoftSync";
import {
  MICROSOFT_CALENDAR_NAME,
  hasMicrosoftCalendarScope,
} from "@/lib/clean/calendar-integrations/microsoftTypes";
import {
  decryptCalendarSecret,
  encryptCalendarSecret,
} from "@/lib/clean/calendar-integrations/secretProtection";

export class MicrosoftConnectionError extends Error {
  constructor(
    public readonly code:
      | "invalid_state"
      | "wrong_user"
      | "missing_refresh_token"
      | "missing_scope"
      | "not_connected"
      | "connection_failed",
  ) {
    super("Microsoft Calendar connection could not be completed.");
    this.name = "MicrosoftConnectionError";
  }
}

export async function startMicrosoftCalendarConnection(input: {
  familyId: string;
  userId: string;
  repository?: MicrosoftCalendarRepository;
}) {
  const repository = input.repository ?? new MicrosoftCalendarRepository();
  const request = createMicrosoftOAuthRequest();
  await repository.createOAuthState({
    familyId: input.familyId,
    userId: input.userId,
    rawState: request.state,
    codeVerifierCiphertext: encryptCalendarSecret(request.codeVerifier),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
  return {
    authorizationUrl: buildMicrosoftAuthorizationUrl(
      request.state,
      request.codeChallenge,
    ),
  };
}

async function ensureDedicatedCalendar(
  accessToken: string,
  existingCalendarId: string | null,
) {
  if (existingCalendarId) {
    try {
      const existing = await getMicrosoftCalendar(
        accessToken,
        existingCalendarId,
      );
      if (existing.id) return { id: existing.id, created: false };
    } catch (error) {
      if (
        !(error instanceof MicrosoftCalendarApiError) ||
        error.code !== "not_found"
      ) {
        throw error;
      }
    }
  }
  const created = await createMicrosoftCalendar(accessToken);
  if (!created.id) throw new MicrosoftConnectionError("connection_failed");
  return { id: created.id, created: true };
}

export async function completeMicrosoftCalendarConnection(input: {
  state: string;
  code: string;
  authenticatedUserId: string;
  authorizeFamily: (familyId: string, userId: string) => Promise<void>;
  repository?: MicrosoftCalendarRepository;
}) {
  const repository = input.repository ?? new MicrosoftCalendarRepository();
  const oauthState = await repository.consumeOAuthState(input.state);
  if (!oauthState) throw new MicrosoftConnectionError("invalid_state");
  if (oauthState.userId !== input.authenticatedUserId) {
    throw new MicrosoftConnectionError("wrong_user");
  }
  await input.authorizeFamily(oauthState.familyId, oauthState.userId);

  const codeVerifier = decryptCalendarSecret(oauthState.codeVerifierCiphertext);
  const token = await exchangeMicrosoftAuthorizationCode(
    input.code,
    codeVerifier,
  );
  if (!token.refreshToken) {
    throw new MicrosoftConnectionError("missing_refresh_token");
  }
  const refreshToken = token.refreshToken;
  if (!hasMicrosoftCalendarScope(token.scopes)) {
    throw new MicrosoftConnectionError("missing_scope");
  }

  const existing = await repository.getConnection(oauthState.familyId);
  const dedicatedCalendar = await ensureDedicatedCalendar(
    token.accessToken,
    existing?.externalCalendarId ?? null,
  );
  const connection = await (async () => {
    try {
      return await repository.saveConnected({
        familyId: oauthState.familyId,
        userId: oauthState.userId,
        externalCalendarId: dedicatedCalendar.id,
        refreshTokenCiphertext: encryptCalendarSecret(refreshToken),
        scopes: token.scopes,
      });
    } catch (error) {
      if (dedicatedCalendar.created) {
        await deleteMicrosoftCalendar(
          token.accessToken,
          dedicatedCalendar.id,
        ).catch(() => undefined);
      }
      throw error;
    }
  })();
  await repository.enqueueFamily(oauthState.familyId);
  await processMicrosoftCalendarSyncBatch({
    familyId: oauthState.familyId,
    limit: 50,
    repository,
  });
  return {
    familyId: oauthState.familyId,
    connection: toMicrosoftConnectionMetadata(connection),
  };
}

export async function disconnectMicrosoftCalendar(input: {
  familyId: string;
  repository?: MicrosoftCalendarRepository;
}) {
  const repository = input.repository ?? new MicrosoftCalendarRepository();
  const connection = await repository.getConnection(input.familyId);
  if (
    !connection ||
    !connection.refreshTokenCiphertext ||
    !connection.externalCalendarId ||
    connection.status === "disconnected"
  ) {
    throw new MicrosoftConnectionError("not_connected");
  }

  const refreshToken = decryptCalendarSecret(
    connection.refreshTokenCiphertext,
  );
  let warningCode: string | null = null;
  try {
    const token = await refreshMicrosoftAccessToken(refreshToken);
    await deleteMicrosoftCalendar(
      token.accessToken,
      connection.externalCalendarId,
    );
  } catch {
    warningCode = "external_calendar_cleanup_failed";
  }
  await repository.markDisconnected(connection.id, warningCode);
  return {
    disconnected: true,
    warningCode,
    calendarName: MICROSOFT_CALENDAR_NAME,
  };
}
