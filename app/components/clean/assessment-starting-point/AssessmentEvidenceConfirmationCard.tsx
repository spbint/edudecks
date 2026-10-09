"use client";

import React, { useState } from "react";
import type { NumberOperationsEvidencePreview } from "@/lib/clean/assessments/placement/numberOperationsEvidencePreview";
import {
  buildNumberOperationsEvidenceConfirmationDraft,
  type NumberOperationsEvidenceConfirmationDraft,
} from "@/lib/clean/assessments/placement/numberOperationsEvidenceConfirmation";

const panel: React.CSSProperties = {
  border: "1px solid #E1E6F0",
  borderRadius: 16,
  background: "#FFFFFF",
  padding: 16,
  display: "grid",
  gap: 10,
};

export default function AssessmentEvidenceConfirmationCard({
  preview,
  presentation = "staff",
  onConfirmationPreviewed,
}: {
  preview: NumberOperationsEvidencePreview;
  presentation?: "parent" | "staff";
  onConfirmationPreviewed?: (choices: {
    includeInPortfolio: boolean;
    includeInReport: boolean;
  }) => void;
}) {
  const parentPresentation = presentation === "parent";
  const hasConfirmableEvidence =
    preview.assessedSubElements > 0 &&
    preview.resultBands.length > 0 &&
    preview.curriculumNodeIds.length > 0 &&
    preview.portfolioEligibleAfterConfirmation;
  const [acknowledged, setAcknowledged] = useState(false);
  const [includeInPortfolio, setIncludeInPortfolio] = useState(true);
  const [includeInReport, setIncludeInReport] = useState(false);
  const [parentNote, setParentNote] = useState("");
  const [draft, setDraft] =
    useState<NumberOperationsEvidenceConfirmationDraft | null>(null);

  const confirm = () => {
    setDraft(
      buildNumberOperationsEvidenceConfirmationDraft({
        preview,
        parentAcknowledgedStartingPoint: acknowledged,
        includeInPortfolio,
        includeInReport,
        parentNote,
      }),
    );
    onConfirmationPreviewed?.({
      includeInPortfolio,
      includeInReport,
    });
  };

  if (!hasConfirmableEvidence) {
    return (
      <section
        style={{
          border: "1px solid #F5D08A",
          borderRadius: 22,
          background: "#FFFDF5",
          padding: "clamp(18px, 4vw, 26px)",
          display: "grid",
          gap: 10,
        }}
      >
        <span
          style={{
            color: "#92400E",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          Learning evidence
        </span>
        <h3 style={{ margin: 0, color: "#17204B", fontSize: 24 }}>
          Practical evidence comes next
        </h3>
        <p style={{ margin: 0, color: "#6B4F1D", lineHeight: 1.6 }}>
          This electronic check did not produce a reportable starting-point result.
          MyLearna will not offer Portfolio or report confirmation until practical or
          observed learning provides evidence worth keeping.
        </p>
      </section>
    );
  }

  return (
    <section
      style={{
        border: "1px solid #CFE3D5",
        borderRadius: 22,
        background: "#F7FCF8",
        padding: "clamp(18px, 4vw, 26px)",
        display: "grid",
        gap: 14,
      }}
    >
      <div style={{ display: "grid", gap: 5 }}>
        <span
          style={{
            color: "#166534",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          {parentPresentation ? "Learning evidence" : "Parent confirmation prototype"}
        </span>
        <h3 style={{ margin: 0, color: "#17204B", fontSize: 24 }}>
          Keep this check as learning evidence?
        </h3>
        <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.6 }}>
          {parentPresentation
            ? "You decide whether this starting-point check should become part of the learner’s learning story."
            : "MyLearna can keep this assessment as part of the learner’s learning story, but only after an adult confirms that they want it recorded."}
        </p>
      </div>

      {preview.routingOnlySubElements ? (
        <div style={{ ...panel, background: "#FFFDF5", borderColor: "#F5D08A" }}>
          <strong style={{ color: "#92400E" }}>Some evidence still needs checking</strong>
          <span style={{ color: "#6B4F1D", lineHeight: 1.55 }}>
            {preview.routingOnlySubElements} area
            {preview.routingOnlySubElements === 1 ? "" : "s"} helped MyLearna locate
            the next learning neighbourhood but still need practical or observed
            evidence before MyLearna makes a stronger starting-point judgement.
          </span>
        </div>
      ) : null}

      <label style={{ ...panel, gridTemplateColumns: "auto 1fr", alignItems: "start" }}>
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => {
            setAcknowledged(event.target.checked);
            setDraft(null);
          }}
          style={{ marginTop: 3 }}
        />
        <span style={{ display: "grid", gap: 3 }}>
          <strong style={{ color: "#17204B" }}>
            {parentPresentation
              ? "I understand this is a starting point, not a grade or permanent level."
              : "I understand this is a starting-point assessment result."}
          </strong>
          <span style={{ color: "#4B5563", lineHeight: 1.5 }}>
            {parentPresentation
              ? "Keeping it as evidence will not automatically mark a Pathway step complete or turn this result into a formal report statement."
              : "Keeping it as evidence does not automatically mark a pathway step Secure, change assessment confidence, or create a formal report statement."}
          </span>
        </span>
      </label>

      <div style={panel}>
        <strong style={{ color: "#17204B" }}>Where should this evidence appear?</strong>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={includeInPortfolio}
            onChange={(event) => {
              setIncludeInPortfolio(event.target.checked);
              setDraft(null);
            }}
          />
          Include in My Portfolio
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={includeInReport}
            disabled={!preview.reportEligibleAfterConfirmation}
            onChange={(event) => {
              setIncludeInReport(event.target.checked);
              setDraft(null);
            }}
          />
          Make available for reports
        </label>
        {!preview.reportEligibleAfterConfirmation ? (
          <small style={{ color: "#92400E", lineHeight: 1.5 }}>
            Report use becomes available after the remaining routing-only evidence
            has been verified with practical or observed learning.
          </small>
        ) : null}
      </div>

      <label style={{ ...panel }}>
        <strong style={{ color: "#17204B" }}>Parent context (optional)</strong>
        <textarea
          value={parentNote}
          onChange={(event) => {
            setParentNote(event.target.value);
            setDraft(null);
          }}
          placeholder="Anything you noticed while your child was working..."
          style={{
            width: "100%",
            minHeight: 86,
            resize: "vertical",
            border: "1px solid #CBD5E1",
            borderRadius: 10,
            padding: 10,
            font: "inherit",
            boxSizing: "border-box",
          }}
        />
      </label>

      <button
        type="button"
        disabled={!acknowledged}
        onClick={confirm}
        style={{
          border: 0,
          borderRadius: 11,
          minHeight: 44,
          padding: "10px 14px",
          background: acknowledged ? "#166534" : "#D1D5DB",
          color: "#FFFFFF",
          fontWeight: 850,
          cursor: acknowledged ? "pointer" : "not-allowed",
          width: "fit-content",
        }}
      >
        {parentPresentation ? "Preview this evidence choice" : "Preview confirmed evidence"}
      </button>

      {draft ? (
        <div
          role="status"
          style={{ ...panel, background: "#F0FDF4", borderColor: "#A7D7B4" }}
        >
          <strong style={{ color: "#166534" }}>
            {parentPresentation
              ? "Evidence choice previewed"
              : "Confirmation ready for the persistence boundary"}
          </strong>
          <span style={{ color: "#4B5563", lineHeight: 1.55 }}>
            {parentPresentation
              ? "Nothing has been saved in this staff preview. When saving is enabled, these choices will control whether the check is kept in My Portfolio and made available for reports."
              : "This staff-lab prototype has built the confirmation intent only. No learner, family, Portfolio, report or pathway data has been written."}
          </span>
          {!parentPresentation ? (
            <details>
              <summary
                style={{
                  cursor: "pointer",
                  color: "#475569",
                  fontWeight: 800,
                }}
              >
                View confirmation payload
              </summary>
              <pre
                style={{
                  margin: "8px 0 0",
                  maxHeight: 300,
                  overflow: "auto",
                  borderRadius: 10,
                  background: "#0F172A",
                  color: "#E2E8F0",
                  padding: 12,
                  fontSize: 11,
                  lineHeight: 1.45,
                  whiteSpace: "pre-wrap",
                }}
              >
                {JSON.stringify(draft, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
