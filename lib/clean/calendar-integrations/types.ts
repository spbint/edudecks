import type { FamilyMemberRole } from "@/lib/clean/family/types";

export type CalendarFeedSubscriptionStatus = "active" | "revoked";

export type OutboundCalendarProvider = "google" | "microsoft";

export type OutboundCalendarConnectionStatus =
  | "pending"
  | "active"
  | "needs_attention"
  | "disconnected";

export type OutboundCalendarConnection = {
  id: string;
  familyId: string;
  connectedByUserId: string;
  provider: OutboundCalendarProvider;
  externalCalendarId: string | null;
  externalCalendarName: string;
  refreshTokenCiphertext: string | null;
  grantedScopes: string[];
  status: OutboundCalendarConnectionStatus;
  lastSyncAt: string | null;
  lastSyncStatus: "pending" | "succeeded" | "failed" | null;
  lastErrorCode: string | null;
  connectedAt: string | null;
  disconnectedAt: string | null;
};

export type OutboundCalendarConnectionMetadata = Omit<
  OutboundCalendarConnection,
  | "id"
  | "familyId"
  | "connectedByUserId"
  | "provider"
  | "externalCalendarId"
  | "refreshTokenCiphertext"
  | "grantedScopes"
>;

export type CalendarOAuthState = {
  id: string;
  familyId: string;
  userId: string;
  codeVerifierCiphertext: string;
  expiresAt: string;
};

export type CalendarSyncJob = {
  id: string;
  provider: OutboundCalendarProvider;
  familyId: string;
  calendarItemId: string;
  operation: "upsert" | "delete";
  attempts: number;
  lockToken: string;
};

export type CalendarItemExternalLink = {
  eventId: string;
  etag: string | null;
  version: string | null;
};

export type CalendarFeedSubscriptionMetadata = {
  id: string;
  familyId: string;
  createdByUserId: string;
  status: CalendarFeedSubscriptionStatus;
  createdAt: string;
  updatedAt: string;
  rotatedAt: string | null;
  revokedAt: string | null;
  lastAccessedAt: string | null;
};

export type CalendarIntegrationManagerContext = {
  familyId: string;
  userId: string;
  role: FamilyMemberRole;
};

export type CalendarEventProjection = {
  calendarItemId: string;
  title: string;
  plannedDate: string;
  startsAt: string | null;
  endsAt: string | null;
  allDay: boolean;
  learningArea: string | null;
  version: string | null;
};

export type CalendarProjectionSource = {
  id: unknown;
  title: unknown;
  plannedDate: unknown;
  startsAt: unknown;
  endsAt: unknown;
  learningArea: unknown;
  updatedAt: unknown;
};
