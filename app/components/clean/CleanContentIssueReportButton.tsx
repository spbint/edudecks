"use client";

import { useEffect, useState } from "react";
import type React from "react";
import {
  type ContentIssueReportMode,
  type ContentIssueType,
} from "@/lib/clean/contentIssueReports";
import {
  buildReportProblemMailto,
  MYLEARNA_SUPPORT_EMAIL,
} from "@/app/components/clean/feedback/reportProblemMailto";

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

type SubmitState = "idle" | "opened" | "copied" | "failed";

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

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 60,
  background: "rgba(15,23,42,0.36)",
  display: "grid",
  placeItems: "center",
  padding: 16,
};

const dialogStyle: React.CSSProperties = {
  width: "min(100%, 520px)",
  border: "1px solid #E7EAF2",
  borderRadius: 20,
  background: "#ffffff",
  padding: 18,
  display: "grid",
  gap: 14,
  boxShadow: "0 24px 70px rgba(15,23,42,0.22)",
};

const labelStyle: React.CSSProperties = {
  color: "#17204B",
  fontSize: 13,
  fontWeight: 650,
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #6C4DF6",
  background: "#6C4DF6",
  color: "#ffffff",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 650,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
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

function getIssueLabel(value: ContentIssueType) {
  return (
    QUESTION_REPORT_OPTIONS.find((option) => option.value === value)?.label ??
    "Other"
  );
}

export default function CleanContentIssueReportButton({
  context,
  label = "Report a problem with this question",
}: {
  context: ContentIssueReportContext;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] =
    useState<ContentIssueType>("visual_wrong_or_missing");
  const [note, setNote] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function getReportDetails() {
    return buildReportProblemMailto({
      subject:
        context.mode === "summary"
          ? "MyLearna activity report"
          : "MyLearna question report",
      type: context.mode === "summary" ? "Activity" : "Question",
      category: getIssueLabel(issueType),
      message: note,
      context: [
        ["Mode", getModeLabel(context.mode)],
        ["Route", getRoute()],
        ["URL", getSourceUrl()],
        ["Step ID", context.pathwayStepId],
        ["Step key", context.stepKey],
        ["Step title", context.stepTitle],
        ["Subject", context.subjectKey],
        ["Strand", context.strandKey],
        ["Stage", context.stageKey],
        ["Question ID", context.itemId ?? context.taskId],
        ["Question", context.context?.currentIndex ?? context.context?.taskIndex],
        ["Practice depth", context.practiceDepth],
        ["Assessment depth", context.assessmentDepth],
        ["Timestamp", new Date().toISOString()],
        ["Browser", getUserAgent()],
      ],
    });
  }

  function openEmail() {
    const report = getReportDetails();
    window.location.href = report.href;
    setSubmitState("opened");
    setMessage("Your email app should open with the report details filled in.");
  }

  async function copyReportDetails() {
    const report = getReportDetails();

    try {
      await navigator.clipboard.writeText(
        `${report.body}\n\nEmail to: ${MYLEARNA_SUPPORT_EMAIL}`,
      );
      setSubmitState("copied");
      setMessage(`Report details copied. Email them to ${MYLEARNA_SUPPORT_EMAIL}.`);
    } catch {
      setSubmitState("failed");
      setMessage(
        `Could not copy automatically. Please email ${MYLEARNA_SUPPORT_EMAIL}.`,
      );
    }
  }

  const reportOpened = submitState === "opened" || submitState === "copied";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={triggerStyle}>
        <span aria-hidden="true" style={{ color: "#6C4DF6", fontSize: 13 }}>
          !
        </span>
        {label}
      </button>
      {open ? (
        <div style={overlayStyle} role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="content-issue-title"
            style={dialogStyle}
          >
            <div>
              <div
                id="content-issue-title"
                style={{
                  color: "#17204B",
                  fontSize: 19,
                  fontWeight: 650,
                  lineHeight: 1.2,
                }}
              >
                Report a problem with this question
              </div>
              <div style={{ color: "#64748b", lineHeight: 1.5, marginTop: 4 }}>
                Tell us what looked wrong or confusing. This will not interrupt the activity.
              </div>
            </div>

            {reportOpened ? (
              <div
                style={{
                  border: "1px solid #bbf7d0",
                  borderRadius: 12,
                  background: "#f0fdf4",
                  color: "#166534",
                  padding: 12,
                  fontWeight: 650,
                }}
              >
                {message}
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gap: 8 }}>
                  <label htmlFor="content-issue-type" style={labelStyle}>
                    Category
                  </label>
                  <select
                    id="content-issue-type"
                    value={issueType}
                    onChange={(event) =>
                      setIssueType(event.target.value as ContentIssueType)
                    }
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: 12,
                      padding: "10px 12px",
                      font: "inherit",
                      color: "#0f172a",
                      background: "#ffffff",
                    }}
                  >
                    {QUESTION_REPORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <label htmlFor="content-issue-note" style={labelStyle}>
                    Tell us what you noticed
                  </label>
                  <textarea
                    id="content-issue-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Example: I think the answer marked correct is wrong, or the visual does not match the question."
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: 12,
                      padding: "10px 12px",
                      minHeight: 96,
                      resize: "vertical",
                      font: "inherit",
                      color: "#0f172a",
                    }}
                  />
                </div>

                {message ? (
                  <div
                    style={{
                      border: "1px solid #fecaca",
                      borderRadius: 12,
                      background: "#fef2f2",
                      color: "#991b1b",
                      padding: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    {message}
                  </div>
                ) : null}
              </>
            )}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSubmitState("idle");
                  setMessage("");
                  setNote("");
                }}
                style={secondaryButtonStyle}
              >
                {reportOpened ? "Close" : "Cancel"}
              </button>
              {!reportOpened ? (
                <button
                  type="button"
                  onClick={() => void copyReportDetails()}
                  style={secondaryButtonStyle}
                >
                  Copy report details
                </button>
              ) : null}
              {!reportOpened ? (
                <button type="button" onClick={openEmail} style={buttonStyle}>
                  Open email
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
