"use client";

import Link from "next/link";
import React from "react";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import type { PathwayPracticeActivity } from "@/lib/clean/pathways/practiceActivities";
import type { MathWorksheetResource } from "@/lib/clean/resources/mathWorksheetResources";

type CleanPathwayStepActionRowProps = {
  activity: PathwayPracticeActivity | null;
  assessHref: string;
  captureHref: string;
  practiceHref?: string | null;
  practiceTitle?: string | null;
  familyId?: string;
  learnerId?: string;
  subjectKey?: string;
  subjectTitle?: string;
  strandKey?: string;
  strandTitle?: string;
  stageKey?: string;
  stageTitle?: string;
  pathwayStepId?: string;
  stepKey?: string;
  stepTitle?: string;
  assessmentBankTitle?: string | null;
  exactAssessmentTitle?: string | null;
  autoCheckStatusLabel?: string | null;
  autoCheckStatusScope?: "bank" | "sub-element" | null;
  confidenceStatusLabel?: string | null;
  isExactStepContext?: boolean;
  noAssessmentMessage?: string | null;
  worksheetResource?: MathWorksheetResource | null;
  latestEvidenceEntry?: CleanEvidenceEntry | null;
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "7px 10px",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

function appendWorksheetEvidenceParams(
  href: string,
  worksheetResource: MathWorksheetResource,
) {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("worksheetEvidence", "1");
  params.set("evidenceSource", "worksheet_evidence");
  params.set("worksheetId", worksheetResource.fileName);
  params.set("worksheetTitle", worksheetResource.title);
  params.set("worksheetHref", worksheetResource.href);
  params.set("worksheetFileName", worksheetResource.fileName);
  params.set("includeInPortfolio", "1");
  params.set("includeInReport", "1");
  return `${path}?${params.toString()}`;
}

function formatLatestEvidenceDate(entry: CleanEvidenceEntry | null | undefined) {
  const raw = entry?.observedOn || entry?.createdAt || "";
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return "Saved recently";
  const date = new Date(parsed);
  if (date.toDateString() === new Date().toDateString()) return "Saved today";
  return `Saved ${new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
  }).format(date)}`;
}

function latestEvidenceProgressLabel(entry: CleanEvidenceEntry | null | undefined) {
  const text = `${entry?.whatHappened || ""}\n${entry?.reflection || ""}`;
  const match = text.match(/Progress level:\s*([^\n.]+)/i);
  return match?.[1]?.trim() || "Evidence saved";
}

export default function CleanPathwayStepActionRow({
  captureHref,
  stepTitle = "",
  worksheetResource,
  latestEvidenceEntry = null,
}: CleanPathwayStepActionRowProps) {
  const worksheetEvidenceCaptureHref =
    worksheetResource && captureHref
      ? appendWorksheetEvidenceParams(captureHref, worksheetResource)
      : captureHref;

  return (
    <section
      className="mylearna-worksheet-action-card"
      style={{
        border: "1px solid #E7EAF2",
        borderRadius: 18,
        background: "#FFFFFF",
        padding: "clamp(14px, 2.4vw, 20px)",
        display: "grid",
        gap: 14,
        boxShadow: "0 8px 22px rgba(23,32,75,0.045)",
      }}
      data-pathway-worksheet-evidence="route-to-capture"
    >
      {worksheetResource ? (
        <>
          <div className="mylearna-worksheet-action-copy" style={{ display: "grid", gap: 7 }}>
            <span
              style={{
                color: "#6C4DF6",
                fontSize: 12,
                fontWeight: 850,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Complete this step with the worksheet
            </span>
            <strong style={{ color: "#17204B", fontSize: 18, lineHeight: 1.25 }}>
              {stepTitle || worksheetResource.pathwayStepTitle || worksheetResource.title}
            </strong>
            <span style={{ color: "#5B6478", fontSize: 14, lineHeight: 1.45 }}>
              Open the worksheet, then add a photo or note in My Capture. It will be linked to this pathway step.
            </span>
          </div>
          <div className="mylearna-worksheet-action-buttons" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <a
              href={worksheetResource.href}
              target="_blank"
              rel="noopener noreferrer"
              style={buttonStyle}
            >
              Open worksheet
            </a>
            <Link
              href={worksheetEvidenceCaptureHref}
              style={buttonStyle}
              data-worksheet-evidence-action="add-completed-work"
            >
              Add completed work
            </Link>
            <a
              href={worksheetResource.href}
              download={worksheetResource.fileName}
              style={secondaryButtonStyle}
            >
              Download PDF
            </a>
          </div>
        </>
      ) : (
        <>
          <div className="mylearna-worksheet-action-copy" style={{ display: "grid", gap: 7 }}>
            <span
              style={{
                color: "#64748b",
                fontSize: 12,
                fontWeight: 850,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Evidence step
            </span>
            <strong style={{ color: "#17204B", fontSize: 17, lineHeight: 1.25 }}>
              {stepTitle || "Capture learning evidence"}
            </strong>
            <span style={{ color: "#5B6478", fontSize: 14, lineHeight: 1.45 }}>
              Add a quick note, photo, or work sample when this step is ready to record.
            </span>
          </div>
          <div>
            <Link
              data-guidance-id="pathways-next-capture"
              href={captureHref}
              style={buttonStyle}
              title="Open My Capture with this pathway step already connected."
              aria-label="Capture evidence for this pathway step"
            >
              Capture evidence
            </Link>
          </div>
        </>
      )}

      {latestEvidenceEntry ? (
        <div
          style={{
            border: "1px solid #D9D0FF",
            borderRadius: 16,
            background: "#F8F5FF",
            padding: 12,
            display: "grid",
            gap: 5,
          }}
        >
          <span style={{ color: "#64748b", fontSize: 12, fontWeight: 850 }}>
            Latest evidence
          </span>
          <strong style={{ color: "#17204B", fontSize: 14 }}>
            {latestEvidenceProgressLabel(latestEvidenceEntry)}
          </strong>
          <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
            {formatLatestEvidenceDate(latestEvidenceEntry)}
            {latestEvidenceEntry.imageUrl || latestEvidenceEntry.attachmentUrls.length
              ? " / Photo attached"
              : ""}
          </span>
        </div>
      ) : null}
    </section>
  );
}
