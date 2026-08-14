"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  upsertCleanAssessmentSkillStatus,
} from "@/lib/clean/assessments/client";
import type {
  CleanAssessmentSkillStatus,
  CleanAssessmentStatusValue,
  UpsertCleanAssessmentSkillStatusInput,
} from "@/lib/clean/assessments/types";
import {
  PARENT_PROGRESS_STATUS_VALUES,
  buildParentProgressStatusInput,
  evidenceProgressToParentStatus,
  storedProgressToParentStatus,
  type ParentProgressStatus,
} from "@/lib/clean/pathways/parentProgress";

type CleanPathwayProgressConfirmationProps = {
  familyId: string;
  learnerId: string;
  subjectKey: UpsertCleanAssessmentSkillStatusInput["subjectKey"];
  stageKey: UpsertCleanAssessmentSkillStatusInput["stageKey"];
  strandKey: string;
  stepKey: string;
  pathwayStepId: string;
  confirmedStatus?: CleanAssessmentStatusValue | null;
  evidenceSuggestion?: string | null;
  onSaved?: (status: CleanAssessmentSkillStatus) => void;
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 10,
  padding: "8px 11px",
  minHeight: 42,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

export default function CleanPathwayProgressConfirmation({
  familyId,
  learnerId,
  subjectKey,
  stageKey,
  strandKey,
  stepKey,
  pathwayStepId,
  confirmedStatus = null,
  evidenceSuggestion = null,
  onSaved,
}: CleanPathwayProgressConfirmationProps) {
  const confirmedParentStatus = confirmedStatus
    ? storedProgressToParentStatus(confirmedStatus)
    : "Not checked yet";
  const suggestion = evidenceSuggestion
    ? evidenceProgressToParentStatus(evidenceSuggestion)
    : null;
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<ParentProgressStatus>(confirmedParentStatus);
  const [savedStatus, setSavedStatus] =
    useState<ParentProgressStatus>(confirmedParentStatus);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const previousConfirmedStatus = useRef(confirmedParentStatus);

  useEffect(() => {
    if (previousConfirmedStatus.current === confirmedParentStatus) return;
    previousConfirmedStatus.current = confirmedParentStatus;
    if (open) return;
    setSelectedStatus(confirmedParentStatus);
    setSavedStatus(confirmedParentStatus);
  }, [confirmedParentStatus, open]);

  function beginEditing() {
    setSelectedStatus(savedStatus);
    setError(null);
    setOpen(true);
  }

  function cancelEditing() {
    setSelectedStatus(savedStatus);
    setError(null);
    setOpen(false);
  }

  async function saveProgress() {
    setSaving(true);
    setError(null);

    try {
      const saved = await upsertCleanAssessmentSkillStatus(
        familyId,
        buildParentProgressStatusInput({
          learnerId,
          subjectKey,
          pathwayStepId,
          stageKey,
          strandKey,
          stepKey,
          status: selectedStatus,
        }),
      );

      setSavedStatus(selectedStatus);
      setOpen(false);
      onSaved?.(saved);
    } catch {
      setError("Could not save this progress confirmation. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-label={`Progress confirmation for ${stepKey}`}
      style={{
        border: "1px solid #E7EAF2",
        borderRadius: 14,
        background: "#F8FAFC",
        padding: 12,
        display: "grid",
        gap: 8,
      }}
      data-pathway-progress-confirmation="true"
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 2, flex: "1 1 220px" }}>
          <strong style={{ color: "#17204B", fontSize: 14 }}>How is this learning going?</strong>
          <span style={{ color: "#64748b", fontSize: 12, lineHeight: 1.4 }}>
            Parent confirmation: {savedStatus}
          </span>
        </div>
        {!open ? (
          <button type="button" onClick={beginEditing} style={secondaryButtonStyle}>
            Confirm progress
          </button>
        ) : null}
      </div>

      {!open && suggestion && !confirmedStatus ? (
        <span style={{ color: "#64748b", fontSize: 12, lineHeight: 1.4 }}>
          Evidence suggests: {suggestion}. This is only a suggestion until you confirm it.
        </span>
      ) : null}

      {open ? (
        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 5, color: "#334155", fontSize: 13, fontWeight: 700 }}>
            Progress
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value as ParentProgressStatus)}
              disabled={saving}
              aria-label="Parent-confirmed progress"
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                background: "#ffffff",
                color: "#0f172a",
                padding: "9px 10px",
                minHeight: 44,
                fontSize: 14,
              }}
            >
              {PARENT_PROGRESS_STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => void saveProgress()} disabled={saving} style={secondaryButtonStyle}>
              {saving ? "Saving…" : "Save progress"}
            </button>
            <button type="button" onClick={cancelEditing} disabled={saving} style={secondaryButtonStyle}>
              Cancel
            </button>
          </div>
          {error ? (
            <p role="alert" style={{ margin: 0, color: "#b42318", fontSize: 13 }}>
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
