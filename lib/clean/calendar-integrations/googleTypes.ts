export const GOOGLE_CALENDAR_PROVIDER = "google" as const;
export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.app.created";
export const GOOGLE_CALENDAR_NAME = "MyLearna Homeschool";

export type GoogleConnectionStatus =
  | "pending"
  | "active"
  | "needs_attention"
  | "disconnected";

export type GoogleConnection = {
  id: string;
  familyId: string;
  connectedByUserId: string;
  externalCalendarId: string | null;
  externalCalendarName: string;
  refreshTokenCiphertext: string | null;
  grantedScopes: string[];
  status: GoogleConnectionStatus;
  lastSyncAt: string | null;
  lastSyncStatus: "pending" | "succeeded" | "failed" | null;
  lastErrorCode: string | null;
  connectedAt: string | null;
  disconnectedAt: string | null;
};

export type GoogleConnectionMetadata = {
  externalCalendarName: string;
  status: GoogleConnectionStatus;
  lastSyncAt: string | null;
  lastSyncStatus: "pending" | "succeeded" | "failed" | null;
  lastErrorCode: string | null;
  connectedAt: string | null;
  disconnectedAt: string | null;
};

export type GoogleOAuthState = {
  id: string;
  familyId: string;
  userId: string;
  codeVerifierCiphertext: string;
  expiresAt: string;
};

export type GoogleTokenResponse = {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  scopes: string[];
};
