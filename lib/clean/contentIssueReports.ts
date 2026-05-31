import { supabase } from "@/lib/supabaseClient";
import {
  getCurrentCleanUserId,
  isCleanSchemaMissingError,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";

export const CONTENT_ISSUE_TYPE_OPTIONS = [
  {
    value: "visual_wrong_or_missing",
    label: "Visual is wrong or missing",
  },
  {
    value: "question_wording_confusing",
    label: "Question wording is confusing",
  },
  {
    value: "correct_answer_seems_wrong",
    label: "Correct answer seems wrong",
  },
  {
    value: "answer_options_unclear",
    label: "Answer options are unclear",
  },
  {
    value: "visual_question_mismatch",
    label: "Visual does not match the question",
  },
  {
    value: "save_or_navigation_problem",
    label: "Something did not save or navigate correctly",
  },
  {
    value: "other",
    label: "Other",
  },
] as const;

export type ContentIssueType = (typeof CONTENT_ISSUE_TYPE_OPTIONS)[number]["value"];
export type ContentIssueReportMode = "assessment" | "practice" | "summary";

export type SubmitContentIssueReportInput = {
  mode: ContentIssueReportMode;
  issueType: ContentIssueType;
  note?: string | null;
  sourceUrl?: string | null;
  learnerId?: string | null;
  subjectKey?: string | null;
  strandKey?: string | null;
  stageKey?: string | null;
  pathwayStepId?: string | null;
  stepKey?: string | null;
  stepTitle?: string | null;
  assessmentDepth?: string | null;
  practiceDepth?: string | null;
  stepAssessmentKey?: string | null;
  stepPracticeKey?: string | null;
  parentItemBankKey?: string | null;
  parentPracticeModuleKey?: string | null;
  itemId?: string | null;
  taskId?: string | null;
  prompt?: string | null;
  responseType?: string | null;
  selectedAnswer?: string | null;
  expectedAnswer?: string | null;
  visualSupport?: unknown;
  context?: Record<string, unknown> | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNullString(value: unknown) {
  const text = safe(value);
  return text || null;
}

function normalizeIssueType(value: unknown): ContentIssueType {
  const issueType = safe(value);
  return CONTENT_ISSUE_TYPE_OPTIONS.some((option) => option.value === issueType)
    ? (issueType as ContentIssueType)
    : "other";
}

function normalizeJsonObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export async function submitContentIssueReport(
  input: SubmitContentIssueReportInput,
) {
  const reporterUserId = await getCurrentCleanUserId();

  if (!reporterUserId) {
    return {
      ok: false,
      error: "Please sign in before sending a content issue report.",
    };
  }

  if (!input.mode) {
    return {
      ok: false,
      error: "Choose where this issue happened before sending the report.",
    };
  }

  if (!input.issueType) {
    return {
      ok: false,
      error: "Choose an issue type before sending the report.",
    };
  }

  const response = await supabase.from("content_issue_reports").insert({
    reporter_user_id: reporterUserId,
    learner_id: normalizeNullString(input.learnerId),
    mode: input.mode,
    issue_type: normalizeIssueType(input.issueType),
    note: normalizeNullString(input.note),
    source_url: normalizeNullString(input.sourceUrl),
    subject_key: normalizeNullString(input.subjectKey),
    strand_key: normalizeNullString(input.strandKey),
    stage_key: normalizeNullString(input.stageKey),
    pathway_step_id: normalizeNullString(input.pathwayStepId),
    step_key: normalizeNullString(input.stepKey),
    step_title: normalizeNullString(input.stepTitle),
    assessment_depth: normalizeNullString(input.assessmentDepth),
    practice_depth: normalizeNullString(input.practiceDepth),
    step_assessment_key: normalizeNullString(input.stepAssessmentKey),
    step_practice_key: normalizeNullString(input.stepPracticeKey),
    parent_item_bank_key: normalizeNullString(input.parentItemBankKey),
    parent_practice_module_key: normalizeNullString(input.parentPracticeModuleKey),
    item_id: normalizeNullString(input.itemId),
    task_id: normalizeNullString(input.taskId),
    prompt: normalizeNullString(input.prompt),
    response_type: normalizeNullString(input.responseType),
    selected_answer: normalizeNullString(input.selectedAnswer),
    expected_answer: normalizeNullString(input.expectedAnswer),
    visual_support: input.visualSupport ?? {},
    context: normalizeJsonObject(input.context),
    status: "new",
  });

  if (response.error) {
    const fallback = isCleanSchemaMissingError(response.error)
      ? "Content issue reporting is not available until the database migration has been applied."
      : "We could not send this report just now.";

    return {
      ok: false,
      error: normalizeCleanErrorMessage(response.error, fallback),
    };
  }

  return { ok: true, error: "" };
}
