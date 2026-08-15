export const GOOGLE_CALENDAR_PROVIDER = "google" as const;
export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.app.created";
export const GOOGLE_CALENDAR_NAME = "MyLearna Homeschool";

export type GoogleConnectionStatus = OutboundCalendarConnectionStatus;
export type GoogleConnection = OutboundCalendarConnection;
export type GoogleConnectionMetadata = OutboundCalendarConnectionMetadata;
export type GoogleOAuthState = CalendarOAuthState;

export type GoogleTokenResponse = {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  scopes: string[];
};
import type {
  CalendarOAuthState,
  OutboundCalendarConnection,
  OutboundCalendarConnectionMetadata,
  OutboundCalendarConnectionStatus,
} from "@/lib/clean/calendar-integrations/types";
