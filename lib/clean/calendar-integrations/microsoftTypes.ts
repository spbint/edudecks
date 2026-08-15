import type {
  CalendarOAuthState,
  OutboundCalendarConnection,
  OutboundCalendarConnectionMetadata,
  OutboundCalendarConnectionStatus,
} from "@/lib/clean/calendar-integrations/types";

export const MICROSOFT_CALENDAR_PROVIDER = "microsoft" as const;
export const MICROSOFT_CALENDAR_SCOPE = "Calendars.ReadWrite";
export const MICROSOFT_CALENDAR_NAME = "MyLearna Homeschool";
export const MICROSOFT_OAUTH_SCOPES = [
  "offline_access",
  MICROSOFT_CALENDAR_SCOPE,
] as const;

export type MicrosoftConnectionStatus = OutboundCalendarConnectionStatus;
export type MicrosoftConnection = OutboundCalendarConnection;
export type MicrosoftConnectionMetadata = OutboundCalendarConnectionMetadata;
export type MicrosoftOAuthState = CalendarOAuthState;

export type MicrosoftTokenResponse = {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  scopes: string[];
};

export function hasMicrosoftCalendarScope(scopes: string[]) {
  return scopes.some((scope) => {
    const normalized = scope.trim().toLowerCase();
    return (
      normalized === MICROSOFT_CALENDAR_SCOPE.toLowerCase() ||
      normalized.endsWith(`/${MICROSOFT_CALENDAR_SCOPE.toLowerCase()}`)
    );
  });
}
