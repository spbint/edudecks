import type {
  CleanAssessmentStatusValue,
  UpsertCleanAssessmentSkillStatusInput,
} from "@/lib/clean/assessments/types";

export const PARENT_PROGRESS_STATUS_VALUES = [
  "Not checked yet",
  "Needs support",
  "Developing",
  "Consolidating",
  "Secure",
] as const;

export type ParentProgressStatus = (typeof PARENT_PROGRESS_STATUS_VALUES)[number];

const PARENT_TO_STORED_PROGRESS: Record<
  ParentProgressStatus,
  CleanAssessmentStatusValue
> = {
  "Not checked yet": "Not assessed yet",
  "Needs support": "Still developing",
  Developing: "Developing",
  Consolidating: "Secure",
  Secure: "Strong",
};

export function parentProgressToStoredStatus(
  value: ParentProgressStatus,
): CleanAssessmentStatusValue {
  return PARENT_TO_STORED_PROGRESS[value];
}

export function storedProgressToParentStatus(
  value: CleanAssessmentStatusValue | null | undefined,
): ParentProgressStatus {
  switch (value) {
    case "Still developing":
      return "Needs support";
    case "Developing":
      return "Developing";
    case "Secure":
      return "Consolidating";
    case "Strong":
      return "Secure";
    case "Not assessed yet":
    default:
      return "Not checked yet";
  }
}

export function buildParentProgressStatusInput(input: {
  learnerId: string;
  subjectKey: UpsertCleanAssessmentSkillStatusInput["subjectKey"];
  pathwayStepId: string;
  stageKey: UpsertCleanAssessmentSkillStatusInput["stageKey"];
  strandKey: string;
  stepKey: string;
  status: ParentProgressStatus;
  note?: string | null;
}): UpsertCleanAssessmentSkillStatusInput {
  return {
    learnerId: input.learnerId,
    subjectKey: input.subjectKey,
    skillKey: input.pathwayStepId,
    stageKey: input.stageKey,
    status: parentProgressToStoredStatus(input.status),
    note: input.note ?? null,
    pathwayStepId: input.pathwayStepId,
    strandKey: input.strandKey,
    stepKey: input.stepKey,
  };
}

export function evidenceProgressToParentStatus(
  value: string | null | undefined,
): ParentProgressStatus | null {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  switch (normalized) {
    case "needs support":
      return "Needs support";
    case "working towards":
    case "developing":
      return "Developing";
    case "consolidating":
      return "Consolidating";
    case "secure":
    case "goal achieved":
    case "goal achieved + extension":
    case "strong":
      return "Secure";
    default:
      return null;
  }
}
