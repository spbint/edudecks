import type { FamilyMemberRole } from "@/lib/clean/family/types";

export type CalendarFeedSubscriptionStatus = "active" | "revoked";

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
