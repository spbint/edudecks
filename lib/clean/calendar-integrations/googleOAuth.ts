import { createHash, randomBytes } from "node:crypto";
import {
  GOOGLE_CALENDAR_SCOPE,
  type GoogleTokenResponse,
} from "@/lib/clean/calendar-integrations/googleTypes";
import { calendarEncryptionEnvironmentReady } from "@/lib/clean/calendar-integrations/secretProtection";
import { calendarIntegrationAdminEnvironmentReady } from "@/lib/clean/calendar-integrations/serverAdminClient";

const GOOGLE_AUTHORIZATION_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";

export class GoogleOAuthError extends Error {
  constructor(
    public readonly code:
      | "configuration"
      | "exchange_failed"
      | "refresh_failed"
      | "revoked",
  ) {
    super("Google Calendar authorization could not be completed.");
    this.name = "GoogleOAuthError";
  }
}

function config() {
  const clientId = String(process.env.GOOGLE_CALENDAR_CLIENT_ID ?? "").trim();
  const clientSecret = String(
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET ?? "",
  ).trim();
  const redirectUri = String(
    process.env.GOOGLE_CALENDAR_REDIRECT_URI ?? "",
  ).trim();
  let parsedRedirect: URL;
  try {
    parsedRedirect = new URL(redirectUri);
  } catch {
    throw new GoogleOAuthError("configuration");
  }
  const secureProtocol =
    parsedRedirect.protocol === "https:" ||
    (parsedRedirect.protocol === "http:" && parsedRedirect.hostname === "localhost");
  if (
    !clientId ||
    !clientSecret ||
    !secureProtocol ||
    parsedRedirect.username ||
    parsedRedirect.password ||
    parsedRedirect.search ||
    parsedRedirect.hash ||
    parsedRedirect.pathname !== "/api/calendar-connections/google/callback"
  ) {
    throw new GoogleOAuthError("configuration");
  }
  return { clientId, clientSecret, redirectUri: parsedRedirect.toString() };
}

export function googleCalendarEnvironmentReady() {
  try {
    config();
    return (
      calendarEncryptionEnvironmentReady() &&
      calendarIntegrationAdminEnvironmentReady()
    );
  } catch {
    return false;
  }
}

export function googleCalendarSettingsReturnUrl(result: "connected" | "error") {
  const { redirectUri } = config();
  const url = new URL("/my-settings", new URL(redirectUri).origin);
  url.searchParams.set("calendar", `google-${result}`);
  return url;
}

export function createGoogleOAuthRequest() {
  const state = randomBytes(32).toString("base64url");
  const codeVerifier = randomBytes(64).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier, "utf8")
    .digest("base64url");
  return { state, codeVerifier, codeChallenge };
}

export function buildGoogleAuthorizationUrl(state: string, codeChallenge: string) {
  const { clientId, redirectUri } = config();
  const url = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_CALENDAR_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

function parseTokenResponse(value: unknown): GoogleTokenResponse {
  const body = (value ?? {}) as Record<string, unknown>;
  const accessToken = String(body.access_token ?? "").trim();
  if (!accessToken) throw new GoogleOAuthError("exchange_failed");
  return {
    accessToken,
    refreshToken: String(body.refresh_token ?? "").trim() || null,
    expiresIn:
      typeof body.expires_in === "number" && Number.isFinite(body.expires_in)
        ? body.expires_in
        : null,
    scopes: String(body.scope ?? "")
      .split(/\s+/)
      .map((scope) => scope.trim())
      .filter(Boolean),
  };
}

export async function exchangeGoogleAuthorizationCode(
  code: string,
  codeVerifier: string,
) {
  const { clientId, clientSecret, redirectUri } = config();
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new GoogleOAuthError("exchange_failed");
  return parseTokenResponse(await response.json());
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = config();
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new GoogleOAuthError(response.status === 400 ? "revoked" : "refresh_failed");
  }
  return parseTokenResponse(await response.json());
}

export async function revokeGoogleToken(refreshToken: string) {
  const response = await fetch(GOOGLE_REVOKE_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: refreshToken }),
    cache: "no-store",
  });
  return response.ok || response.status === 400;
}
