"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";
import { createCleanEvidenceEntry } from "@/lib/clean/evidence/client";
import type { MathWorksheetResource } from "@/lib/clean/resources/mathWorksheetResources";

export type WorksheetEvidenceProgressLevel =
  | "needs_support"
  | "working_towards"
  | "consolidating"
  | "goal_achieved"
  | "goal_achieved_extension";

type WorksheetEvidenceCaptureProps = {
  familyId: string;
  learnerId: string;
  subjectKey: string;
  subjectTitle: string;
  strandKey: string;
  strandTitle: string;
  stageKey: string;
  stageTitle: string;
  pathwayStepId: string;
  stepKey: string;
  stepTitle: string;
  worksheetResource: MathWorksheetResource;
};

const progressOptions: Array<{
  value: WorksheetEvidenceProgressLevel;
  label: string;
  helper: string;
  status: string;
  border: string;
  background: string;
  color: string;
}> = [
  {
    value: "needs_support",
    label: "Needs support",
    helper: "Keep this step active.",
    status: "needs_support",
    border: "#fecdd3",
    background: "#fff1f2",
    color: "#be123c",
  },
  {
    value: "working_towards",
    label: "Working towards",
    helper: "Progress is beginning.",
    status: "developing",
    border: "#fed7aa",
    background: "#fff7ed",
    color: "#c2410c",
  },
  {
    value: "consolidating",
    label: "Consolidating",
    helper: "Mostly there, keep practising.",
    status: "consolidating",
    border: "#fde68a",
    background: "#fffbeb",
    color: "#a16207",
  },
  {
    value: "goal_achieved",
    label: "Goal achieved",
    helper: "Treat this step as secure.",
    status: "secure",
    border: "#bbf7d0",
    background: "#f0fdf4",
    color: "#15803d",
  },
  {
    value: "goal_achieved_extension",
    label: "Goal achieved + extension",
    helper: "Secure, with extension noted.",
    status: "secure",
    border: "#c7d2fe",
    background: "#eef2ff",
    color: "#4338ca",
  },
];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function WorksheetEvidenceCapture({
  familyId,
  learnerId,
  subjectKey,
  subjectTitle,
  strandKey,
  strandTitle,
  stageKey,
  stageTitle,
  pathwayStepId,
  stepKey,
  stepTitle,
  worksheetResource,
}: WorksheetEvidenceCaptureProps) {
  const [progressLevel, setProgressLevel] =
    useState<WorksheetEvidenceProgressLevel>("consolidating");
  const [note, setNote] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const selectedProgress = useMemo(
    () => progressOptions.find((option) => option.value === progressLevel) ?? progressOptions[2],
    [progressLevel],
  );

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPhotoName(file?.name ?? "");
    setPhotoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : "";
    });
  }

  async function saveEvidence() {
    setSaveError("");
    setSavedMessage("");

    if (!familyId || !learnerId) {
      setSaveError("Choose a learner before saving worksheet evidence.");
      return;
    }

    setSaving(true);
    try {
      await createCleanEvidenceEntry(familyId, {
        learnerId,
        observedOn: todayIsoDate(),
        title: `Worksheet evidence: ${stepTitle}`,
        whatHappened: [
          `Completed worksheet: ${worksheetResource.title}`,
          `Progress level: ${selectedProgress.label}`,
          `Mapped status: ${selectedProgress.status}`,
          `Pathway step: ${stepTitle}`,
          `Stage: ${stageTitle || stageKey}`,
        ].join("\n"),
        reflection: [
          note ? `Parent note: ${note}` : "",
          photoName
            ? `Photo selected: ${photoName}. File upload storage is not connected in this evidence save yet.`
            : "No photo file selected.",
          `Worksheet: ${worksheetResource.href}`,
          `Source: worksheet_evidence`,
          progressLevel === "goal_achieved_extension" ? "Extension: true" : "",
        ]
          .filter(Boolean)
          .join("\n"),
        learningArea: `${subjectTitle} / ${strandTitle}`,
        curriculumNodeIds: [
          subjectKey,
          strandKey,
          stageKey,
          stepKey,
          pathwayStepId,
          worksheetResource.pathwayStepId,
        ].filter(Boolean),
        includeInPortfolio: true,
        includeInReport: true,
      });

      setSavedMessage(`Saved worksheet evidence as ${selectedProgress.label}.`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save worksheet evidence.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={shellStyle} data-pathway-worksheet-evidence="active">
      <div style={{ display: "grid", gap: 8 }}>
        <span style={eyebrowStyle}>Complete this step with the worksheet</span>
        <h3 style={{ margin: 0, color: "#17204B", fontSize: 18, lineHeight: 1.25 }}>
          {stepTitle}
        </h3>
        <p style={{ margin: 0, color: "#5B6478", fontSize: 14, lineHeight: 1.45 }}>
          Open the worksheet, complete it together, then capture the work and mark how it went.
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <a
          href={worksheetResource.href}
          target="_blank"
          rel="noopener noreferrer"
          style={primaryButtonStyle}
        >
          Open worksheet
        </a>
        <a
          href={worksheetResource.href}
          download={worksheetResource.fileName}
          style={secondaryButtonStyle}
        >
          Download worksheet
        </a>
      </div>

      <div style={uploadBoxStyle}>
        <label style={{ display: "grid", gap: 8, cursor: "pointer" }}>
          <span style={{ color: "#17204B", fontWeight: 800 }}>Add completed work</span>
          <span style={{ color: "#5B6478", fontSize: 13, lineHeight: 1.4 }}>
            Take a photo on mobile or upload an image of the completed worksheet.
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            style={fileInputStyle}
          />
        </label>
        {photoPreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoPreviewUrl}
            alt="Selected worksheet evidence preview"
            style={{
              width: "100%",
              maxHeight: 180,
              objectFit: "cover",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
            }}
          />
        ) : null}
        {photoName ? (
          <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
            Selected: {photoName}
          </span>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <span style={{ color: "#17204B", fontWeight: 800 }}>How did it go?</span>
        <div style={progressGridStyle}>
          {progressOptions.map((option) => {
            const selected = option.value === progressLevel;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setProgressLevel(option.value)}
                style={{
                  border: `1px solid ${selected ? option.color : option.border}`,
                  borderRadius: 16,
                  background: selected ? option.background : "#FFFFFF",
                  color: selected ? option.color : "#17204B",
                  padding: "12px 13px",
                  textAlign: "left",
                  display: "grid",
                  gap: 4,
                  minHeight: 72,
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                <strong style={{ fontSize: 14 }}>{option.label}</strong>
                <span style={{ fontSize: 12, color: selected ? option.color : "#64748b" }}>
                  {option.helper}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <label style={{ display: "grid", gap: 7 }}>
        <span style={{ color: "#17204B", fontWeight: 800 }}>Optional note</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What helped? What needs another pass?"
          rows={3}
          style={textareaStyle}
        />
      </label>

      <button type="button" onClick={saveEvidence} disabled={saving} style={saveButtonStyle}>
        {saving ? "Saving..." : "Save evidence"}
      </button>

      {savedMessage ? <p style={successStyle}>{savedMessage}</p> : null}
      {saveError ? <p style={errorStyle}>{saveError}</p> : null}
    </section>
  );
}

const shellStyle = {
  border: "1px solid #E7EAF2",
  borderRadius: 18,
  background: "#FFFFFF",
  padding: "clamp(14px, 2.4vw, 20px)",
  display: "grid",
  gap: 14,
  boxShadow: "0 8px 22px rgba(23,32,75,0.045)",
} satisfies CSSProperties;

const eyebrowStyle = {
  color: "#6C4DF6",
  fontSize: 12,
  fontWeight: 850,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
} satisfies CSSProperties;

const primaryButtonStyle = {
  border: 0,
  borderRadius: 999,
  background: "#6C4DF6",
  color: "#FFFFFF",
  padding: "11px 15px",
  minHeight: 44,
  fontSize: 14,
  fontWeight: 800,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
} satisfies CSSProperties;

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  border: "1px solid #E7EAF2",
  background: "#FFFFFF",
  color: "#17204B",
} satisfies CSSProperties;

const uploadBoxStyle = {
  border: "1px dashed #CBD5E1",
  borderRadius: 16,
  background: "#F8FAFC",
  padding: 14,
  display: "grid",
  gap: 10,
} satisfies CSSProperties;

const fileInputStyle = {
  width: "100%",
  minHeight: 44,
  border: "1px solid #E7EAF2",
  borderRadius: 12,
  background: "#FFFFFF",
  padding: 9,
  color: "#17204B",
} satisfies CSSProperties;

const progressGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 8,
} satisfies CSSProperties;

const textareaStyle = {
  width: "100%",
  border: "1px solid #E7EAF2",
  borderRadius: 14,
  padding: 12,
  color: "#17204B",
  font: "inherit",
  resize: "vertical",
} satisfies CSSProperties;

const saveButtonStyle = {
  ...primaryButtonStyle,
  width: "100%",
  cursor: "pointer",
} satisfies CSSProperties;

const successStyle = {
  margin: 0,
  border: "1px solid #BBF7D0",
  borderRadius: 14,
  background: "#F0FDF4",
  color: "#15803D",
  padding: "10px 12px",
  fontSize: 13,
  fontWeight: 800,
} satisfies CSSProperties;

const errorStyle = {
  ...successStyle,
  border: "1px solid #FECDD3",
  background: "#FFF1F2",
  color: "#BE123C",
} satisfies CSSProperties;
