"use client";

import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  buildReportProblemMailto,
  MYLEARNA_SUPPORT_EMAIL,
} from "@/app/components/clean/feedback/reportProblemMailto";
import { useGuidance } from "@/app/components/clean/guidance/GuidanceProvider";

type FeedbackPage = {
  key: string;
  title: string;
  matches: string[];
};

const PAGE_REPORT_OPTIONS = [
  "Something looks wrong",
  "A button or link is broken",
  "Text is confusing",
  "Page layout problem",
  "Loading problem",
  "Other",
] as const;

const PAGE_FEEDBACK_MAX_LENGTH = 2000;

const feedbackPages: FeedbackPage[] = [
  { key: "my-day", title: "My Day", matches: ["/my-day", "/clean-my-day"] },
  { key: "my-calendar", title: "My Calendar", matches: ["/my-calendar", "/clean-my-calendar"] },
  { key: "my-pathways", title: "My Pathways", matches: ["/my-pathways", "/clean-my-pathways"] },
  { key: "my-capture", title: "My Capture", matches: ["/my-capture", "/clean-my-capture"] },
  { key: "my-portfolio", title: "My Portfolio", matches: ["/my-portfolio", "/clean-my-portfolio"] },
  { key: "my-curriculum", title: "My Data", matches: ["/my-data", "/my-curriculum", "/clean-my-curriculum"] },
  { key: "my-reports", title: "My Reports", matches: ["/my-reports", "/clean-my-reports"] },
  { key: "my-community", title: "My Community", matches: ["/my-community"] },
  { key: "my-profile", title: "My Profile", matches: ["/my-profile"] },
  { key: "my-settings", title: "My Settings", matches: ["/my-settings"] },
];

function matchesPath(pathname: string, candidate: string) {
  return pathname === candidate || pathname.startsWith(`${candidate}/`);
}

function getFeedbackPage(pathname: string) {
  return (
    feedbackPages.find((page) =>
      page.matches.some((candidate) => matchesPath(pathname, candidate)),
    ) ?? null
  );
}

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

export default function CleanPageFeedbackWidget() {
  const pathname = usePathname();
  const { enabled: guidanceEnabled, setupStatus } = useGuidance();
  const page = useMemo(() => getFeedbackPage(pathname), [pathname]);
  const [open, setOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [category, setCategory] = useState<(typeof PAGE_REPORT_OPTIONS)[number]>(
    "Something looks wrong",
  );
  const [status, setStatus] = useState<"idle" | "opened" | "copied" | "failed">(
    "idle",
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsCompact(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);

    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setStatus("idle");
        setStatusMessage("");
        setFeedbackText("");
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  });

  if (!page || (guidanceEnabled && setupStatus === "active")) {
    return null;
  }

  const activePage = page;
  const sent = status === "opened" || status === "copied";
  const remainingCharacters = PAGE_FEEDBACK_MAX_LENGTH - feedbackText.length;

  function getReportDetails() {
    return buildReportProblemMailto({
      subject: "MyLearna page report",
      type: "Page",
      category,
      message: feedbackText,
      context: [
        ["Page", activePage.title],
        ["Route", getRoute(pathname)],
        ["URL", getSourceUrl()],
        ["Timestamp", new Date().toISOString()],
        ["Browser", getUserAgent()],
      ],
    });
  }

  function handleOpen() {
    setOpen(true);
    setStatus("idle");
    setStatusMessage("");
  }

  function handleClose() {
    setOpen(false);
    setStatus("idle");
    setStatusMessage("");
    setFeedbackText("");
  }

  function openEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const report = getReportDetails();
    window.location.href = report.href;
    setStatus("opened");
    setStatusMessage("Your email app should open with the report details filled in.");
  }

  async function copyReportDetails() {
    const report = getReportDetails();

    try {
      await navigator.clipboard.writeText(
        `${report.body}\n\nEmail to: ${MYLEARNA_SUPPORT_EMAIL}`,
      );
      setStatus("copied");
      setStatusMessage(`Report details copied. Email them to ${MYLEARNA_SUPPORT_EMAIL}.`);
    } catch {
      setStatus("failed");
      setStatusMessage(
        `Could not copy automatically. Please email ${MYLEARNA_SUPPORT_EMAIL}.`,
      );
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Help improve this page"
        style={{
          position: "fixed",
          right: 12,
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)",
          zIndex: 70,
          border: "1px solid #dbeafe",
          background: "#ffffff",
          color: "#0f172a",
          borderRadius: 999,
          padding: isCompact ? "10px 12px" : "10px 14px",
          minHeight: 40,
          maxWidth: "calc(100vw - 24px)",
          boxShadow: "0 10px 22px rgba(15,23,42,0.08)",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {isCompact ? "Feedback" : "Help improve this page"}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              role="presentation"
              onClick={handleClose}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,23,42,0.34)",
                display: "grid",
                placeItems: "center",
                padding: 10,
                zIndex: 95,
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="page-feedback-title"
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: "min(440px, calc(100vw - 20px))",
                  maxWidth: "100%",
                  border: "1px solid #dbeafe",
                  borderRadius: 22,
                  background: "#ffffff",
                  boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
                  display: "grid",
                }}
              >
                <div style={{ padding: 18, display: "grid", gap: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                      <h2
                        id="page-feedback-title"
                        style={{ margin: 0, color: "#0f172a", fontSize: 21 }}
                      >
                        Report a problem with this page
                      </h2>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        {activePage.title}. Please avoid private child details.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      style={{
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#0f172a",
                        borderRadius: 999,
                        padding: "8px 12px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      {sent ? "Close" : "Cancel"}
                    </button>
                  </div>

                  {sent ? (
                    <div
                      role="status"
                      style={{
                        border: "1px solid #bbf7d0",
                        borderRadius: 16,
                        background: "#f0fdf4",
                        padding: 14,
                        color: "#166534",
                        fontWeight: 650,
                      }}
                    >
                      {statusMessage}
                    </div>
                  ) : (
                    <form onSubmit={openEmail} style={{ display: "grid", gap: 12 }}>
                      <label style={{ display: "grid", gap: 8 }}>
                        <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>
                          Category
                        </span>
                        <select
                          value={category}
                          onChange={(event) =>
                            setCategory(event.target.value as (typeof PAGE_REPORT_OPTIONS)[number])
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
                          {PAGE_REPORT_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={{ display: "grid", gap: 8 }}>
                        <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>
                          Tell us what you noticed
                        </span>
                        <textarea
                          value={feedbackText}
                          onChange={(event) =>
                            setFeedbackText(event.target.value.slice(0, PAGE_FEEDBACK_MAX_LENGTH))
                          }
                          maxLength={PAGE_FEEDBACK_MAX_LENGTH}
                          placeholder="Example: A button did not open, or the page layout looked wrong."
                          style={{
                            width: "100%",
                            minHeight: 118,
                            resize: "vertical",
                            border: "1px solid #cbd5e1",
                            borderRadius: 14,
                            padding: "12px 14px",
                            fontSize: 14,
                            lineHeight: 1.6,
                          }}
                        />
                      </label>

                      <span style={{ color: "#64748b", fontSize: 12 }}>
                        {remainingCharacters} characters left.
                      </span>

                      {statusMessage ? (
                        <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
                          {statusMessage}
                        </div>
                      ) : null}

                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          flexWrap: "wrap",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleClose}
                          style={{
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            color: "#0f172a",
                            borderRadius: 10,
                            padding: "10px 14px",
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => void copyReportDetails()}
                          style={{
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            color: "#0f172a",
                            borderRadius: 10,
                            padding: "10px 14px",
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Copy report details
                        </button>
                        <button
                          type="submit"
                          style={{
                            border: "1px solid #0f172a",
                            background: "#0f172a",
                            color: "#ffffff",
                            borderRadius: 10,
                            padding: "10px 14px",
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Open email
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
