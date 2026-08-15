import { canManageCalendarIntegrations } from "@/lib/clean/calendar-integrations/authorization";
import { generateCalendarFeedToken } from "@/lib/clean/calendar-integrations/tokens";
import type {
  CalendarFeedSubscriptionMetadata,
  CalendarIntegrationManagerContext,
} from "@/lib/clean/calendar-integrations/types";

export type CalendarFeedManagementStore = {
  findByFamily(familyId: string): Promise<CalendarFeedSubscriptionMetadata | null>;
  create(input: {
    familyId: string;
    userId: string;
    tokenHash: string;
    tokenPrefix: string;
    now: string;
  }): Promise<CalendarFeedSubscriptionMetadata>;
  reactivate(input: {
    id: string;
    familyId: string;
    userId: string;
    tokenHash: string;
    tokenPrefix: string;
    now: string;
  }): Promise<CalendarFeedSubscriptionMetadata>;
  rotate(input: {
    id: string;
    familyId: string;
    tokenHash: string;
    tokenPrefix: string;
    now: string;
  }): Promise<CalendarFeedSubscriptionMetadata>;
  revoke(input: {
    id: string;
    familyId: string;
    now: string;
  }): Promise<CalendarFeedSubscriptionMetadata>;
};

export class CalendarFeedManagementError extends Error {
  constructor(
    public readonly code:
      | "forbidden"
      | "already_active"
      | "not_found"
      | "persistence_failed",
    message: string,
  ) {
    super(message);
    this.name = "CalendarFeedManagementError";
  }
}

function requireManager(context: CalendarIntegrationManagerContext) {
  if (!canManageCalendarIntegrations(context.role)) {
    throw new CalendarFeedManagementError(
      "forbidden",
      "Only a family owner or parent can manage calendar connections.",
    );
  }
}

export async function getAppleCalendarFeedStatus(
  context: CalendarIntegrationManagerContext,
  store: CalendarFeedManagementStore,
) {
  requireManager(context);
  return store.findByFamily(context.familyId);
}

export async function createAppleCalendarFeed(
  context: CalendarIntegrationManagerContext,
  store: CalendarFeedManagementStore,
  createToken = generateCalendarFeedToken,
  now = () => new Date().toISOString(),
) {
  requireManager(context);
  const existing = await store.findByFamily(context.familyId);
  if (existing?.status === "active") {
    throw new CalendarFeedManagementError(
      "already_active",
      "An Apple Calendar feed is already active for this family.",
    );
  }

  const token = createToken();
  const timestamp = now();
  const subscription = existing
    ? await store.reactivate({
        id: existing.id,
        familyId: context.familyId,
        userId: context.userId,
        tokenHash: token.tokenHash,
        tokenPrefix: token.tokenPrefix,
        now: timestamp,
      })
    : await store.create({
        familyId: context.familyId,
        userId: context.userId,
        tokenHash: token.tokenHash,
        tokenPrefix: token.tokenPrefix,
        now: timestamp,
      });

  return {
    subscription,
    rawToken: token.rawToken,
    tokenPrefix: token.tokenPrefix,
  };
}

export async function rotateAppleCalendarFeed(
  context: CalendarIntegrationManagerContext,
  store: CalendarFeedManagementStore,
  createToken = generateCalendarFeedToken,
  now = () => new Date().toISOString(),
) {
  requireManager(context);
  const existing = await store.findByFamily(context.familyId);
  if (!existing || existing.status !== "active") {
    throw new CalendarFeedManagementError(
      "not_found",
      "No active Apple Calendar feed was found.",
    );
  }

  const token = createToken();
  const subscription = await store.rotate({
    id: existing.id,
    familyId: context.familyId,
    tokenHash: token.tokenHash,
    tokenPrefix: token.tokenPrefix,
    now: now(),
  });
  return {
    subscription,
    rawToken: token.rawToken,
    tokenPrefix: token.tokenPrefix,
  };
}

export async function revokeAppleCalendarFeed(
  context: CalendarIntegrationManagerContext,
  store: CalendarFeedManagementStore,
  now = () => new Date().toISOString(),
) {
  requireManager(context);
  const existing = await store.findByFamily(context.familyId);
  if (!existing || existing.status !== "active") {
    throw new CalendarFeedManagementError(
      "not_found",
      "No active Apple Calendar feed was found.",
    );
  }

  return store.revoke({
    id: existing.id,
    familyId: context.familyId,
    now: now(),
  });
}
