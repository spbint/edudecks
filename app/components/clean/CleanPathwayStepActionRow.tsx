"use client";

import Link from "next/link";
import React from "react";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import type { ParentProgressStatus } from "@/lib/clean/pathways/parentProgress";
import {
  resolvePathwayNextAction,
  type PathwayNextAction,
} from "@/lib/clean/pathways/pathwayNextAction";
import {
  CUSTOMER_PATHWAY_PRACTICE_AVAILABLE,
  CUSTOMER_PATHWAY_WORKSHEET_VIEW_AVAILABLE,
} from "@/lib/clean/pathways/pathwayCustomerActionAvailability";
import { trackPathwayAnalyticsEvent } from "@/lib/clean/pathways/pathwayAnalytics";
import type { MathWorksheetResource } from "@/lib/clean/resources/mathWorksheetResources";

type CleanPathwayStepActionRowProps = {
  captureHref: string;
  practiceHref?: string;
  assessmentHref?: string;
  nextStepHref?: string;
  autoCheckStatus?: ParentProgressStatus | null;
  parentProgress?: ParentProgressStatus;
  emphasizePrimary?: boolean;
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
  confidenceStatusLabel?: string | null;
  isExactStepContext?: boolean;
  worksheetResource?: MathWorksheetResource | null;
  latestEvidenceEntry?: CleanEvidenceEntry | null;
  manualComplete?: boolean;
  onManualCompletionChange?: (completed: boolean) => void;
  onActionSelected?: (action: PathwayNextAction, primary: boolean) => void;
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "9px 12px",
  minHeight: 44,
  fontSize: 14,
  fontWeight: 700,
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
  minHeight: 40,
  padding: "6px 9px",
  fontSize: 13,
  fontWeight: 600,
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
  return match?.[1]?.trim() || "Learning recorded";
}

function actionLabel(action: PathwayNextAction, primary: boolean) {
  switch (action) {
    case "check-understanding":
      return "Check understanding";
    case "practise":
      return primary ? "Practise this focus" : "Practise";
    case "next-step":
      return "Next step";
    case "worksheet":
      return "Download worksheet";
    case "capture-evidence":
      return "Add to Portfolio";
  }
}

export default function CleanPathwayStepActionRow({
  captureHref,
  practiceHref = "",
  assessmentHref = "",
  nextStepHref = "",
  autoCheckStatus = null,
  parentProgress = "Not checked yet",
  emphasizePrimary = false,
  subjectKey,
  strandKey,
  stageKey,
  pathwayStepId,
  stepKey,
  worksheetResource,
  latestEvidenceEntry = null,
  manualComplete = false,
  onManualCompletionChange,
  onActionSelected,
}: CleanPathwayStepActionRowProps) {
  const worksheetEvidenceCaptureHref =
    worksheetResource && captureHref
      ? appendWorksheetEvidenceParams(captureHref, worksheetResource)
      : captureHref;
  const customerPracticeHref = CUSTOMER_PATHWAY_PRACTICE_AVAILABLE ? practiceHref : "";
  const actionHref: Record<PathwayNextAction, string> = {
    "check-understanding": assessmentHref,
    practise: customerPracticeHref,
    "next-step": nextStepHref,
    worksheet: worksheetResource?.href || "",
    "capture-evidence": worksheetResource ? worksheetEvidenceCaptureHref : captureHref,
  };
  const actionPlan = resolvePathwayNextAction({
    autoCheckStatus,
    parentProgress,
    availability: {
      "check-understanding": Boolean(assessmentHref),
      practise: Boolean(customerPracticeHref),
      "next-step": Boolean(nextStepHref),
      worksheet: CUSTOMER_PATHWAY_WORKSHEET_VIEW_AVAILABLE && Boolean(worksheetResource),
      "capture-evidence": Boolean(captureHref),
    },
  });
  const actionAnalyticsContext = {
    subjectKey,
    strandKey,
    stageKey,
    pathwayStepId,
    stepKey,
    progressStatus: autoCheckStatus || parentProgress,
    recommendedAction: undefined,
  } as const;
  const trackActionSelection = (action: PathwayNextAction, primary: boolean) => {
    const recommendedAction = action.replace(/-/g, "_") as
      | "check_understanding"
      | "practise"
      | "next_step"
      | "worksheet"
      | "capture_evidence";
    if (primary) {
      trackPathwayAnalyticsEvent("pathway_recommended_action_selected", {
        ...actionAnalyticsContext,
        recommendedAction,
      });
    }
    if (action === "capture-evidence") {
      trackPathwayAnalyticsEvent("pathway_capture_selected", {
        ...actionAnalyticsContext,
      });
    }
    if (action === "next-step") {
      trackPathwayAnalyticsEvent("pathway_next_step_selected", {
        ...actionAnalyticsContext,
      });
    }
    onActionSelected?.(action, primary);
  };
  const renderAction = (action: PathwayNextAction, primary = false) => {
    const href = actionHref[action];
    const isWorksheet = action === "worksheet";
    const label = actionLabel(action, primary);

    if (isWorksheet) {
      return (
        <a
          key={action}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackActionSelection(action, primary)}
          style={primary ? buttonStyle : secondaryButtonStyle}
        >
          {label}
        </a>
      );
    }

    return (
      <Link
        key={action}
        href={href}
        onClick={() => trackActionSelection(action, primary)}
        style={primary ? buttonStyle : secondaryButtonStyle}
        data-worksheet-evidence-action={
          action === "capture-evidence" ? "add-completed-work" : undefined
        }
        data-guidance-id={
          action === "capture-evidence" ? "pathways-next-capture" : undefined
        }
        title={
          action === "capture-evidence"
            ? "Open My Capture with this pathway step already connected."
            : undefined
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <section
      className="mylearna-worksheet-action-card"
      style={{
        border: emphasizePrimary ? "1px solid #c7d2fe" : "1px solid #E7EAF2",
        borderRadius: 18,
        background: "#FFFFFF",
        padding: "clamp(14px, 2.4vw, 20px)",
        display: "grid",
        gap: 14,
        boxShadow: emphasizePrimary ? "0 8px 22px rgba(79, 70, 229, 0.08)" : "0 8px 22px rgba(23,32,75,0.045)",
      }}
      data-pathway-worksheet-evidence="route-to-capture"
    >
      <div style={{ display: "grid", gap: 7 }}>
        <span
          style={{
            color: emphasizePrimary ? "#4f46e5" : "#64748b",
            fontSize: 12,
            fontWeight: 850,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {emphasizePrimary ? "Recommended next action" : "Actions for this step"}
        </span>
        {actionPlan.supportingText ? (
          <span style={{ color: "#5B6478", fontSize: 14, lineHeight: 1.45 }}>
            {actionPlan.supportingText}
          </span>
        ) : null}
      </div>

      {actionPlan.primary ? (
        <div
          className="mylearna-pathway-primary-action"
          data-pathway-primary-action="true"
        >
          {renderAction(actionPlan.primary, true)}
        </div>
      ) : null}

      {actionPlan.secondary.length || (!manualComplete && onManualCompletionChange) || worksheetResource ? (
        <div
          className="mylearna-pathway-secondary-actions"
          style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}
        >
          {actionPlan.secondary.map((action) => renderAction(action))}
          {!manualComplete && onManualCompletionChange ? (
            <button
              type="button"
              onClick={() => onManualCompletionChange(true)}
              style={secondaryButtonStyle}
            >
              Mark complete
            </button>
          ) : null}
          {worksheetResource ? (
            <a
              href={worksheetResource.href}
              download={worksheetResource.fileName}
              style={secondaryButtonStyle}
            >
              Download worksheet
            </a>
          ) : null}
        </div>
      ) : null}

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
            Latest completed work
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
