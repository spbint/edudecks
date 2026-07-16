import type {
  CleanAssessmentSkillStatus,
  CleanAssessmentStatusValue,
} from "@/lib/clean/assessments/types";
import { parsePathwayContextFromNodeIds } from "@/lib/clean/evidence/curriculumContext";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import {
  inferPathwayStageFromYearLevel,
  PATHWAY_STAGE_ORDER,
  type PathwayStageKey,
} from "@/lib/clean/pathways/mathematicsNumberPrototype";
import {
  buildUnifiedPathwayStepStateIndex,
  countRecognizedProgressJudgements,
  resolveEffectiveAssessmentConfidence,
  resolvePathwayStepIdFromContext,
  type UnifiedPathwayStepState,
  type UnifiedPathwayStepStateIndex,
} from "@/lib/clean/pathways/pathwayStepState";
import {
  getAllPathwaySteps,
  type PathwayStepRegistryItem,
} from "@/lib/clean/pathways/pathwayStepRegistry";
import {
  PATHWAY_SUBJECTS,
  type PathwaySubjectKey,
} from "@/lib/clean/pathways/pathwaySubjects";

export type LearningIntelligenceSubjectFilter = "all" | PathwaySubjectKey;
export type LearningAreaStatus =
  | "Active"
  | "Planned"
  | "Evidence recorded"
  | "Not currently active"
  | "Not explored yet";

export type LearningIntelligenceRow = {
  key: string;
  kind: "subject" | "strand";
  subjectKey: PathwaySubjectKey;
  subjectTitle: string;
  strandKey: string | null;
  strandTitle: string | null;
  title: string;
  subtitle: string;
  totalSteps: number;
  evidenceLinkedCount: number;
  includeInReportCount: number;
  assessedCount: number;
  secureStrongCount: number;
  developingCount: number;
  startingEvidenceCount: number;
  notAssessedCount: number;
  progressPercent: number;
  readiness: "Ready" | "Building" | "Not explored yet";
  learningAreaStatus: LearningAreaStatus;
  isActiveLearningArea: boolean;
  latestActivityAt: string | null;
  latestActivityLabel: string;
};

export type LearningIntelligenceActivity = {
  id: string;
  activityType: "evidence" | "assessment";
  subjectKey: PathwaySubjectKey;
  subjectTitle: string;
  strandKey: string;
  strandTitle: string;
  stageKey: string;
  stageTitle: string;
  pathwayStepId: string;
  stepTitle: string;
  label: string;
  summary: string;
  dateValue: string | null;
  dateLabel: string;
  href: string;
};

export type LearningIntelligenceTrendPoint = {
  key: string;
  label: string;
  evidenceCount: number;
  assessmentCount: number;
  totalCount: number;
};

export type LearningIntelligenceInsightItem = {
  key: string;
  subjectKey: PathwaySubjectKey;
  title: string;
  subtitle: string;
  helper: string;
  progressPercent: number;
  secureStrongCount: number;
  evidenceLinkedCount: number;
  notAssessedCount: number;
  href: string;
};

export type LearningIntelligenceNextStep = {
  key: string;
  subjectKey: PathwaySubjectKey;
  subjectTitle: string;
  strandKey: string;
  strandTitle: string;
  stageKey: string;
  stageTitle: string;
  pathwayStepId: string;
  stepTitle: string;
  stepDescription: string;
  reason: string;
  href: string;
};

export type LearningIntelligenceReportingReadiness = {
  readyCount: number;
  buildingCount: number;
  notExploredCount: number;
  readinessPercent: number;
  representedAreaCount: number;
  checklist: Array<{
    key: string;
    label: string;
    complete: boolean;
    helper: string;
  }>;
};

export type LearningIntelligenceSummary = {
  selectedSubjectKey: LearningIntelligenceSubjectFilter;
  selectedSubjectTitle: string;
  scopeLabel: string;
  totalSubjects: number;
  totalStrands: number;
  totalSteps: number;
  visibleRowCount: number;
  assessedCount: number;
  secureStrongCount: number;
  developingCount: number;
  startingEvidenceCount: number;
  notAssessedCount: number;
  evidenceLinkedCount: number;
  overallProgressPercent: number;
  learnerStageKey: PathwayStageKey;
  allSubjectRows: LearningIntelligenceRow[];
  scopeRows: LearningIntelligenceRow[];
  recentActivity: LearningIntelligenceActivity[];
  progressOverTime: LearningIntelligenceTrendPoint[];
  strengths: LearningIntelligenceInsightItem[];
  focusAreas: LearningIntelligenceInsightItem[];
  reportingReadiness: LearningIntelligenceReportingReadiness;
  nextLearningSteps: LearningIntelligenceNextStep[];
  activeLearningAreaRows: LearningIntelligenceRow[];
  inactiveLearningAreaRows: LearningIntelligenceRow[];
  activeLearningAreaCount: number;
  portfolioEvidenceCount: number;
  reportEvidenceCount: number;
  hasMeaningfulProgressTrend: boolean;
  hasMeaningfulStrengths: boolean;
  areaCountLabel: string;
  isEmpty: boolean;
};

type BuildLearningIntelligenceSummaryInput = {
  assessmentStatuses?: CleanAssessmentSkillStatus[];
  evidenceEntries?: CleanEvidenceEntry[];
  learnerYearLevel?: string | null;
  selectedSubjectKey?: LearningIntelligenceSubjectFilter | null;
  referenceDate?: string | Date | null;
};

type TimelineCounter = {
  evidenceCount: number;
  assessmentCount: number;
};

type StepActivityDescriptor = {
  pathwayStepId: string;
  registryItem: PathwayStepRegistryItem;
  state: UnifiedPathwayStepState | null;
  assessmentConfidence: CleanAssessmentStatusValue;
  hasEvidence: boolean;
  evidenceLinkedCount: number;
  includeInReportCount: number;
};

const REGISTRY_ITEMS = getAllPathwaySteps();
const DETAILED_SUBJECTS = PATHWAY_SUBJECTS.filter((subject) => subject.status === "detailed");
const REGISTRY_BY_ID = new Map(REGISTRY_ITEMS.map((item) => [item.id, item]));
const SUBJECT_PATHWAYS_HREF = "/my-pathways";
const PROGRESS_HREF = "/my-pathways";
const EVIDENCE_HREF = "/my-capture";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseDateValue(
  value: string | Date | null | undefined,
  mode: "date" | "datetime" = "datetime",
) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const normalized = safe(value);
  if (!normalized) return null;

  const parsed =
    mode === "date"
      ? new Date(`${normalized}T00:00:00`)
      : new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildDateSortValue(
  primary: string | null | undefined,
  fallback: string | null | undefined = null,
  primaryMode: "date" | "datetime" = "datetime",
) {
  return (
    parseDateValue(primary, primaryMode)?.getTime() ||
    parseDateValue(fallback)?.getTime() ||
    0
  );
}

function formatDateLabel(dateValue: string | null | undefined) {
  const date =
    parseDateValue(dateValue, "date") || parseDateValue(dateValue, "datetime");
  if (!date) return "Date not recorded";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeDateLabel(
  dateValue: string | null | undefined,
  referenceDate: Date,
) {
  const date =
    parseDateValue(dateValue, "date") || parseDateValue(dateValue, "datetime");
  if (!date) return "Date not recorded";

  const referenceMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const targetMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (referenceMidnight.getTime() - targetMidnight.getTime()) / 86400000,
  );

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 31) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDateLabel(dateValue);
}

function summarizeText(value: string | null | undefined, maxLength = 110) {
  const text = safe(value);
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

function getAssessmentConfidence(state: UnifiedPathwayStepState | null) {
  return resolveEffectiveAssessmentConfidence(state);
}

function getProgressPercent(
  totalSteps: number,
  secureStrongCount: number,
  developingCount: number,
  startingEvidenceCount: number,
) {
  if (totalSteps <= 0) return 0;

  const weightedScore =
    secureStrongCount * 1 +
    developingCount * 0.65 +
    startingEvidenceCount * 0.35;

  return Math.max(0, Math.min(100, Math.round((weightedScore / totalSteps) * 100)));
}

function getLearningAreaStatus(
  rowKind: "subject" | "strand",
  totals: {
    evidenceLinkedCount: number;
    assessedCount: number;
    secureStrongCount: number;
    developingCount: number;
    startingEvidenceCount: number;
  },
): LearningAreaStatus {
  if (totals.assessedCount > 0 || totals.developingCount > 0 || totals.secureStrongCount > 0) {
    return "Active";
  }

  if (totals.evidenceLinkedCount > 0 || totals.startingEvidenceCount > 0) {
    return "Evidence recorded";
  }

  return rowKind === "subject" ? "Not currently active" : "Not explored yet";
}

function isActiveLearningAreaStatus(status: LearningAreaStatus) {
  return status === "Active" || status === "Planned" || status === "Evidence recorded";
}

export function formatLearningAreaCount(count: number) {
  return `${count} ${count === 1 ? "area" : "areas"}`;
}

function buildStepDescriptor(
  item: PathwayStepRegistryItem,
  index: UnifiedPathwayStepStateIndex,
): StepActivityDescriptor {
  const state = index.get(item.id) ?? null;
  const assessmentConfidence = getAssessmentConfidence(state);
  const hasEvidence = (state?.linkedEvidenceCount ?? 0) > 0;
  const includeInReportCount =
    state?.linkedEvidenceEntries.filter((entry) => entry.includeInReport).length ?? 0;

  return {
    pathwayStepId: item.id,
    registryItem: item,
    state,
    assessmentConfidence,
    hasEvidence,
    evidenceLinkedCount: state?.linkedEvidenceCount ?? 0,
    includeInReportCount,
  };
}

function buildRowFromDescriptors(
  key: string,
  kind: "subject" | "strand",
  subjectKey: PathwaySubjectKey,
  subjectTitle: string,
  strandKey: string | null,
  strandTitle: string | null,
  title: string,
  subtitle: string,
  descriptors: StepActivityDescriptor[],
) {
  const totals = descriptors.reduce(
    (result, descriptor) => {
      const assessmentConfidence = descriptor.assessmentConfidence;
      const hasEvidence = descriptor.hasEvidence;

      result.totalSteps += 1;
      result.evidenceLinkedCount += descriptor.evidenceLinkedCount > 0 ? 1 : 0;
      result.includeInReportCount += descriptor.includeInReportCount > 0 ? 1 : 0;

      if (
        assessmentConfidence === "Secure" ||
        assessmentConfidence === "Strong"
      ) {
        result.secureStrongCount += 1;
        result.assessedCount += 1;
      } else if (
        assessmentConfidence === "Still developing" ||
        assessmentConfidence === "Developing"
      ) {
        result.developingCount += 1;
        result.assessedCount += 1;
      } else if (hasEvidence) {
        result.startingEvidenceCount += 1;
      } else {
        result.notAssessedCount += 1;
      }

      const latestTimestamp =
        buildDateSortValue(
          descriptor.state?.latestEvidenceEntry?.observedOn ?? null,
          descriptor.state?.assessmentStatusRecord?.updatedAt ??
            descriptor.state?.assessmentStatusRecord?.createdAt ??
            descriptor.state?.latestEvidenceEntry?.updatedAt ??
            descriptor.state?.latestEvidenceEntry?.createdAt ??
            null,
          descriptor.state?.latestEvidenceEntry?.observedOn ? "date" : "datetime",
        );

      if (latestTimestamp > result.latestActivityTimestamp) {
        result.latestActivityTimestamp = latestTimestamp;
      }

      return result;
    },
    {
      totalSteps: 0,
      evidenceLinkedCount: 0,
      includeInReportCount: 0,
      assessedCount: 0,
      secureStrongCount: 0,
      developingCount: 0,
      startingEvidenceCount: 0,
      notAssessedCount: 0,
      latestActivityTimestamp: 0,
    },
  );

  const progressPercent = getProgressPercent(
    totals.totalSteps,
    totals.secureStrongCount,
    totals.developingCount,
    totals.startingEvidenceCount,
  );

  const readiness =
    totals.includeInReportCount > 0 && totals.secureStrongCount > 0
      ? "Ready"
      : totals.evidenceLinkedCount > 0 || totals.assessedCount > 0
        ? "Building"
        : "Not explored yet";
  const learningAreaStatus = getLearningAreaStatus(kind, totals);

  return {
    key,
    kind,
    subjectKey,
    subjectTitle,
    strandKey,
    strandTitle,
    title,
    subtitle,
    totalSteps: totals.totalSteps,
    evidenceLinkedCount: totals.evidenceLinkedCount,
    includeInReportCount: totals.includeInReportCount,
    assessedCount: totals.assessedCount,
    secureStrongCount: totals.secureStrongCount,
    developingCount: totals.developingCount,
    startingEvidenceCount: totals.startingEvidenceCount,
    notAssessedCount: totals.notAssessedCount,
    progressPercent,
    readiness,
    learningAreaStatus,
    isActiveLearningArea: isActiveLearningAreaStatus(learningAreaStatus),
    latestActivityAt:
      totals.latestActivityTimestamp > 0
        ? new Date(totals.latestActivityTimestamp).toISOString()
        : null,
    latestActivityLabel:
      totals.latestActivityTimestamp > 0
        ? `Updated ${formatDateLabel(
            new Date(totals.latestActivityTimestamp).toISOString().slice(0, 10),
          )}`
        : "No recent activity yet",
  } satisfies LearningIntelligenceRow;
}

function compareRows(left: LearningIntelligenceRow, right: LearningIntelligenceRow) {
  return left.title.localeCompare(right.title);
}

function buildSubjectRows(index: UnifiedPathwayStepStateIndex) {
  return DETAILED_SUBJECTS.map((subject) => {
    const subjectSteps = REGISTRY_ITEMS.filter((item) => item.subjectKey === subject.key);
    const strandCount = new Set(subjectSteps.map((item) => item.strandKey)).size;
    const descriptors = subjectSteps.map((item) => buildStepDescriptor(item, index));

    return buildRowFromDescriptors(
      subject.key,
      "subject",
      subject.key,
      subject.title,
      null,
      null,
      subject.title,
      `${strandCount} strands tracked across ${subjectSteps.length} pathway steps`,
      descriptors,
    );
  });
}

function buildStrandRows(
  subjectKey: PathwaySubjectKey,
  subjectTitle: string,
  index: UnifiedPathwayStepStateIndex,
) {
  const subjectSteps = REGISTRY_ITEMS.filter((item) => item.subjectKey === subjectKey);
  const strandMap = new Map<string, StepActivityDescriptor[]>();

  subjectSteps.forEach((item) => {
    const descriptors = strandMap.get(item.strandKey) ?? [];
    descriptors.push(buildStepDescriptor(item, index));
    strandMap.set(item.strandKey, descriptors);
  });

  return [...strandMap.entries()]
    .map(([strandKey, descriptors]) => {
      const strandTitle = descriptors[0]?.registryItem.strandTitle || "Strand";
      return buildRowFromDescriptors(
        `${subjectKey}::${strandKey}`,
        "strand",
        subjectKey,
        subjectTitle,
        strandKey,
        strandTitle,
        strandTitle,
        `${descriptors.length} pathway steps across the full developmental band sequence`,
        descriptors,
      );
    })
    .sort(compareRows);
}

function buildActivityItems(
  selectedSubjectKey: LearningIntelligenceSubjectFilter,
  evidenceEntries: CleanEvidenceEntry[],
  assessmentStatuses: CleanAssessmentSkillStatus[],
  referenceDate: Date,
) {
  const evidenceActivity: LearningIntelligenceActivity[] = evidenceEntries
    .map((entry) => {
      const pathwayContext = parsePathwayContextFromNodeIds(entry.curriculumNodeIds);
      const pathwayStepId = resolvePathwayStepIdFromContext(pathwayContext);
      if (!pathwayStepId) return null;

      const registryItem = REGISTRY_BY_ID.get(pathwayStepId);
      if (!registryItem) return null;

      if (
        selectedSubjectKey !== "all" &&
        registryItem.subjectKey !== selectedSubjectKey
      ) {
        return null;
      }

      return {
        id: `evidence:${entry.id}`,
        activityType: "evidence",
        subjectKey: registryItem.subjectKey,
        subjectTitle: registryItem.subjectTitle,
        strandKey: registryItem.strandKey,
        strandTitle: registryItem.strandTitle,
        stageKey: registryItem.stageKey,
        stageTitle: registryItem.stageTitle,
        pathwayStepId,
        stepTitle: registryItem.stepTitle,
        label: "Evidence captured",
        summary:
          summarizeText(entry.title, 72) ||
          summarizeText(entry.whatHappened, 96) ||
          "Evidence linked to this pathway step.",
        dateValue: entry.observedOn || entry.updatedAt || entry.createdAt,
        dateLabel: formatRelativeDateLabel(
          entry.observedOn || entry.updatedAt || entry.createdAt,
          referenceDate,
        ),
        href: EVIDENCE_HREF,
      } satisfies LearningIntelligenceActivity;
    })
    .filter(Boolean) as LearningIntelligenceActivity[];

  const assessmentActivity: LearningIntelligenceActivity[] = assessmentStatuses
    .map((status) => {
      const pathwayStepId = safe(status.pathwayStepId);
      if (!pathwayStepId) return null;

      const registryItem = REGISTRY_BY_ID.get(pathwayStepId);
      if (!registryItem) return null;

      if (
        selectedSubjectKey !== "all" &&
        registryItem.subjectKey !== selectedSubjectKey
      ) {
        return null;
      }

      return {
        id: `assessment:${status.id}`,
        activityType: "assessment",
        subjectKey: registryItem.subjectKey,
        subjectTitle: registryItem.subjectTitle,
        strandKey: registryItem.strandKey,
        strandTitle: registryItem.strandTitle,
        stageKey: registryItem.stageKey,
        stageTitle: registryItem.stageTitle,
        pathwayStepId,
        stepTitle: registryItem.stepTitle,
        label: `Progress judgement: ${status.status}`,
        summary:
          summarizeText(status.note, 96) ||
          `Saved progress judgement for ${registryItem.stepTitle}.`,
        dateValue: status.updatedAt || status.createdAt,
        dateLabel: formatRelativeDateLabel(status.updatedAt || status.createdAt, referenceDate),
        href: PROGRESS_HREF,
      } satisfies LearningIntelligenceActivity;
    })
    .filter(Boolean) as LearningIntelligenceActivity[];

  return [...evidenceActivity, ...assessmentActivity]
    .sort((left, right) => {
      return (
        buildDateSortValue(right.dateValue) - buildDateSortValue(left.dateValue)
      );
    })
    .slice(0, 5);
}

function buildProgressOverTime(
  selectedSubjectKey: LearningIntelligenceSubjectFilter,
  evidenceEntries: CleanEvidenceEntry[],
  assessmentStatuses: CleanAssessmentSkillStatus[],
  referenceDate: Date,
) {
  const monthStarts = Array.from({ length: 6 }, (_, index) =>
    addMonths(startOfMonth(referenceDate), index - 5),
  );
  const counters = new Map<string, TimelineCounter>(
    monthStarts.map((date) => [buildMonthKey(date), { evidenceCount: 0, assessmentCount: 0 }]),
  );

  evidenceEntries.forEach((entry) => {
    const pathwayContext = parsePathwayContextFromNodeIds(entry.curriculumNodeIds);
    const pathwayStepId = resolvePathwayStepIdFromContext(pathwayContext);
    if (!pathwayStepId) return;

    const registryItem = REGISTRY_BY_ID.get(pathwayStepId);
    if (!registryItem) return;

    if (
      selectedSubjectKey !== "all" &&
      registryItem.subjectKey !== selectedSubjectKey
    ) {
      return;
    }

    const observedDate = parseDateValue(entry.observedOn, "date");
    if (!observedDate) return;

    const key = buildMonthKey(observedDate);
    const counter = counters.get(key);
    if (!counter) return;
    counter.evidenceCount += 1;
  });

  assessmentStatuses.forEach((status) => {
    const pathwayStepId = safe(status.pathwayStepId);
    if (!pathwayStepId) return;

    const registryItem = REGISTRY_BY_ID.get(pathwayStepId);
    if (!registryItem) return;

    if (
      selectedSubjectKey !== "all" &&
      registryItem.subjectKey !== selectedSubjectKey
    ) {
      return;
    }

    const savedDate =
      parseDateValue(status.updatedAt) || parseDateValue(status.createdAt);
    if (!savedDate) return;

    const key = buildMonthKey(savedDate);
    const counter = counters.get(key);
    if (!counter) return;
    counter.assessmentCount += 1;
  });

  return monthStarts.map((date) => {
    const key = buildMonthKey(date);
    const counter = counters.get(key) || { evidenceCount: 0, assessmentCount: 0 };
    return {
      key,
      label: date.toLocaleDateString(undefined, { month: "short" }),
      evidenceCount: counter.evidenceCount,
      assessmentCount: counter.assessmentCount,
      totalCount: counter.evidenceCount + counter.assessmentCount,
    } satisfies LearningIntelligenceTrendPoint;
  });
}

function buildInsightHelper(row: LearningIntelligenceRow) {
  if (row.readiness === "Ready") {
    return "Report-ready evidence and progress judgements support this area.";
  }

  if (row.developingCount > 0) {
    return "Several steps may benefit from another saved observation.";
  }

  if (row.startingEvidenceCount > 0) {
    return "Learning records have started to build in this area.";
  }

  if (!row.isActiveLearningArea) {
    return "This area is quiet until it becomes part of the current plan.";
  }

  return "This area is beginning to build.";
}

function buildStrengths(rows: LearningIntelligenceRow[]) {
  return [...rows]
    .sort((left, right) => {
      if (right.progressPercent !== left.progressPercent) {
        return right.progressPercent - left.progressPercent;
      }
      if (right.secureStrongCount !== left.secureStrongCount) {
        return right.secureStrongCount - left.secureStrongCount;
      }
      return right.evidenceLinkedCount - left.evidenceLinkedCount;
    })
    .filter(
      (row) =>
        row.isActiveLearningArea &&
        (row.secureStrongCount > 0 || row.evidenceLinkedCount + row.assessedCount >= 3),
    )
    .slice(0, 3)
    .map((row) => ({
      key: `strength:${row.key}`,
      subjectKey: row.subjectKey,
      title: row.title,
      subtitle: row.kind === "subject" ? "Learning area" : row.subjectTitle,
      helper: buildInsightHelper(row),
      progressPercent: row.progressPercent,
      secureStrongCount: row.secureStrongCount,
      evidenceLinkedCount: row.evidenceLinkedCount,
      notAssessedCount: row.notAssessedCount,
      href: SUBJECT_PATHWAYS_HREF,
    }));
}

function buildFocusAreas(rows: LearningIntelligenceRow[]) {
  return [...rows]
    .sort((left, right) => {
      if (right.developingCount !== left.developingCount) {
        return right.developingCount - left.developingCount;
      }
      if (right.startingEvidenceCount !== left.startingEvidenceCount) {
        return right.startingEvidenceCount - left.startingEvidenceCount;
      }
      return left.progressPercent - right.progressPercent;
    })
    .filter(
      (row) =>
        row.isActiveLearningArea &&
        (row.developingCount > 0 || row.startingEvidenceCount > 0),
    )
    .slice(0, 3)
    .map((row) => ({
      key: `focus:${row.key}`,
      subjectKey: row.subjectKey,
      title: row.title,
      subtitle: row.kind === "subject" ? "Learning area" : row.subjectTitle,
      helper: buildInsightHelper(row),
      progressPercent: row.progressPercent,
      secureStrongCount: row.secureStrongCount,
      evidenceLinkedCount: row.evidenceLinkedCount,
      notAssessedCount: row.notAssessedCount,
      href: SUBJECT_PATHWAYS_HREF,
    }));
}

function buildReportingReadiness(
  rows: LearningIntelligenceRow[],
  evidenceEntries: CleanEvidenceEntry[],
  assessmentStatuses: CleanAssessmentSkillStatus[],
) {
  const activeRows = rows.filter((row) => row.isActiveLearningArea);
  const rowsForReadiness = activeRows.length ? activeRows : rows.filter((row) => row.readiness !== "Not explored yet");
  const readyCount = rowsForReadiness.filter((row) => row.readiness === "Ready").length;
  const buildingCount = rowsForReadiness.filter((row) => row.readiness === "Building").length;
  const notExploredCount = rowsForReadiness.filter(
    (row) => row.readiness === "Not explored yet",
  ).length;
  const totalRows = rowsForReadiness.length || 1;
  const readinessPercent = Math.round(
    ((readyCount + buildingCount * 0.5) / totalRows) * 100,
  );
  const portfolioEvidenceCount = evidenceEntries.filter((entry) => entry.includeInPortfolio).length;
  const reportEvidenceCount = evidenceEntries.filter((entry) => entry.includeInReport).length;
  const progressJudgementCount = countRecognizedProgressJudgements({
    assessmentStatuses,
    evidenceEntries,
  });
  const representedAreaCount = activeRows.length;

  return {
    readyCount,
    buildingCount,
    notExploredCount,
    readinessPercent,
    representedAreaCount,
    checklist: [
      {
        key: "learner-details",
        label: "Learner details",
        complete: true,
        helper: "A learner is selected for this view.",
      },
      {
        key: "recent-evidence",
        label: "Recent learning records",
        complete: evidenceEntries.length > 0,
        helper: evidenceEntries.length > 0
          ? `${evidenceEntries.length} learning ${evidenceEntries.length === 1 ? "record" : "records"} saved.`
          : "Add a learning record when useful work is completed.",
      },
      {
        key: "portfolio-evidence",
        label: "Portfolio evidence",
        complete: portfolioEvidenceCount > 0,
        helper: portfolioEvidenceCount > 0
          ? `${portfolioEvidenceCount} ${portfolioEvidenceCount === 1 ? "record is" : "records are"} marked for portfolio.`
          : "Choose strong examples for My Portfolio when ready.",
      },
      {
        key: "progress-judgements",
        label: "Progress judgements",
        complete: progressJudgementCount > 0,
        helper: progressJudgementCount > 0
          ? `${progressJudgementCount} progress ${progressJudgementCount === 1 ? "judgement" : "judgements"} recorded.`
          : "Add a progress judgement after reviewing completed work.",
      },
      {
        key: "learning-areas",
        label: "Learning areas represented",
        complete: representedAreaCount > 0,
        helper: representedAreaCount > 0
          ? `${formatLearningAreaCount(representedAreaCount)} represented.`
          : "Learning areas will appear as pathways or evidence are added.",
      },
      {
        key: "report-evidence",
        label: "Report-ready evidence",
        complete: reportEvidenceCount > 0,
        helper: reportEvidenceCount > 0
          ? `${reportEvidenceCount} ${reportEvidenceCount === 1 ? "record is" : "records are"} marked for reports.`
          : "Select report-ready evidence when preparing a report.",
      },
    ],
  } satisfies LearningIntelligenceReportingReadiness;
}

function buildCandidateReason(
  descriptor: StepActivityDescriptor,
  assessmentConfidence: CleanAssessmentStatusValue,
) {
  if (!descriptor.hasEvidence && assessmentConfidence === "Not assessed yet") {
    return "No completed work is linked to this specific step yet. No progress judgement has been saved for this step yet.";
  }

  if (descriptor.hasEvidence && assessmentConfidence === "Not assessed yet") {
    return "Completed work is linked to this step. No progress judgement has been saved for this step yet.";
  }

  if (assessmentConfidence === "Still developing") {
    return "The saved progress judgement shows this step may benefit from another observation.";
  }

  if (assessmentConfidence === "Developing") {
    return "The saved progress judgement shows this step is developing and may be ready for another review.";
  }

  return "This is a useful next step in the current pathway.";
}

function buildNextLearningStepForDescriptors(
  descriptors: StepActivityDescriptor[],
  learnerStageKey: PathwayStageKey,
) {
  const learnerStageIndex = PATHWAY_STAGE_ORDER.indexOf(learnerStageKey);

  const sortedCandidates = [...descriptors].sort((left, right) => {
    const leftAssessment = left.assessmentConfidence;
    const rightAssessment = right.assessmentConfidence;

    const leftPriority =
      !left.hasEvidence && leftAssessment === "Not assessed yet"
        ? 0
        : left.hasEvidence && leftAssessment === "Not assessed yet"
          ? 1
          : leftAssessment === "Still developing"
            ? 2
            : leftAssessment === "Developing"
              ? 3
              : leftAssessment === "Secure"
                ? 4
                : 5;
    const rightPriority =
      !right.hasEvidence && rightAssessment === "Not assessed yet"
        ? 0
        : right.hasEvidence && rightAssessment === "Not assessed yet"
          ? 1
          : rightAssessment === "Still developing"
            ? 2
            : rightAssessment === "Developing"
              ? 3
              : rightAssessment === "Secure"
                ? 4
                : 5;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    const leftStageDistance = Math.abs(left.registryItem.stageOrder - learnerStageIndex);
    const rightStageDistance = Math.abs(right.registryItem.stageOrder - learnerStageIndex);
    if (leftStageDistance !== rightStageDistance) {
      return leftStageDistance - rightStageDistance;
    }

    if (left.registryItem.stageOrder !== right.registryItem.stageOrder) {
      return left.registryItem.stageOrder - right.registryItem.stageOrder;
    }

    return left.registryItem.stepOrder - right.registryItem.stepOrder;
  });

  const candidate = sortedCandidates[0];
  if (!candidate) return null;

  const assessmentConfidence = candidate.assessmentConfidence;
  return {
    key: candidate.pathwayStepId,
    subjectKey: candidate.registryItem.subjectKey,
    subjectTitle: candidate.registryItem.subjectTitle,
    strandKey: candidate.registryItem.strandKey,
    strandTitle: candidate.registryItem.strandTitle,
    stageKey: candidate.registryItem.stageKey,
    stageTitle: candidate.registryItem.stageTitle,
    pathwayStepId: candidate.pathwayStepId,
    stepTitle: candidate.registryItem.stepTitle,
    stepDescription: candidate.registryItem.stepDescription,
    reason: buildCandidateReason(candidate, assessmentConfidence),
    href: SUBJECT_PATHWAYS_HREF,
  } satisfies LearningIntelligenceNextStep;
}

function buildNextLearningSteps(
  rows: LearningIntelligenceRow[],
  learnerStageKey: PathwayStageKey,
  index: UnifiedPathwayStepStateIndex,
) {
  const candidateRows = rows.filter((row) => row.isActiveLearningArea);

  return candidateRows
    .map((row) => {
      const descriptors = REGISTRY_ITEMS.filter((item) => {
        if (row.kind === "subject") {
          return item.subjectKey === row.subjectKey;
        }

        return item.subjectKey === row.subjectKey && item.strandKey === row.strandKey;
      }).map((item) => buildStepDescriptor(item, index));

      return buildNextLearningStepForDescriptors(descriptors, learnerStageKey);
    })
    .filter(Boolean)
    .slice(0, 6) as LearningIntelligenceNextStep[];
}

export function buildLearningIntelligenceSummary(
  input: BuildLearningIntelligenceSummaryInput,
): LearningIntelligenceSummary {
  const selectedSubjectKey = input.selectedSubjectKey || "all";
  const referenceDate =
    parseDateValue(input.referenceDate, "date") ||
    parseDateValue(input.referenceDate) ||
    new Date();
  const learnerStageKey = inferPathwayStageFromYearLevel(input.learnerYearLevel);
  const evidenceEntries = input.evidenceEntries || [];
  const assessmentStatuses = input.assessmentStatuses || [];
  const unifiedIndex = buildUnifiedPathwayStepStateIndex({
    evidenceEntries,
    assessmentStatuses,
  });
  const subjectRows = buildSubjectRows(unifiedIndex);
  const selectedSubject = DETAILED_SUBJECTS.find((subject) => subject.key === selectedSubjectKey);
  const scopeRows =
    selectedSubject && selectedSubjectKey !== "all"
      ? buildStrandRows(selectedSubject.key, selectedSubject.title, unifiedIndex)
      : subjectRows;

  const totals = scopeRows.reduce(
    (result, row) => {
      result.totalSteps += row.totalSteps;
      result.assessedCount += row.assessedCount;
      result.secureStrongCount += row.secureStrongCount;
      result.developingCount += row.developingCount;
      result.startingEvidenceCount += row.startingEvidenceCount;
      result.notAssessedCount += row.notAssessedCount;
      result.evidenceLinkedCount += row.evidenceLinkedCount;
      return result;
    },
    {
      totalSteps: 0,
      assessedCount: 0,
      secureStrongCount: 0,
      developingCount: 0,
      startingEvidenceCount: 0,
      notAssessedCount: 0,
      evidenceLinkedCount: 0,
    },
  );

  const recentActivity = buildActivityItems(
    selectedSubjectKey,
    evidenceEntries,
    assessmentStatuses,
    referenceDate,
  );
  const progressOverTime = buildProgressOverTime(
    selectedSubjectKey,
    evidenceEntries,
    assessmentStatuses,
    referenceDate,
  );
  const strengths = buildStrengths(scopeRows);
  const focusAreas = buildFocusAreas(scopeRows);
  const reportingReadiness = buildReportingReadiness(scopeRows, evidenceEntries, assessmentStatuses);
  const nextLearningSteps = buildNextLearningSteps(scopeRows, learnerStageKey, unifiedIndex);
  const activeLearningAreaRows = scopeRows.filter((row) => row.isActiveLearningArea);
  const inactiveLearningAreaRows = scopeRows.filter((row) => !row.isActiveLearningArea);
  const portfolioEvidenceCount = evidenceEntries.filter((entry) => entry.includeInPortfolio).length;
  const reportEvidenceCount = evidenceEntries.filter((entry) => entry.includeInReport).length;
  const nonZeroTrendPoints = progressOverTime.filter((point) => point.totalCount > 0);
  const totalTrendRecords = progressOverTime.reduce((sum, point) => sum + point.totalCount, 0);
  const hasMeaningfulProgressTrend =
    totalTrendRecords >= 3 && nonZeroTrendPoints.length >= 2;
  const hasMeaningfulStrengths = strengths.length > 0;

  return {
    selectedSubjectKey,
    selectedSubjectTitle: selectedSubject?.title || "All subjects",
    scopeLabel: selectedSubject ? "Strand progress" : "Learning area progress",
    totalSubjects: DETAILED_SUBJECTS.length,
    totalStrands: new Set(REGISTRY_ITEMS.map((item) => `${item.subjectKey}::${item.strandKey}`))
      .size,
    totalSteps: totals.totalSteps,
    visibleRowCount: scopeRows.length,
    assessedCount: totals.assessedCount,
    secureStrongCount: totals.secureStrongCount,
    developingCount: totals.developingCount,
    startingEvidenceCount: totals.startingEvidenceCount,
    notAssessedCount: totals.notAssessedCount,
    evidenceLinkedCount: totals.evidenceLinkedCount,
    overallProgressPercent: getProgressPercent(
      totals.totalSteps,
      totals.secureStrongCount,
      totals.developingCount,
      totals.startingEvidenceCount,
    ),
    learnerStageKey,
    allSubjectRows: subjectRows,
    scopeRows,
    recentActivity,
    progressOverTime,
    strengths,
    focusAreas,
    reportingReadiness,
    nextLearningSteps,
    activeLearningAreaRows,
    inactiveLearningAreaRows,
    activeLearningAreaCount: activeLearningAreaRows.length,
    portfolioEvidenceCount,
    reportEvidenceCount,
    hasMeaningfulProgressTrend,
    hasMeaningfulStrengths,
    areaCountLabel: formatLearningAreaCount(reportingReadiness.representedAreaCount),
    isEmpty:
      recentActivity.length === 0 &&
      totals.evidenceLinkedCount === 0 &&
      totals.assessedCount === 0,
  };
}
