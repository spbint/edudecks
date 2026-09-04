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
export type ParentProgressSource =
  | "assessment-status"
  | "evidence"
  | "pathway"
  | "auto-check";

/**
 * Maps an existing assessment, evidence, or legacy pathway signal to the
 * single vocabulary used in the customer-facing Pathways experience.
 * This is presentation-only: it never changes the underlying signal.
 */
export function toParentProgressStatus(
  value: string | null | undefined,
  source: ParentProgressSource = "pathway",
): ParentProgressStatus | null {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (!normalized) {
    return source === "evidence" ? null : "Not checked yet";
  }

  if (source === "assessment-status") {
    switch (normalized) {
      case "still developing":
        return "Needs support";
      case "developing":
        return "Developing";
      case "secure":
        return "Consolidating";
      case "strong":
        return "Secure";
      case "not assessed yet":
        return "Not checked yet";
      default:
        return null;
    }
  }

  switch (normalized) {
    case "not assessed yet":
    case "not checked yet":
    case "not started":
      return "Not checked yet";
    case "still developing":
    case "needs support":
      return "Needs support";
    case "developing":
    case "working towards":
    case "practising":
    case "evidence started":
      return "Developing";
    case "consolidating":
    case "ready to assess":
      return "Consolidating";
    case "secure":
    case "strong":
    case "goal achieved":
    case "goal achieved + extension":
      return "Secure";
    default:
      return null;
  }
}

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
  return toParentProgressStatus(value, "assessment-status") || "Not checked yet";
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
  return toParentProgressStatus(value, "evidence");
}
