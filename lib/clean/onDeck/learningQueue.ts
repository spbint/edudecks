import {
  DETAILED_SUBJECT_CONFIGS,
} from "@/lib/clean/pathways/detailedSubjectConfigs";
import {
  buildPathwayStepReturnHref,
} from "@/lib/clean/pathways/pathwayNavigationContext";
import {
  getAllPathwaySteps,
  type PathwayStepRegistryItem,
} from "@/lib/clean/pathways/pathwayStepRegistry";
import {
  PATHWAY_SUBJECTS,
  type PathwaySubjectKey,
} from "@/lib/clean/pathways/pathwaySubjects";
import {
  isCustomerPathwaySubjectActive,
} from "@/lib/clean/pathways/pathwaySubjectAvailability";
import {
  getWorksheetResourceForPathwayStep,
} from "@/lib/clean/resources/mathWorksheetResources";

export type LearningQueueSourceType = "pathway_step";

export type LearningQueueItem = {
  id: string;
  familyId: string;
  learnerId: string;
  sourceType: LearningQueueSourceType;
  subjectKey: PathwaySubjectKey;
  strandKey: string;
  stageKey: string;
  stepKey: string;
  pathwayStepId: string;
  displayTitle: string | null;
  position: number;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type LearningQueueItemRow = {
  id: string;
  family_id: string;
  learner_id: string;
  source_type?: string | null;
  subject_key: string;
  strand_key: string;
  stage_key: string;
  step_key: string;
  pathway_step_id: string;
  display_title?: string | null;
  position?: number | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type OnDeckResolvedItem = {
  item: LearningQueueItem;
  registryItem: PathwayStepRegistryItem | null;
  available: boolean;
  subjectLabel: string;
  pathwayLabel: string | null;
  stageLabel: string | null;
  title: string;
  worksheetAvailable: boolean;
  href: string | null;
};

export type LearningQueuePositionUpdate = {
  id: string;
  position: number;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNullString(value: unknown) {
  const text = safe(value);
  return text || null;
}

function normalizePosition(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function normalizeSubjectKey(value: unknown): PathwaySubjectKey {
  const candidate = safe(value) as PathwaySubjectKey;
  return PATHWAY_SUBJECTS.some((subject) => subject.key === candidate)
    ? candidate
    : "mathematics";
}

export function toLearningQueueItem(row: LearningQueueItemRow): LearningQueueItem {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    learnerId: safe(row.learner_id),
    sourceType: "pathway_step",
    subjectKey: normalizeSubjectKey(row.subject_key),
    strandKey: safe(row.strand_key),
    stageKey: safe(row.stage_key),
    stepKey: safe(row.step_key),
    pathwayStepId: safe(row.pathway_step_id),
    displayTitle: normalizeNullString(row.display_title),
    position: normalizePosition(row.position),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

export function sortLearningQueueItems(items: readonly LearningQueueItem[]) {
  return [...items].sort(
    (left, right) =>
      left.position - right.position ||
      safe(left.createdAt).localeCompare(safe(right.createdAt)) ||
      left.id.localeCompare(right.id),
  );
}

export function isPathwayStepEligibleForOnDeck(
  registryItem: PathwayStepRegistryItem | null | undefined,
) {
  if (!registryItem) return false;
  const subject = PATHWAY_SUBJECTS.find((item) => item.key === registryItem.subjectKey);
  if (!subject) return false;
  return isCustomerPathwaySubjectActive(
    subject,
    DETAILED_SUBJECT_CONFIGS[registryItem.subjectKey],
  );
}

export function getOnDeckRegistryItem(pathwayStepId: string) {
  return getAllPathwaySteps().find((item) => item.id === safe(pathwayStepId)) || null;
}

export function getLearningQueueSourceKey(learnerId: string, pathwayStepId: string) {
  return `${safe(learnerId)}::pathway_step::${safe(pathwayStepId)}`;
}

export function buildOnDeckStepHref(
  item: Pick<
    LearningQueueItem,
    "learnerId" | "subjectKey" | "strandKey" | "stageKey" | "stepKey" | "pathwayStepId"
  >,
  pathname = "/my-pathways",
  detailStepId = item.stepKey,
) {
  return buildPathwayStepReturnHref({
    pathname,
    subjectKey: item.subjectKey,
    strandKey: item.strandKey,
    stageKey: item.stageKey,
    pathwayStepId: item.pathwayStepId,
    stepKey: item.stepKey,
    learnerId: item.learnerId,
    detailPanelId: `pathway-step-${item.strandKey}-${item.stageKey}-${detailStepId}`,
  });
}

export function resolveOnDeckItem(
  item: LearningQueueItem,
  pathname = "/my-pathways",
): OnDeckResolvedItem {
  const registryItem = getOnDeckRegistryItem(item.pathwayStepId);
  const available =
    Boolean(registryItem) &&
    isPathwayStepEligibleForOnDeck(registryItem) &&
    registryItem?.subjectKey === item.subjectKey &&
    registryItem?.strandKey === item.strandKey &&
    registryItem?.stageKey === item.stageKey &&
    registryItem?.stepKey === item.stepKey;
  const worksheetResource = available
    ? getWorksheetResourceForPathwayStep({
        pathwayStepId: item.pathwayStepId,
        stepKey: item.stepKey,
        subjectKey: item.subjectKey,
        strandKey: item.strandKey,
        stageKey: item.stageKey,
      })
    : null;

  return {
    item,
    registryItem,
    available,
    subjectLabel: registryItem?.subjectTitle || item.subjectKey,
    pathwayLabel: registryItem?.pathwayLabel || null,
    stageLabel: registryItem?.stageTitle || null,
    title: available
      ? registryItem?.stepTitle || item.displayTitle || "Learning step"
      : "This learning step is no longer available.",
    worksheetAvailable: Boolean(worksheetResource),
    href: available ? buildOnDeckStepHref(item, pathname, registryItem?.legacyStepNumber) : null,
  };
}

export function getLearningQueueMoveUpdates(
  items: readonly LearningQueueItem[],
  itemId: string,
  direction: "up" | "down",
): LearningQueuePositionUpdate[] {
  const sorted = sortLearningQueueItems(items);
  const index = sorted.findIndex((item) => item.id === itemId);
  if (index < 0) return [];

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= sorted.length) return [];

  const next = [...sorted];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

  return next
    .map((item, position) => ({ id: item.id, position }))
    .filter((update) => sorted.find((item) => item.id === update.id)?.position !== update.position);
}
