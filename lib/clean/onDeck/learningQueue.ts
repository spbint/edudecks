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

export type LearningQueueSourceType = "pathway_step" | "custom_learning";

export type LearningQueueItem = {
  id: string;
  familyId: string;
  learnerId: string;
  sourceType: LearningQueueSourceType;
  subjectKey: PathwaySubjectKey | null;
  strandKey: string | null;
  stageKey: string | null;
  stepKey: string | null;
  pathwayStepId: string | null;
  customLearningItemId: string | null;
  customTitle: string | null;
  customLearningArea: string | null;
  customNote: string | null;
  resources: CustomLearningResource[];
  displayTitle: string | null;
  position: number;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CustomLearningResource = {
  id: string;
  resourceType: "web_link" | "reference";
  label: string | null;
  url: string | null;
  referenceText: string | null;
  position: number;
};

export type LearningQueueItemRow = {
  id: string;
  family_id: string;
  learner_id: string;
  source_type?: string | null;
  subject_key?: string | null;
  strand_key?: string | null;
  stage_key?: string | null;
  step_key?: string | null;
  pathway_step_id?: string | null;
  custom_learning_item_id?: string | null;
  custom_learning_item?: {
    id?: string | null;
    title?: string | null;
    learning_area?: string | null;
    note?: string | null;
    custom_learning_resources?: Array<{
      id?: string | null;
      resource_type?: string | null;
      label?: string | null;
      url?: string | null;
      reference_text?: string | null;
      position?: number | null;
    }> | null;
  } | null;
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

function normalizeResourceType(value: unknown): "web_link" | "reference" {
  return safe(value) === "web_link" ? "web_link" : "reference";
}

function normalizeSubjectKey(value: unknown): PathwaySubjectKey {
  const candidate = safe(value) as PathwaySubjectKey;
  return PATHWAY_SUBJECTS.some((subject) => subject.key === candidate)
    ? candidate
    : "mathematics";
}

function normalizeSourceType(value: unknown): LearningQueueSourceType {
  return safe(value) === "custom_learning" ? "custom_learning" : "pathway_step";
}

export function toLearningQueueItem(row: LearningQueueItemRow): LearningQueueItem {
  const resources = (row.custom_learning_item?.custom_learning_resources ?? [])
    .map((resource) => ({
      id: safe(resource.id),
      resourceType: normalizeResourceType(resource.resource_type),
      label: normalizeNullString(resource.label),
      url: normalizeNullString(resource.url),
      referenceText: normalizeNullString(resource.reference_text),
      position: normalizePosition(resource.position),
    }))
    .filter((resource) => resource.id)
    .sort((left, right) => left.position - right.position || left.id.localeCompare(right.id));
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    learnerId: safe(row.learner_id),
    sourceType: normalizeSourceType(row.source_type),
    subjectKey: row.source_type === "custom_learning" ? null : normalizeSubjectKey(row.subject_key),
    strandKey: normalizeNullString(row.strand_key),
    stageKey: normalizeNullString(row.stage_key),
    stepKey: normalizeNullString(row.step_key),
    pathwayStepId: normalizeNullString(row.pathway_step_id),
    customLearningItemId: normalizeNullString(row.custom_learning_item_id),
    customTitle: normalizeNullString(row.custom_learning_item?.title),
    customLearningArea: normalizeNullString(row.custom_learning_item?.learning_area),
    customNote: normalizeNullString(row.custom_learning_item?.note),
    resources,
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
  if (!item.subjectKey || !item.strandKey || !item.stageKey || !item.stepKey || !item.pathwayStepId) {
    return "";
  }
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
  if (item.sourceType === "custom_learning") {
    return {
      item,
      registryItem: null,
      available: Boolean(item.customLearningItemId && item.customTitle),
      subjectLabel: item.customLearningArea || "Custom learning",
      pathwayLabel: null,
      stageLabel: null,
      title: item.customTitle || item.displayTitle || "Custom learning",
      worksheetAvailable: false,
      href: null,
    };
  }
  if (!item.pathwayStepId || !item.subjectKey || !item.strandKey || !item.stageKey || !item.stepKey) {
    return {
      item,
      registryItem: null,
      available: false,
      subjectLabel: "Learning",
      pathwayLabel: null,
      stageLabel: null,
      title: "This learning step is no longer available.",
      worksheetAvailable: false,
      href: null,
    };
  }
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
    subjectLabel: registryItem?.subjectTitle || item.subjectKey || "Learning",
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
