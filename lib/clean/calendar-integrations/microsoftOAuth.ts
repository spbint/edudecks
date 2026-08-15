import { createHash, randomBytes } from "node:crypto";
import {
  MICROSOFT_OAUTH_SCOPES,
  type MicrosoftTokenResponse,
} from "@/lib/clean/calendar-integrations/microsoftTypes";
import { calendarEncryptionEnvironmentReady } from "@/lib/clean/calendar-integrations/secretProtection";
import { calendarIntegrationAdminEnvironmentReady } from "@/lib/clean/calendar-integrations/serverAdminClient";

const MICROSOFT_AUTHORIZATION_ENDPOINT =
  "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MICROSOFT_TOKEN_ENDPOINT =
  "https://login.microsoftonline.com/common/oauth2/v2.0/token";

export class MicrosoftOAuthError extends Error {
  constructor(
    public readonly code:
      | "configuration"
      | "exchange_failed"
      | "refresh_failed"
      | "revoked",
  ) {
    super("Microsoft Calendar authorization could not be completed.");
    this.name = "MicrosoftOAuthError";
  }
}

function config() {
  const clientId = String(process.env.MICROSOFT_CALENDAR_CLIENT_ID ?? "").trim();
  const clientSecret = String(
    process.env.MICROSOFT_CALENDAR_CLIENT_SECRET ?? "",
  ).trim();
  const redirectUri = String(
    process.env.MICROSOFT_CALENDAR_REDIRECT_URI ?? "",
  ).trim();
  let parsedRedirect: URL;
  try {
    parsedRedirect = new URL(redirectUri);
  } catch {
    throw new MicrosoftOAuthError("configuration");
  }
  const secureProtocol =
    parsedRedirect.protocol === "https:" ||
    (parsedRedirect.protocol === "http:" &&
      parsedRedirect.hostname === "localhost");
  if (
    !clientId ||
    !clientSecret ||
    !secureProtocol ||
    parsedRedirect.username ||
    parsedRedirect.password ||
    parsedRedirect.search ||
    parsedRedirect.hash ||
    parsedRedirect.pathname !==
      "/api/calendar-connections/microsoft/callback"
  ) {
    throw new MicrosoftOAuthError("configuration");
  }
  return { clientId, clientSecret, redirectUri: parsedRedirect.toString() };
}

export function microsoftCalendarEnvironmentReady() {
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

export function microsoftCalendarSettingsReturnUrl(
  result: "connected" | "error",
) {
  const { redirectUri } = config();
  const url = new URL("/my-settings", new URL(redirectUri).origin);
  url.searchParams.set("calendar", `microsoft-${result}`);
  return url;
}

export function createMicrosoftOAuthRequest() {
  const state = randomBytes(32).toString("base64url");
  const codeVerifier = randomBytes(64).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier, "utf8")
    .digest("base64url");
  return { state, codeVerifier, codeChallenge };
}

export function buildMicrosoftAuthorizationUrl(
  state: string,
  codeChallenge: string,
) {
  const { clientId, redirectUri } = config();
  const url = new URL(MICROSOFT_AUTHORIZATION_ENDPOINT);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", MICROSOFT_OAUTH_SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

function parseTokenResponse(value: unknown): MicrosoftTokenResponse {
  const body = (value ?? {}) as Record<string, unknown>;
  const accessToken = String(body.access_token ?? "").trim();
  if (!accessToken) throw new MicrosoftOAuthError("exchange_failed");
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

async function tokenRequest(
  body: URLSearchParams,
  failure: "exchange_failed" | "refresh_failed",
) {
  const response = await fetch(MICROSOFT_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!response.ok) {
    const providerCode = String(
      ((await response.json().catch(() => null)) as { error?: unknown } | null)
        ?.error ?? "",
    );
    throw new MicrosoftOAuthError(
      providerCode === "invalid_grant" ? "revoked" : failure,
    );
  }
  return parseTokenResponse(await response.json());
}

export async function exchangeMicrosoftAuthorizationCode(
  code: string,
  codeVerifier: string,
) {
  const { clientId, clientSecret, redirectUri } = config();
  return tokenRequest(
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      scope: MICROSOFT_OAUTH_SCOPES.join(" "),
    }),
    "exchange_failed",
  );
}

export async function refreshMicrosoftAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = config();
  return tokenRequest(
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: MICROSOFT_OAUTH_SCOPES.join(" "),
    }),
    "refresh_failed",
  );
}
