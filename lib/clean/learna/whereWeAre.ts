import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import { parsePathwayContextFromNodeIds } from "@/lib/clean/evidence/curriculumContext";
import type { LearningQueueItem } from "@/lib/clean/onDeck/learningQueue";
import {
  buildOnDeckStepHref,
  resolveOnDeckItem,
} from "@/lib/clean/onDeck/learningQueue";
import {
  DETAILED_SUBJECT_CONFIGS,
} from "@/lib/clean/pathways/detailedSubjectConfigs";
import type {
  CurrentLearningCandidate,
} from "@/lib/clean/pathways/currentLearningCandidates";
import {
  getPathwayStepsByStrand,
  type PathwayStepRegistryItem,
} from "@/lib/clean/pathways/pathwayStepRegistry";
import {
  PATHWAY_SUBJECTS,
  type PathwaySubjectKey,
} from "@/lib/clean/pathways/pathwaySubjects";
import {
  isCustomerPathwaySubjectActive,
} from "@/lib/clean/pathways/pathwaySubjectAvailability";
import { getWorksheetResourceForPathwayStep } from "@/lib/clean/resources/mathWorksheetResources";

export type WhereWeAreSubjectSummary = {
  subjectKey: PathwaySubjectKey;
  subjectTitle: string;
  workingOn: PathwayStepRegistryItem | null;
  workingOnSource: CurrentLearningCandidate["source"] | null;
  upNext: PathwayStepRegistryItem | null;
  onDeckCount: number;
  onDeckTitles: string[];
  recentLearningCount: number;
  worksheetAvailable: boolean;
  openStepHref: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalized(value: unknown) {
  return safe(value).toLowerCase();
}

export function getActiveWhereWeAreSubjects() {
  return PATHWAY_SUBJECTS.filter((subject) =>
    isCustomerPathwaySubjectActive(subject, DETAILED_SUBJECT_CONFIGS[subject.key]),
  );
}

export function getCanonicalNextPathwayStep(
  step: PathwayStepRegistryItem | null | undefined,
) {
  if (!step) return null;

  return (
    getPathwayStepsByStrand(step.subjectKey, step.strandKey)
      .filter((candidate) => candidate.stageKey === step.stageKey)
      .sort((left, right) => left.stepOrder - right.stepOrder)
      .find((candidate) => candidate.stepOrder > step.stepOrder) || null
  );
}

function evidenceBelongsToLearner(entry: CleanEvidenceEntry, learnerId: string) {
  const expectedLearnerId = safe(learnerId);
  if (!expectedLearnerId) return true;
  return (
    entry.learnerId === expectedLearnerId ||
    (entry.participantLearnerIds || []).includes(expectedLearnerId)
  );
}

function evidenceSubjectKey(entry: CleanEvidenceEntry): PathwaySubjectKey | null {
  const pathwayContext = parsePathwayContextFromNodeIds(entry.curriculumNodeIds);
  const pathwaySubjectKey = safe(pathwayContext?.subjectKey) as PathwaySubjectKey;
  if (PATHWAY_SUBJECTS.some((subject) => subject.key === pathwaySubjectKey)) {
    return pathwaySubjectKey;
  }

  const learningArea = normalized(entry.learningArea);
  if (!learningArea) return null;

  return (
    PATHWAY_SUBJECTS.find(
      (subject) =>
        normalized(subject.key) === learningArea ||
        normalized(subject.title) === learningArea,
    )?.key || null
  );
}

function countRecentLearningForSubject(input: {
  evidenceEntries: readonly CleanEvidenceEntry[];
  learnerId: string;
  subjectKey: PathwaySubjectKey;
}) {
  return input.evidenceEntries.filter(
    (entry) =>
      evidenceBelongsToLearner(entry, input.learnerId) &&
      evidenceSubjectKey(entry) === input.subjectKey,
  ).length;
}

function onDeckItemsForSubject(input: {
  onDeckItems: readonly LearningQueueItem[];
  learnerId: string;
  subjectKey: PathwaySubjectKey;
}) {
  const learnerId = safe(input.learnerId);
  return input.onDeckItems
    .filter(
      (item) =>
        item.subjectKey === input.subjectKey &&
        (!learnerId || item.learnerId === learnerId),
    )
    .sort(
      (left, right) =>
        left.position - right.position ||
        safe(left.createdAt).localeCompare(safe(right.createdAt)) ||
        left.id.localeCompare(right.id),
    );
}

export function buildWhereWeAreSubjectSummaries(input: {
  learnerId: string;
  currentCandidates: readonly CurrentLearningCandidate[];
  evidenceEntries: readonly CleanEvidenceEntry[];
  onDeckItems: readonly LearningQueueItem[];
  pathwayPathname?: string;
}) {
  const activeSubjects = getActiveWhereWeAreSubjects();

  return activeSubjects.map((subject): WhereWeAreSubjectSummary => {
    const workingCandidate =
      input.currentCandidates.find(
        (candidate) => candidate.registryItem.subjectKey === subject.key,
      ) || null;
    const workingOn = workingCandidate?.registryItem || null;
    const upNext = getCanonicalNextPathwayStep(workingOn);
    const subjectOnDeckItems = onDeckItemsForSubject({
      onDeckItems: input.onDeckItems,
      learnerId: input.learnerId,
      subjectKey: subject.key,
    });
    const onDeckTitles = subjectOnDeckItems
      .map((item) => resolveOnDeckItem(item, input.pathwayPathname).title)
      .slice(0, 3);
    const worksheetResource = workingOn
      ? getWorksheetResourceForPathwayStep({
          pathwayStepId: workingOn.id,
          stepKey: workingOn.stepKey,
          subjectKey: workingOn.subjectKey,
          strandKey: workingOn.strandKey,
          stageKey: workingOn.stageKey,
        })
      : null;

    return {
      subjectKey: subject.key,
      subjectTitle: subject.title,
      workingOn,
      workingOnSource: workingCandidate?.source || null,
      upNext,
      onDeckCount: subjectOnDeckItems.length,
      onDeckTitles,
      recentLearningCount: countRecentLearningForSubject({
        evidenceEntries: input.evidenceEntries,
        learnerId: input.learnerId,
        subjectKey: subject.key,
      }),
      worksheetAvailable: Boolean(worksheetResource),
      openStepHref: workingOn
        ? buildOnDeckStepHref(
            {
              learnerId: input.learnerId,
              subjectKey: workingOn.subjectKey,
              strandKey: workingOn.strandKey,
              stageKey: workingOn.stageKey,
              stepKey: workingOn.stepKey,
              pathwayStepId: workingOn.id,
            },
            input.pathwayPathname || "/my-pathways",
            workingOn.legacyStepNumber,
          )
        : null,
    };
  });
}
