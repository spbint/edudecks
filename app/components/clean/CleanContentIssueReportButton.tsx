"use client";

import { useState } from "react";
import type React from "react";
import {
  type ContentIssueReportMode,
  type ContentIssueType,
} from "@/lib/clean/contentIssueReports";
import ReportProblemDialog from "@/app/components/clean/feedback/ReportProblemDialog";

export type ContentIssueReportContext = {
  mode: ContentIssueReportMode;
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
  context?: Record<string, unknown>;
};

const triggerStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  background: "#ffffff",
  color: "#5B6478",
  borderRadius: 999,
  padding: "7px 11px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
};

const QUESTION_REPORT_OPTIONS: Array<{ value: ContentIssueType; label: string }> = [
  { value: "question_wording_confusing", label: "Question wording is unclear" },
  { value: "correct_answer_seems_wrong", label: "Answer seems wrong" },
  { value: "visual_wrong_or_missing", label: "Visual or image problem" },
  { value: "answer_options_unclear", label: "Hint problem" },
  { value: "visual_question_mismatch", label: "Feedback problem" },
  { value: "save_or_navigation_problem", label: "Worksheet or link problem" },
  { value: "other", label: "Other" },
];

function getSourceUrl() {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

function getRoute() {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search}`;
}

function getUserAgent() {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent;
}

function getModeLabel(mode: ContentIssueReportMode) {
  if (mode === "practice") return "Practise";
  if (mode === "assessment") return "Assess";
  return "Summary";
}

export default function CleanContentIssueReportButton({
  context,
  label = "Report a problem with this question",
}: {
  context: ContentIssueReportContext;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  function getReportContext() {
    return {
      Mode: getModeLabel(context.mode),
      Route: getRoute(),
      URL: getSourceUrl(),
      "Step ID": context.pathwayStepId,
      "Step key": context.stepKey,
      "Step title": context.stepTitle,
      Subject: context.subjectKey,
      Strand: context.strandKey,
      Stage: context.stageKey,
      "Question ID": context.itemId ?? context.taskId,
      Question: context.context?.currentIndex ?? context.context?.taskIndex,
      "Practice depth": context.practiceDepth,
      "Assessment depth": context.assessmentDepth,
      Timestamp: new Date().toISOString(),
      Browser: getUserAgent(),
    };
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={triggerStyle}>
        <span aria-hidden="true" style={{ color: "#6C4DF6", fontSize: 13 }}>
          !
        </span>
        {label}
      </button>
      <ReportProblemDialog
        open={open}
        title="Report a problem with this question"
        description="Tell us what looked wrong or confusing. This will not interrupt the activity."
        type="question"
        categories={QUESTION_REPORT_OPTIONS.map((option) => option.label)}
        defaultCategory="Visual or image problem"
        context={getReportContext}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
