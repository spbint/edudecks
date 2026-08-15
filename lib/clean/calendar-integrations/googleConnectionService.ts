import {
  GoogleCalendarApiError,
  createGoogleCalendar,
  deleteGoogleCalendar,
  getGoogleCalendar,
} from "@/lib/clean/calendar-integrations/googleApi";
import {
  GoogleCalendarRepository,
  toGoogleConnectionMetadata,
} from "@/lib/clean/calendar-integrations/googleRepository";
import {
  GOOGLE_CALENDAR_SCOPE,
  GOOGLE_CALENDAR_NAME,
} from "@/lib/clean/calendar-integrations/googleTypes";
import {
  buildGoogleAuthorizationUrl,
  createGoogleOAuthRequest,
  exchangeGoogleAuthorizationCode,
  refreshGoogleAccessToken,
  revokeGoogleToken,
} from "@/lib/clean/calendar-integrations/googleOAuth";
import {
  decryptCalendarSecret,
  encryptCalendarSecret,
} from "@/lib/clean/calendar-integrations/secretProtection";
import { processGoogleCalendarSyncBatch } from "@/lib/clean/calendar-integrations/googleSync";

export class GoogleConnectionError extends Error {
  constructor(
    public readonly code:
      | "invalid_state"
      | "wrong_user"
      | "missing_refresh_token"
      | "missing_scope"
      | "not_connected"
      | "connection_failed",
  ) {
    super("Google Calendar connection could not be completed.");
    this.name = "GoogleConnectionError";
  }
}

export async function startGoogleCalendarConnection(input: {
  familyId: string;
  userId: string;
  repository?: GoogleCalendarRepository;
}) {
  const repository = input.repository ?? new GoogleCalendarRepository();
  const request = createGoogleOAuthRequest();
  await repository.createOAuthState({
    familyId: input.familyId,
    userId: input.userId,
    rawState: request.state,
    codeVerifierCiphertext: encryptCalendarSecret(request.codeVerifier),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
  return {
    authorizationUrl: buildGoogleAuthorizationUrl(
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
      const existing = await getGoogleCalendar(accessToken, existingCalendarId);
      if (existing.id) return { id: existing.id, created: false };
    } catch (error) {
      if (!(error instanceof GoogleCalendarApiError) || error.code !== "not_found") {
        throw error;
      }
    }
  }
  const created = await createGoogleCalendar(accessToken);
  if (!created.id) throw new GoogleConnectionError("connection_failed");
  return { id: created.id, created: true };
}

export async function completeGoogleCalendarConnection(input: {
  state: string;
  code: string;
  authenticatedUserId: string;
  authorizeFamily: (familyId: string, userId: string) => Promise<void>;
  repository?: GoogleCalendarRepository;
}) {
  const repository = input.repository ?? new GoogleCalendarRepository();
  const oauthState = await repository.consumeOAuthState(input.state);
  if (!oauthState) throw new GoogleConnectionError("invalid_state");
  if (oauthState.userId !== input.authenticatedUserId) {
    throw new GoogleConnectionError("wrong_user");
  }
  await input.authorizeFamily(oauthState.familyId, oauthState.userId);

  const codeVerifier = decryptCalendarSecret(oauthState.codeVerifierCiphertext);
  const token = await exchangeGoogleAuthorizationCode(input.code, codeVerifier);
  if (!token.refreshToken) {
    throw new GoogleConnectionError("missing_refresh_token");
  }
  const refreshToken = token.refreshToken;
  if (!token.scopes.includes(GOOGLE_CALENDAR_SCOPE)) {
    throw new GoogleConnectionError("missing_scope");
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
        await deleteGoogleCalendar(
          token.accessToken,
          dedicatedCalendar.id,
        ).catch(() => undefined);
      }
      throw error;
    }
  })();
  await repository.enqueueFamily(oauthState.familyId);
  await processGoogleCalendarSyncBatch({
    familyId: oauthState.familyId,
    limit: 50,
    repository,
  });
  return {
    familyId: oauthState.familyId,
    connection: toGoogleConnectionMetadata(connection),
  };
}

export async function disconnectGoogleCalendar(input: {
  familyId: string;
  repository?: GoogleCalendarRepository;
}) {
  const repository = input.repository ?? new GoogleCalendarRepository();
  const connection = await repository.getConnection(input.familyId);
  if (
    !connection ||
    !connection.refreshTokenCiphertext ||
    !connection.externalCalendarId ||
    connection.status === "disconnected"
  ) {
    throw new GoogleConnectionError("not_connected");
  }

  const refreshToken = decryptCalendarSecret(connection.refreshTokenCiphertext);
  let warningCode: string | null = null;
  try {
    const token = await refreshGoogleAccessToken(refreshToken);
    await deleteGoogleCalendar(token.accessToken, connection.externalCalendarId);
  } catch {
    warningCode = "external_calendar_cleanup_failed";
  }
  const revoked = await revokeGoogleToken(refreshToken).catch(() => false);
  if (!revoked && !warningCode) warningCode = "provider_revocation_failed";
  await repository.markDisconnected(connection.id, warningCode);
  return { disconnected: true, warningCode, calendarName: GOOGLE_CALENDAR_NAME };
}
