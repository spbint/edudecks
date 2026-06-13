"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { usePathname } from "next/navigation";
import {
  buildReportProblemMailto,
  MYLEARNA_SUPPORT_EMAIL,
} from "@/app/components/clean/feedback/reportProblemMailto";

type ReportProblemButtonProps = {
  pageTitle?: string;
};

type SubmitState = "idle" | "opened" | "copied" | "failed";

const PAGE_REPORT_OPTIONS = [
  "Something looks wrong",
  "A button or link is broken",
  "Text is confusing",
  "Page layout problem",
  "Loading problem",
  "Other",
] as const;

const PAGE_REPORT_MAX_LENGTH = 2000;

function getSourceUrl() {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

function getRoute(pathname: string) {
  if (typeof window === "undefined") return pathname;
  return `${window.location.pathname}${window.location.search}`;
}

function getUserAgent() {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent;
}

const triggerStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  background: "#FFFFFF",
  color: "#5B6478",
  borderRadius: 999,
  padding: "8px 11px",
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
  zIndex: 90,
  background: "rgba(15,23,42,0.34)",
  display: "grid",
  placeItems: "center",
  padding: 14,
};

const dialogStyle: React.CSSProperties = {
  width: "min(100%, 520px)",
  border: "1px solid #E7EAF2",
  borderRadius: 20,
  background: "#FFFFFF",
  boxShadow: "0 24px 70px rgba(15,23,42,0.2)",
  padding: 18,
  display: "grid",
  gap: 14,
};

const fieldStyle: React.CSSProperties = {
  border: "1px solid #CBD5E1",
  borderRadius: 12,
  padding: "10px 12px",
  font: "inherit",
  color: "#17204B",
  background: "#FFFFFF",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "1px solid #6C4DF6",
  background: "#6C4DF6",
  color: "#FFFFFF",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 650,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  border: "1px solid #CBD5E1",
  background: "#FFFFFF",
  color: "#17204B",
};

export default function ReportProblemButton({ pageTitle }: ReportProblemButtonProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<(typeof PAGE_REPORT_OPTIONS)[number]>(
    "Something looks wrong",
  );
  const [message, setMessage] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

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
      subject: "MyLearna page report",
      type: "Page",
      category,
      message,
      context: [
        ["Page", pageTitle],
        ["Route", getRoute(pathname)],
        ["URL", getSourceUrl()],
        ["Timestamp", new Date().toISOString()],
        ["Browser", getUserAgent()],
      ],
    });
  }

  function openEmail() {
    const report = getReportDetails();
    window.location.href = report.href;
    setSubmitState("opened");
    setStatusMessage("Your email app should open with the report details filled in.");
  }

  async function copyReportDetails() {
    const report = getReportDetails();

    try {
      await navigator.clipboard.writeText(
        `${report.body}\n\nEmail to: ${MYLEARNA_SUPPORT_EMAIL}`,
      );
      setSubmitState("copied");
      setStatusMessage(
        `Report details copied. Email them to ${MYLEARNA_SUPPORT_EMAIL}.`,
      );
    } catch {
      setSubmitState("failed");
      setStatusMessage(
        `Could not copy automatically. Please email ${MYLEARNA_SUPPORT_EMAIL}.`,
      );
    }
  }

  function closeDialog() {
    setOpen(false);
    setSubmitState("idle");
    setStatusMessage("");
    setMessage("");
  }

  const reportOpened = submitState === "opened" || submitState === "copied";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={triggerStyle}>
        <span aria-hidden="true" style={{ color: "#6C4DF6", fontSize: 13 }}>
          !
        </span>
        Report a problem with this page
      </button>

      {open ? (
        <div role="presentation" style={overlayStyle} onClick={closeDialog}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="page-problem-title"
            style={dialogStyle}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: "grid", gap: 5 }}>
              <h2
                id="page-problem-title"
                style={{ margin: 0, color: "#17204B", fontSize: 19, fontWeight: 650 }}
              >
                Report a problem with this page
              </h2>
              <p style={{ margin: 0, color: "#5B6478", fontSize: 13, lineHeight: 1.5 }}>
                {pageTitle ? `${pageTitle}. ` : ""}Please avoid private child details.
              </p>
            </div>

            {reportOpened ? (
              <div
                role="status"
                style={{
                  border: "1px solid #BBF7D0",
                  borderRadius: 14,
                  background: "#ECFDF4",
                  color: "#166534",
                  padding: 12,
                  fontSize: 14,
                  fontWeight: 650,
                }}
              >
                {statusMessage}
              </div>
            ) : (
              <>
                <label
                  style={{
                    display: "grid",
                    gap: 7,
                    color: "#17204B",
                    fontSize: 13,
                    fontWeight: 650,
                  }}
                >
                  Category
                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as (typeof PAGE_REPORT_OPTIONS)[number])
                    }
                    style={fieldStyle}
                  >
                    {PAGE_REPORT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label
                  style={{
                    display: "grid",
                    gap: 7,
                    color: "#17204B",
                    fontSize: 13,
                    fontWeight: 650,
                  }}
                >
                  Tell us what you noticed
                  <textarea
                    value={message}
                    onChange={(event) =>
                      setMessage(event.target.value.slice(0, PAGE_REPORT_MAX_LENGTH))
                    }
                    placeholder="Example: A button did not open, or the page layout looked wrong."
                    style={{
                      ...fieldStyle,
                      minHeight: 104,
                      resize: "vertical",
                      lineHeight: 1.5,
                    }}
                  />
                </label>

                {statusMessage ? (
                  <div
                    role="alert"
                    style={{ color: "#B91C1C", fontSize: 13, lineHeight: 1.5 }}
                  >
                    {statusMessage}
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
              <button type="button" onClick={closeDialog} style={secondaryButtonStyle}>
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
                <button type="button" onClick={openEmail} style={primaryButtonStyle}>
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
