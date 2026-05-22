"use client";

import * as Sentry from "@sentry/nextjs";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  PAGE_FEEDBACK_MAX_LENGTH,
  submitCleanPageFeedback,
} from "@/lib/clean/pageFeedback/client";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

type FeedbackPage = {
  key: string;
  title: string;
  matches: string[];
};

type GtagParams = {
  page_key: string;
  feedback_type: string;
  status: string;
};

const feedbackPages: FeedbackPage[] = [
  { key: "my-day", title: "My Day", matches: ["/my-day", "/clean-my-day"] },
  { key: "my-calendar", title: "My Calendar", matches: ["/my-calendar", "/clean-my-calendar"] },
  { key: "my-pathways", title: "My Pathways", matches: ["/my-pathways", "/clean-my-pathways"] },
  { key: "my-assessments", title: "My Assessments", matches: ["/my-assessments", "/clean-my-assessments"] },
  { key: "my-capture", title: "My Capture", matches: ["/my-capture", "/clean-my-capture"] },
  { key: "my-portfolio", title: "My Portfolio", matches: ["/my-portfolio", "/clean-my-portfolio"] },
  { key: "my-curriculum", title: "My Curriculum", matches: ["/my-curriculum", "/clean-my-curriculum"] },
  { key: "my-reports", title: "My Reports", matches: ["/my-reports", "/clean-my-reports"] },
  { key: "my-outputs", title: "My Outputs", matches: ["/my-outputs", "/clean-my-outputs"] },
  { key: "my-programs", title: "My Programs", matches: ["/my-programs", "/clean-my-programs"] },
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

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function trackFeedbackEvent(eventName: string, params: GtagParams) {
  if (typeof window === "undefined") {
    return;
  }

  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") {
    return;
  }

  gtag("event", eventName, params);
}

function getFriendlyErrorMessage(error: unknown) {
  const message = String((error as { message?: unknown })?.message ?? "")
    .trim()
    .toLowerCase();

  if (
    message.includes("timed out") ||
    message.includes("network") ||
    message.includes("fetch")
  ) {
    return "We couldn't send that just now. Please check your connection and try again.";
  }

  return "We couldn't send that feedback just now. Please try again in a moment.";
}

export default function CleanPageFeedbackWidget() {
  const pathname = usePathname();
  const page = useMemo(() => getFeedbackPage(pathname), [pathname]);
  const [open, setOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
        handleClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  });

  const remainingCharacters = PAGE_FEEDBACK_MAX_LENGTH - feedbackText.length;

  if (!page || !hasSupabaseEnv) {
    return null;
  }

  const activePage = page;

  function handleOpen() {
    setOpen(true);
    setError(null);
    setSubmitted(false);
    trackFeedbackEvent("page_feedback_opened", {
      page_key: activePage.key,
      feedback_type: "general",
      status: "opened",
    });
  }

  function handleClose() {
    setOpen(false);
    setSubmitting(false);
    setError(null);
    setSubmitted(false);
    setFeedbackText("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const trimmedFeedback = safe(feedbackText);

    if (!trimmedFeedback) {
      setError("Add a short note first so we know what would help here.");
      return;
    }

    setSubmitting(true);
    setError(null);

    let userId: string | null = null;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;

      await submitCleanPageFeedback({
        userId,
        pageKey: activePage.key,
        pageTitle: activePage.title,
        currentUrl:
          typeof window !== "undefined" ? window.location.href : pathname,
        feedbackText: trimmedFeedback.slice(0, PAGE_FEEDBACK_MAX_LENGTH),
        feedbackType: "general",
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
      });

      setSubmitted(true);
      setFeedbackText("");
      trackFeedbackEvent("page_feedback_submitted", {
        page_key: activePage.key,
        feedback_type: "general",
        status: "submitted",
      });
    } catch (nextError) {
      setError(getFriendlyErrorMessage(nextError));
      trackFeedbackEvent("page_feedback_failed", {
        page_key: activePage.key,
        feedback_type: "general",
        status: "failed",
      });
      Sentry.captureException(nextError, {
        tags: {
          surface: "page_feedback",
          page_key: activePage.key,
        },
        extra: {
          current_url:
            typeof window !== "undefined" ? window.location.href : pathname,
          feedback_type: "general",
          user_present: Boolean(userId),
        },
      });
    } finally {
      setSubmitting(false);
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
                  maxHeight: "min(560px, calc(100vh - 24px))",
                  overflow: "hidden",
                  border: "1px solid #dbeafe",
                  borderRadius: 22,
                  background: "#ffffff",
                  boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
                  display: "grid",
                }}
              >
                <div
                  style={{
                    padding: "clamp(16px, 4vw, 20px)",
                    display: "grid",
                    gap: 14,
                    overflowY: "auto",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                      <div
                        style={{
                          color: "#1d4ed8",
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        Help us shape MyLearna together
                      </div>
                      <h2
                        id="page-feedback-title"
                        style={{ margin: 0, color: "#0f172a", fontSize: 22 }}
                      >
                        Help improve this page
                      </h2>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        {activePage.title}
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
                      Close
                    </button>
                  </div>

                  {submitted ? (
                    <div
                      style={{
                        border: "1px solid #bbf7d0",
                        borderRadius: 16,
                        background: "#f0fdf4",
                        padding: 16,
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      <strong style={{ color: "#166534" }}>
                        Thanks - this helps us improve MyLearna.
                      </strong>
                      <p style={{ margin: 0, color: "#166534", lineHeight: 1.6 }}>
                        We review this feedback for workflow friction, missing guidance,
                        and places where parents need clearer support.
                      </p>
                      <div>
                        <button
                          type="button"
                          onClick={handleClose}
                          style={{
                            border: "1px solid #166534",
                            background: "#166534",
                            color: "#ffffff",
                            borderRadius: 10,
                            padding: "10px 14px",
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
                      <label style={{ display: "grid", gap: 8 }}>
                        <span
                          style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}
                        >
                          What could be clearer, easier, or more helpful here?
                        </span>
                        <textarea
                          value={feedbackText}
                          onChange={(event) =>
                            setFeedbackText(event.target.value.slice(0, PAGE_FEEDBACK_MAX_LENGTH))
                          }
                          maxLength={PAGE_FEEDBACK_MAX_LENGTH}
                          placeholder="A short note about what felt confusing, missing, or especially helpful."
                          style={{
                            width: "100%",
                            minHeight: 140,
                            maxHeight: 240,
                            resize: "vertical",
                            border: "1px solid #cbd5e1",
                            borderRadius: 14,
                            padding: "12px 14px",
                            fontSize: 14,
                            lineHeight: 1.6,
                          }}
                        />
                      </label>

                      <div
                        style={{
                          border: "1px solid #dbeafe",
                          borderRadius: 14,
                          background: "#f8fbff",
                          padding: 12,
                          color: "#475569",
                          fontSize: 13,
                          lineHeight: 1.6,
                        }}
                      >
                        Please avoid including private child, medical, or identifying details.
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ color: "#64748b", fontSize: 12 }}>
                          Keep it brief. {remainingCharacters} characters left.
                        </span>
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
                            disabled={submitting}
                            style={{
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#0f172a",
                              borderRadius: 10,
                              padding: "10px 14px",
                              fontSize: 14,
                              fontWeight: 700,
                              cursor: submitting ? "wait" : "pointer",
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submitting || !safe(feedbackText)}
                            style={{
                              border: "1px solid #0f172a",
                              background: "#0f172a",
                              color: "#ffffff",
                              borderRadius: 10,
                              padding: "10px 14px",
                              fontSize: 14,
                              fontWeight: 700,
                              cursor:
                                submitting || !safe(feedbackText) ? "not-allowed" : "pointer",
                              opacity: submitting || !safe(feedbackText) ? 0.7 : 1,
                            }}
                          >
                            {submitting ? "Sending feedback..." : "Send feedback"}
                          </button>
                        </div>
                      </div>

                      {error ? (
                        <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
                          {error}
                        </div>
                      ) : null}
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
