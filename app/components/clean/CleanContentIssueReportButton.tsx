"use client";

import { useEffect, useState } from "react";
import type React from "react";
import {
  submitContentIssueReport,
  type ContentIssueReportMode,
  type ContentIssueType,
} from "@/lib/clean/contentIssueReports";

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

type SubmitState = "idle" | "sending" | "sent" | "failed";

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

function getUserAgent() {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent;
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

  async function submitReport() {
    setSubmitState("sending");
    setMessage("");

    const result = await submitContentIssueReport({
      ...context,
      issueType,
      note,
      sourceUrl: getSourceUrl(),
      selectedAnswer: null,
      expectedAnswer: null,
      context: {
        ...(context.context ?? {}),
        appRoute: getSourceUrl(),
        userAgent: getUserAgent(),
        reportedAt: new Date().toISOString(),
        answerState: context.context?.result ?? null,
        checked: context.context?.checked ?? null,
      },
    });

    if (result.ok) {
      setSubmitState("sent");
      setMessage("Thanks — your report has been saved for review.");
      return;
    }

    setSubmitState("failed");
    setMessage(result.error || "Sorry, we could not save this report. Please try again.");
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={triggerStyle}>
        <span aria-hidden="true" style={{ color: "#6C4DF6", fontSize: 13 }}>!</span>
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

            {submitState === "sent" ? (
              <div
                style={{
                  border: "1px solid #bbf7d0",
                  borderRadius: 12,
                  background: "#f0fdf4",
                  color: "#166534",
                  padding: 12,
                  fontWeight: 800,
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
                  if (submitState === "sent") {
                    setSubmitState("idle");
                    setMessage("");
                    setNote("");
                  }
                }}
                style={secondaryButtonStyle}
              >
                {submitState === "sent" ? "Close" : "Cancel"}
              </button>
              {submitState !== "sent" ? (
                <button
                  type="button"
                  onClick={() => void submitReport()}
                  disabled={submitState === "sending"}
                  style={{
                    ...buttonStyle,
                    opacity: submitState === "sending" ? 0.62 : 1,
                    cursor: submitState === "sending" ? "not-allowed" : "pointer",
                  }}
                >
                  {submitState === "sending" ? "Sending..." : "Send report"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
