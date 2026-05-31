"use client";

import { useState } from "react";
import type React from "react";
import {
  CONTENT_ISSUE_TYPE_OPTIONS,
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
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#475569",
  borderRadius: 999,
  padding: "7px 10px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
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
  border: "1px solid #dbe4f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 18,
  display: "grid",
  gap: 14,
  boxShadow: "0 24px 70px rgba(15,23,42,0.22)",
};

const labelStyle: React.CSSProperties = {
  color: "#0f172a",
  fontSize: 13,
  fontWeight: 800,
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

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
  label = "Report issue",
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

  async function submitReport() {
    setSubmitState("sending");
    setMessage("");

    const result = await submitContentIssueReport({
      ...context,
      issueType,
      note,
      sourceUrl: getSourceUrl(),
      context: {
        ...(context.context ?? {}),
        appRoute: getSourceUrl(),
        userAgent: getUserAgent(),
      },
    });

    if (result.ok) {
      setSubmitState("sent");
      setMessage("Thanks - this has been sent for review.");
      return;
    }

    setSubmitState("failed");
    setMessage(result.error || "We could not send this report just now.");
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={triggerStyle}>
        {label}
      </button>
      {open ? (
        <div style={overlayStyle} role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Report issue"
            style={dialogStyle}
          >
            <div>
              <div
                style={{
                  color: "#0f172a",
                  fontSize: 20,
                  fontWeight: 900,
                  lineHeight: 1.2,
                }}
              >
                Report issue
              </div>
              <div style={{ color: "#64748b", lineHeight: 1.5, marginTop: 4 }}>
                Tell us what looked wrong or confusing. This will not interrupt the
                assessment or practice flow.
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
                    Issue type
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
                    {CONTENT_ISSUE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <label htmlFor="content-issue-note" style={labelStyle}>
                    Optional note
                  </label>
                  <textarea
                    id="content-issue-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Tell us what looked wrong or confusing."
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
