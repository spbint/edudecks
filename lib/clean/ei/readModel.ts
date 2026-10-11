import { buildEiEvidenceBalanceState } from "@/lib/clean/ei/evidenceBalance";
import { buildEiEventsFromLearnerThread } from "@/lib/clean/ei/learnerThreadAdapter";
import type {
  EiEvidenceBalanceState,
  EiLearningEvent,
  EiProduct,
  EiSourceKind,
  EiTenantKind,
} from "@/lib/clean/ei/types";
import type { LearnerThreadV1 } from "@/lib/clean/learnerThread/types";

export const EI_COMPETENCY_READ_MODEL_VERSION = "1.0" as const;

export type EiEvidenceGroupReadModel = {
  id: string;
  eventCount: number;
  directionalEventCount: number;
  sourceKinds: EiSourceKind[];
  eventIds: string[];
  latestEventAt: string | null;
  hasInternalContradiction: boolean;
};

export type EiCompetencyReadModel = {
  schemaVersion: typeof EI_COMPETENCY_READ_MODEL_VERSION;
  product: EiProduct;
  tenantKind: EiTenantKind;
  tenantId: string;
  learnerId: string;
  competencyId: string;
  generatedAt: string;
  events: EiLearningEvent[];
  evidenceGroups: EiEvidenceGroupReadModel[];
  state: EiEvidenceBalanceState | null;
  hasContradiction: boolean;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function timestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function productForThread(thread: LearnerThreadV1): EiProduct {
  return thread.product === "mylearna-campus" ? "campus" : "homeschool";
}

function tenantKindForThread(thread: LearnerThreadV1): EiTenantKind {
  if (thread.tenant.type === "family") return "family";
  if (thread.tenant.type === "school") return "school";
  return "organisation";
}

function buildEvidenceGroups(
  events: EiLearningEvent[],
): EiEvidenceGroupReadModel[] {
  const groups = new Map<string, EiLearningEvent[]>();

  events.forEach((event) => {
    const current = groups.get(event.evidenceGroupId) ?? [];
    current.push(event);
    groups.set(event.evidenceGroupId, current);
  });

  return [...groups.entries()]
    .map(([id, groupEvents]) => {
      const positiveCount = groupEvents.filter(
        (event) => event.signal.polarity > 0,
      ).length;
      const negativeCount = groupEvents.filter(
        (event) => event.signal.polarity < 0,
      ).length;
      const latest = groupEvents.reduce(
        (latestValue, event) =>
          timestamp(event.occurredAt) > timestamp(latestValue)
            ? event.occurredAt
            : latestValue,
        "",
      );

      return {
        id,
        eventCount: groupEvents.length,
        directionalEventCount: groupEvents.filter(
          (event) => event.signal.polarity !== 0,
        ).length,
        sourceKinds: [
          ...new Set(groupEvents.map((event) => event.sourceKind)),
        ].sort(),
        eventIds: groupEvents.map((event) => event.id),
        latestEventAt: latest || null,
        hasInternalContradiction:
          positiveCount > 0 && negativeCount > 0,
      };
    })
    .sort((left, right) => {
      const timeDifference =
        timestamp(right.latestEventAt || "") -
        timestamp(left.latestEventAt || "");
      return timeDifference || left.id.localeCompare(right.id);
    });
}

/**
 * Read-only EI vertical slice for one learner + competency.
 *
 * The returned object is serializable and can feed a developer panel or a
 * future product API. It does not persist state or mutate learner records.
 */
export function buildEiCompetencyReadModel(
  thread: LearnerThreadV1,
  competencyId: string,
): EiCompetencyReadModel {
  const normalizedCompetencyId = safe(competencyId);
  const events = buildEiEventsFromLearnerThread(thread)
    .filter((event) => event.competencyId === normalizedCompetencyId)
    .sort((left, right) => {
      const timeDifference =
        timestamp(left.occurredAt) - timestamp(right.occurredAt);
      return timeDifference || left.id.localeCompare(right.id);
    });
  const state = buildEiEvidenceBalanceState(events);
  const evidenceGroups = buildEvidenceGroups(events);
  const positiveGroupCount = evidenceGroups.filter((group) =>
    events.some(
      (event) =>
        event.evidenceGroupId === group.id &&
        event.signal.polarity > 0,
    ),
  ).length;
  const negativeGroupCount = evidenceGroups.filter((group) =>
    events.some(
      (event) =>
        event.evidenceGroupId === group.id &&
        event.signal.polarity < 0,
    ),
  ).length;

  return {
    schemaVersion: EI_COMPETENCY_READ_MODEL_VERSION,
    product: productForThread(thread),
    tenantKind: tenantKindForThread(thread),
    tenantId: safe(thread.tenant.id),
    learnerId: safe(thread.learner.id),
    competencyId: normalizedCompetencyId,
    generatedAt: safe(thread.generatedAt),
    events,
    evidenceGroups,
    state,
    hasContradiction:
      evidenceGroups.some((group) => group.hasInternalContradiction) ||
      (positiveGroupCount > 0 && negativeGroupCount > 0),
  };
}
