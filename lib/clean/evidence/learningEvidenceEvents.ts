import { listAssessmentAttemptsForLearner } from "@/lib/clean/assessments/attemptClient";
import type { CleanAssessmentAttempt } from "@/lib/clean/assessments/attemptTypes";
import {
  getPathwayStepById,
  parsePathwayStepId,
  type PathwayStepRegistryItem,
} from "@/lib/clean/pathways/pathwayStepRegistry";

export type LearningEvidenceSourceType = "pathway_assessment";

export type LearningEvidenceEvent = {
  id: string;
  learnerId: string;
  familyId: string;
  userId: string | null;
  sourceType: LearningEvidenceSourceType;
  sourceId: string;
  subject: string | null;
  strand: string | null;
  stage: string | null;
  pathwayId: string | null;
  stepId: string | null;
  stepNumber: string | null;
  stepTitle: string | null;
  curriculumCodes: string[];
  title: string;
  summary: string;
  evidenceDate: string | null;
  score: number | null;
  questionCount: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  notSureCount: number;
  supportRecommendedCount: number;
  parentJudgement: string | null;
  reportEligible: boolean;
  portfolioEligible: boolean;
  outputEligible: boolean;
  route: string | null;
  metadata: Record<string, unknown>;
};

export type ListLearningEvidenceEventsOptions = {
  fromDate?: string | null;
  toDate?: string | null;
  limit?: number;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function toTitleCase(value: string) {
  return safe(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function numberFromSnapshot(
  snapshot: Record<string, unknown>,
  key: string,
  fallback = 0,
) {
  const value = Number(snapshot[key]);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.trunc(value));
}

function textFromSnapshot(snapshot: Record<string, unknown>, key: string) {
  return safe(snapshot[key]) || null;
}

function getEvidenceDate(attempt: CleanAssessmentAttempt) {
  return attempt.completedAt || attempt.updatedAt || attempt.createdAt || attempt.startedAt || null;
}

function isDateInRange(value: string | null, fromDate?: string | null, toDate?: string | null) {
  if (!value) return true;

  const dateOnly = value.slice(0, 10);
  if (fromDate && dateOnly < fromDate) return false;
  if (toDate && dateOnly > toDate) return false;
  return true;
}

function resolvePathwayStep(attempt: CleanAssessmentAttempt): PathwayStepRegistryItem | null {
  const parsed =
    parsePathwayStepId(attempt.pathwayStepId) ||
    ({
      subjectKey: attempt.subjectKey,
      strandKey: attempt.strandKey,
      stageKey: attempt.stageKey,
      stepKey: attempt.stepKey,
    } as const);

  return getPathwayStepById(
    parsed.subjectKey,
    parsed.strandKey,
    parsed.stageKey,
    parsed.stepKey,
  );
}

function getStepLabel(step: PathwayStepRegistryItem | null, attempt: CleanAssessmentAttempt) {
  if (step?.legacyStepNumber && step.stepTitle) {
    return `Step ${step.legacyStepNumber} - ${step.stepTitle}`;
  }

  if (step?.stepTitle) return step.stepTitle;

  const snapshotStepTitle = textFromSnapshot(attempt.summarySnapshot, "stepTitle");
  if (snapshotStepTitle) return snapshotStepTitle;

  return toTitleCase(attempt.stepKey) || "pathway step";
}

function buildSummary(args: {
  questionCount: number;
  correctCount: number;
  supportRecommendedCount: number;
  notSureCount: number;
  stepLabel: string;
}) {
  const supportText =
    args.supportRecommendedCount === 1
      ? "1 question marked for more support"
      : `${args.supportRecommendedCount} questions marked for more support`;
  const notSureText = args.notSureCount
    ? `, including ${args.notSureCount} ${args.notSureCount === 1 ? "not-sure response" : "not-sure responses"}`
    : "";

  return `Completed a ${args.questionCount}-question pathway check for ${args.stepLabel}. ${args.correctCount} correct, ${supportText}${notSureText}.`;
}

export function assessmentAttemptToLearningEvidenceEvent(
  attempt: CleanAssessmentAttempt,
): LearningEvidenceEvent {
  const step = resolvePathwayStep(attempt);
  const summarySnapshot = attempt.summarySnapshot;
  const questionCount =
    attempt.itemCount ||
    numberFromSnapshot(summarySnapshot, "itemCount") ||
    numberFromSnapshot(summarySnapshot, "questionCount") ||
    0;
  const attemptedCount =
    attempt.attemptedCount || numberFromSnapshot(summarySnapshot, "attemptedCount");
  const correctCount =
    attempt.autoCorrectCount || numberFromSnapshot(summarySnapshot, "correctCount");
  const incorrectCount =
    attempt.autoIncorrectCount || numberFromSnapshot(summarySnapshot, "incorrectCount");
  const notSureCount = numberFromSnapshot(summarySnapshot, "notSureCount");
  const supportRecommendedCount = Math.max(0, questionCount - correctCount);
  const score = questionCount > 0 ? Math.round((correctCount / questionCount) * 100) : null;
  const stepLabel = getStepLabel(step, attempt);
  const stepNumber =
    step?.legacyStepNumber ||
    textFromSnapshot(summarySnapshot, "stepNumber") ||
    null;
  const subject = step?.subjectTitle || toTitleCase(attempt.subjectKey) || null;
  const strand = step?.strandTitle || toTitleCase(attempt.strandKey) || null;
  const stage = step?.stageTitle || toTitleCase(attempt.stageKey) || null;
  const parentJudgement =
    textFromSnapshot(summarySnapshot, "parentJudgement") ||
    textFromSnapshot(summarySnapshot, "parentJudgementPreview") ||
    null;

  return {
    id: `pathway-assessment:${attempt.id}`,
    learnerId: attempt.learnerId,
    familyId: attempt.familyId,
    userId: attempt.createdByUserId || null,
    sourceType: "pathway_assessment",
    sourceId: attempt.id,
    subject,
    strand,
    stage,
    pathwayId: step?.legacyPathwayKey || null,
    stepId: attempt.pathwayStepId || null,
    stepNumber,
    stepTitle: step?.stepTitle || textFromSnapshot(summarySnapshot, "stepTitle"),
    curriculumCodes: [],
    title: stepNumber ? `${subject || "Pathway"} Step ${stepNumber} check` : `${stepLabel} check`,
    summary: buildSummary({
      questionCount,
      correctCount,
      supportRecommendedCount,
      notSureCount,
      stepLabel,
    }),
    evidenceDate: getEvidenceDate(attempt),
    score,
    questionCount,
    attemptedCount,
    correctCount,
    incorrectCount,
    notSureCount,
    supportRecommendedCount,
    parentJudgement,
    reportEligible: true,
    portfolioEligible: true,
    outputEligible: true,
    route: attempt.sourceRoute,
    metadata: {
      itemBankKey: attempt.itemBankKey,
      mode: attempt.mode,
      pathwayStepId: attempt.pathwayStepId,
      stepKey: attempt.stepKey,
      reviewNeededCount: attempt.reviewNeededCount,
      progressionBandKey: attempt.progressionBandKey,
      curriculumLinksNote: "Curriculum codes are not exposed by the pathway registry yet.",
    },
  };
}

export async function listAssessmentLearningEvidenceEventsForLearner(
  familyId: string,
  learnerId: string,
  options: ListLearningEvidenceEventsOptions = {},
) {
  const attempts = await listAssessmentAttemptsForLearner(familyId, {
    learnerId,
    status: "completed",
    limit: options.limit ?? 100,
  });

  return attempts
    .filter((attempt) => safe(attempt.pathwayStepId))
    .map(assessmentAttemptToLearningEvidenceEvent)
    .filter((event) => isDateInRange(event.evidenceDate, options.fromDate, options.toDate));
}

export async function listAssessmentLearningEvidenceEventsForLearners(
  familyId: string,
  learnerIds: string[],
  options: ListLearningEvidenceEventsOptions = {},
) {
  const uniqueLearnerIds = Array.from(new Set(learnerIds.map(safe).filter(Boolean)));
  if (!safe(familyId) || !uniqueLearnerIds.length) return [] satisfies LearningEvidenceEvent[];

  const groupedEvents = await Promise.all(
    uniqueLearnerIds.map((learnerId) =>
      listAssessmentLearningEvidenceEventsForLearner(familyId, learnerId, options),
    ),
  );

  return groupedEvents
    .flat()
    .sort((left, right) => {
      const leftTime = Date.parse(left.evidenceDate || "") || 0;
      const rightTime = Date.parse(right.evidenceDate || "") || 0;
      return rightTime - leftTime;
    });
}
