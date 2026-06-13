"use client";

import { useEffect, useState } from "react";
import type React from "react";
import {
  submitReportProblem,
  type ReportProblemPayload,
  type ReportProblemType,
} from "@/app/components/clean/feedback/reportProblemClient";

type ReportProblemDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  type: ReportProblemType;
  categories: readonly string[];
  defaultCategory: string;
  context: () => Record<string, unknown>;
  onClose: () => void;
};

const MAX_MESSAGE_LENGTH = 2000;

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

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export default function ReportProblemDialog({
  open,
  title,
  description,
  type,
  categories,
  defaultCategory,
  context,
  onClose,
}: ReportProblemDialogProps) {
  const [category, setCategory] = useState(defaultCategory);
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [submitState, setSubmitState] = useState<
    "idle" | "sending" | "sent" | "failed"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCategory(defaultCategory);
        setMessage("");
        setCompany("");
        setSubmitState("idle");
        setStatusMessage("");
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [defaultCategory, onClose, open]);

  if (!open) return null;

  const reportSent = submitState === "sent";

  function closeDialog() {
    setCategory(defaultCategory);
    setMessage("");
    setCompany("");
    setSubmitState("idle");
    setStatusMessage("");
    onClose();
  }

  async function submitReport() {
    const trimmedMessage = safe(message);
    if (!trimmedMessage) {
      setSubmitState("failed");
      setStatusMessage("Tell us what you noticed before sending.");
      return;
    }

    setSubmitState("sending");
    setStatusMessage("");

    const payload: ReportProblemPayload = {
      type,
      category,
      message: trimmedMessage,
      context: context(),
      company,
    };

    const result = await submitReportProblem(payload);

    if (!result.ok) {
      setSubmitState("failed");
      setStatusMessage(result.message);
      return;
    }

    setSubmitState("sent");
    setStatusMessage("Thanks — your report has been sent.");
  }

  return (
    <div role="presentation" style={overlayStyle} onClick={closeDialog}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-problem-title"
        style={dialogStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: "grid", gap: 5 }}>
          <h2
            id="report-problem-title"
            style={{ margin: 0, color: "#17204B", fontSize: 19, fontWeight: 650 }}
          >
            {title}
          </h2>
          {description ? (
            <p style={{ margin: 0, color: "#5B6478", fontSize: 13, lineHeight: 1.5 }}>
              {description}
            </p>
          ) : null}
        </div>

        {reportSent ? (
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
                onChange={(event) => setCategory(event.target.value)}
                style={fieldStyle}
              >
                {categories.map((option) => (
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
                  setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))
                }
                placeholder="Example: I think the answer marked correct is wrong, or the visual does not match the question."
                style={{
                  ...fieldStyle,
                  minHeight: 104,
                  resize: "vertical",
                  lineHeight: 1.5,
                }}
              />
            </label>

            <input
              aria-hidden="true"
              autoComplete="off"
              tabIndex={-1}
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              name="company"
              style={{ display: "none" }}
            />

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
            {reportSent ? "Close" : "Cancel"}
          </button>
          {!reportSent ? (
            <button
              type="button"
              onClick={() => void submitReport()}
              disabled={submitState === "sending"}
              style={{
                ...primaryButtonStyle,
                opacity: submitState === "sending" ? 0.65 : 1,
                cursor: submitState === "sending" ? "not-allowed" : "pointer",
              }}
            >
              {submitState === "sending" ? "Sending..." : "Send report"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
