"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";
import { encodePathwayContextNodeIds } from "@/lib/clean/evidence/curriculumContext";
import { createCleanEvidenceEntry } from "@/lib/clean/evidence/client";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import {
  updateFamilyEvidenceEntryAttachments,
  uploadFamilyEvidenceFiles,
  type UploadedFamilyEvidenceFile,
} from "@/lib/familyEvidence";
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
  latestEvidenceEntry?: CleanEvidenceEntry | null;
  initialFormOpen?: boolean;
  onEvidenceSaved?: (entry: CleanEvidenceEntry) => void;
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

function formatEvidenceDate(value: string | null | undefined) {
  const parsed = Date.parse(value || "");
  if (Number.isNaN(parsed)) return "Saved recently";

  const today = new Date();
  const candidate = new Date(parsed);
  if (candidate.toDateString() === today.toDateString()) {
    return "Saved today";
  }

  return `Saved ${new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
  }).format(candidate)}`;
}

function getProgressFromEvidence(entry: CleanEvidenceEntry | null | undefined) {
  const text = `${entry?.whatHappened || ""}\n${entry?.reflection || ""}`;
  const progressMatch = text.match(/Progress level:\s*([^\n.]+)/i);
  const progressLabel = progressMatch?.[1]?.trim();
  return progressOptions.find((option) => option.label === progressLabel) ?? null;
}

function getParentNoteFromEvidence(entry: CleanEvidenceEntry | null | undefined) {
  const match = entry?.reflection?.match(/Parent note:\s*([^\n]+)/i);
  return match?.[1]?.trim() || "";
}

function getObservedSkillStatusForProgress(progressLevel: WorksheetEvidenceProgressLevel) {
  if (progressLevel === "goal_achieved_extension") return "Strong";
  if (progressLevel === "goal_achieved") return "Secure";
  if (progressLevel === "consolidating") return "Developing";
  return "Still developing";
}

function getNextStepGuidance(progressLevel: WorksheetEvidenceProgressLevel) {
  switch (progressLevel) {
    case "needs_support":
      return "Revisit this step soon or use Daily Review for a quick warm-up.";
    case "working_towards":
      return "Keep this step active and try another example soon.";
    case "consolidating":
      return "Good progress. One more short practice could help secure it.";
    case "goal_achieved":
      return "This step can be treated as achieved.";
    case "goal_achieved_extension":
      return "This step is secure and ready for extension.";
    default:
      return "";
  }
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
  latestEvidenceEntry,
  initialFormOpen = false,
  onEvidenceSaved,
}: WorksheetEvidenceCaptureProps) {
  const [progressLevel, setProgressLevel] =
    useState<WorksheetEvidenceProgressLevel>("consolidating");
  const [captureFormOpen, setCaptureFormOpen] = useState(
    initialFormOpen || !latestEvidenceEntry,
  );
  const [localLatestEvidenceEntry, setLocalLatestEvidenceEntry] =
    useState<CleanEvidenceEntry | null>(latestEvidenceEntry ?? null);
  const [note, setNote] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [savedPhotoPreviewUrl, setSavedPhotoPreviewUrl] = useState("");
  const [savedAttachment, setSavedAttachment] =
    useState<UploadedFamilyEvidenceFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const selectedProgress = useMemo(
    () => progressOptions.find((option) => option.value === progressLevel) ?? progressOptions[2],
    [progressLevel],
  );
  useEffect(() => {
    setLocalLatestEvidenceEntry(latestEvidenceEntry ?? null);
    if (!latestEvidenceEntry) {
      setCaptureFormOpen(true);
    }
  }, [latestEvidenceEntry]);

  useEffect(() => {
    if (initialFormOpen) {
      setCaptureFormOpen(true);
    }
  }, [initialFormOpen]);

  const latestProgress = useMemo(
    () => getProgressFromEvidence(localLatestEvidenceEntry),
    [localLatestEvidenceEntry],
  );
  const latestParentNote = useMemo(
    () => getParentNoteFromEvidence(localLatestEvidenceEntry),
    [localLatestEvidenceEntry],
  );
  const latestHasPhoto = Boolean(
    localLatestEvidenceEntry?.imageUrl || localLatestEvidenceEntry?.attachmentUrls.length,
  );

  useEffect(() => {
    function handleOpenCapture(event: Event) {
      const detail = (event as CustomEvent<{ pathwayStepId?: string; stepKey?: string }>).detail;
      const matchesPathwayStep = detail?.pathwayStepId && detail.pathwayStepId === pathwayStepId;
      const matchesStepKey = detail?.stepKey && detail.stepKey === stepKey;
      if (!matchesPathwayStep && !matchesStepKey) return;
      setCaptureFormOpen(true);
    }

    window.addEventListener("mylearna:open-worksheet-evidence", handleOpenCapture);
    return () => {
      window.removeEventListener("mylearna:open-worksheet-evidence", handleOpenCapture);
    };
  }, [pathwayStepId, stepKey]);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setSaveError("");
    setSavedMessage("");
    setSavedAttachment(null);
    setSavedPhotoPreviewUrl("");
    setPhotoFile(file ?? null);
    setPhotoName(file?.name ?? "");
    setPhotoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : "";
    });
  }

  function removePhoto() {
    setPhotoFile(null);
    setPhotoName("");
    setSavedAttachment(null);
    setSavedPhotoPreviewUrl("");
    setPhotoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
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
      if (photoFile && !photoFile.type.startsWith("image/")) {
        throw new Error("Please choose an image file for worksheet evidence.");
      }

      const maxImageSizeBytes = 10 * 1024 * 1024;
      if (photoFile && photoFile.size > maxImageSizeBytes) {
        throw new Error("Please choose an image smaller than 10 MB.");
      }

      const entry = await createCleanEvidenceEntry(familyId, {
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
          photoName ? `Photo: attached (${photoName}).` : "No photo file selected.",
          progressLevel === "goal_achieved_extension" ? "Extension: true" : "",
        ]
          .filter(Boolean)
          .join("\n"),
        learningArea: `${subjectTitle} / ${strandTitle}`,
        curriculumNodeIds: encodePathwayContextNodeIds(
          [subjectKey, strandKey, stageKey, stepKey, pathwayStepId, worksheetResource.pathwayStepId],
          {
            source: "my-pathways",
            subjectKey,
            subjectLabel: subjectTitle,
            pathwayKey: strandKey,
            pathwayLabel: strandTitle,
            stageKey,
            stageLabel: stageTitle,
            pathwayStepId: pathwayStepId || worksheetResource.pathwayStepId,
            stepKey,
            stepTitle,
            observedSkillStatus: getObservedSkillStatusForProgress(progressLevel),
          },
        ),
        includeInPortfolio: true,
        includeInReport: true,
      });

      let uploadedAttachment: UploadedFamilyEvidenceFile | null = null;
      if (photoFile) {
        const uploadResult = await uploadFamilyEvidenceFiles({
          familyProfileId: familyId,
          studentId: learnerId,
          evidenceId: entry.id,
          files: [photoFile],
        });

        if (uploadResult.failed.length) {
          throw new Error(
            uploadResult.failed
              .map((failure) => `${failure.name}: ${failure.message}`)
              .join(" "),
          );
        }

        uploadedAttachment = uploadResult.uploaded[0] ?? null;
        if (!uploadedAttachment) {
          throw new Error("The photo could not be uploaded.");
        }

        await updateFamilyEvidenceEntryAttachments({
          evidenceId: entry.id,
          attachmentUrls: [{
            path: uploadedAttachment.path,
            name: uploadedAttachment.label,
            mimeType: uploadedAttachment.mimeType,
            size: uploadedAttachment.size,
            kind: uploadedAttachment.kind,
          }],
          imageUrl: uploadedAttachment.path,
        });
      }

      const savedEntry = {
        ...entry,
        attachmentUrls: uploadedAttachment ? [uploadedAttachment.path] : [],
        imageUrl: uploadedAttachment?.path ?? null,
      };

      setSavedAttachment(uploadedAttachment);
      setSavedPhotoPreviewUrl(uploadedAttachment ? photoPreviewUrl : "");
      setLocalLatestEvidenceEntry(savedEntry);
      onEvidenceSaved?.(savedEntry);
      setSavedMessage(
        uploadedAttachment
          ? `Saved worksheet evidence and uploaded ${uploadedAttachment.label}.`
          : `Saved worksheet evidence as ${selectedProgress.label}.`,
      );
      setCaptureFormOpen(false);
      setNote("");
      setPhotoFile(null);
      setPhotoName("");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save worksheet evidence.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      style={shellStyle}
      data-pathway-worksheet-evidence="active"
      data-worksheet-evidence-card="active"
      data-worksheet-evidence-step-id={pathwayStepId}
      data-worksheet-evidence-step-key={stepKey}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <span style={eyebrowStyle}>Complete this step with the worksheet</span>
        <h3 style={{ margin: 0, color: "#17204B", fontSize: 18, lineHeight: 1.25 }}>
          {stepTitle}
        </h3>
        <p style={{ margin: 0, color: "#5B6478", fontSize: 14, lineHeight: 1.45 }}>
          Open the worksheet, complete it with your learner, then add a photo of the completed work.
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
        <button
          type="button"
          onClick={() => setCaptureFormOpen(true)}
          style={{ ...primaryButtonStyle, cursor: "pointer" }}
          data-worksheet-evidence-action="add-completed-work"
        >
          {localLatestEvidenceEntry ? "Add another or update" : "Add completed work"}
        </button>
        <a
          href={worksheetResource.href}
          download={worksheetResource.fileName}
          style={secondaryButtonStyle}
        >
          Download PDF
        </a>
      </div>

      {localLatestEvidenceEntry ? (
        <div style={latestEvidenceStyle}>
          <div style={{ display: "grid", gap: 5 }}>
            <span style={{ color: "#64748b", fontSize: 12, fontWeight: 850 }}>
              Latest evidence
            </span>
            <strong style={{ color: latestProgress?.color || "#17204B", fontSize: 15 }}>
              {latestProgress?.label || "Evidence saved"}
            </strong>
            <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
              {formatEvidenceDate(
                localLatestEvidenceEntry.observedOn || localLatestEvidenceEntry.createdAt,
              )}
              {latestHasPhoto ? " / Photo attached" : ""}
            </span>
            {latestParentNote ? (
              <span style={{ color: "#475569", fontSize: 12, lineHeight: 1.45 }}>
                {latestParentNote}
              </span>
            ) : null}
          </div>
          {latestHasPhoto ? (
            <div style={photoAttachedBadgeStyle}>Photo attached</div>
          ) : null}
        </div>
      ) : null}

      {localLatestEvidenceEntry ? (
        <button
          type="button"
          onClick={() => setCaptureFormOpen(true)}
          style={addWorkButtonStyle}
          data-worksheet-evidence-action="add-completed-work"
        >
          Add another photo or update progress
        </button>
      ) : null}

      {captureFormOpen ? (
        <div style={captureFormStyle} data-worksheet-evidence-form="open">
          <div style={uploadBoxStyle} data-worksheet-evidence-photo-input="active">
            <label style={uploadActionStyle}>
              <span style={{ color: "#17204B", fontWeight: 850 }}>Take or upload photo</span>
              <span style={{ color: "#5B6478", fontSize: 13, lineHeight: 1.4 }}>
                Use your phone camera or choose an image of the completed worksheet.
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                style={hiddenFileInputStyle}
              />
            </label>
            {photoPreviewUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
                    {savedAttachment ? "Uploaded" : "Selected"}: {photoName}
                  </span>
                  <label style={smallSoftButtonStyle}>
                    Replace photo
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoChange}
                      style={hiddenFileInputStyle}
                    />
                  </label>
                  <button type="button" onClick={removePhoto} style={smallSoftButtonStyle}>
                    Remove photo
                  </button>
                </div>
              </>
            ) : null}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "#17204B", fontWeight: 800 }}>How did it go?</span>
            <div style={progressGridStyle} data-worksheet-evidence-progress-options="active">
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

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={saveEvidence}
              disabled={saving}
              style={saveButtonStyle}
              data-worksheet-evidence-save="active"
            >
              {saving ? "Saving..." : photoFile ? "Save evidence" : "Save without photo"}
            </button>
            <button
              type="button"
              onClick={() => setCaptureFormOpen(false)}
              disabled={saving}
              style={cancelButtonStyle}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {savedAttachment && savedPhotoPreviewUrl ? (
        <div style={savedAttachmentStyle}>
          <span style={{ color: "#15803D", fontSize: 13, fontWeight: 850 }}>
            Photo saved
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={savedPhotoPreviewUrl}
            alt="Saved worksheet evidence"
            style={{
              width: 96,
              height: 72,
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid #BBF7D0",
            }}
          />
          <span style={{ color: "#475569", fontSize: 12, fontWeight: 700 }}>
            Stored in Supabase Storage: {savedAttachment.label}
          </span>
        </div>
      ) : null}

      {savedMessage ? <p style={successStyle}>{savedMessage}</p> : null}
      {savedMessage ? (
        <div style={nextStepStyle}>
          <strong style={{ color: selectedProgress.color, fontSize: 13 }}>
            {selectedProgress.label}
          </strong>
          <span style={{ color: "#475569", fontSize: 13, lineHeight: 1.45 }}>
            {getNextStepGuidance(progressLevel)}
          </span>
          <span style={{ color: "#15803D", fontSize: 12, fontWeight: 800 }}>
            Saved to evidence. Included for portfolio and reports.
          </span>
        </div>
      ) : null}
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

const addWorkButtonStyle = {
  ...primaryButtonStyle,
  width: "100%",
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(108,77,246,0.14)",
} satisfies CSSProperties;

const captureFormStyle = {
  border: "1px solid #D9D0FF",
  borderRadius: 18,
  background: "#FBFAFF",
  padding: "clamp(12px, 2.2vw, 16px)",
  display: "grid",
  gap: 14,
} satisfies CSSProperties;

const hiddenFileInputStyle = {
  position: "absolute",
  width: 1,
  height: 1,
  opacity: 0,
} satisfies CSSProperties;

const uploadBoxStyle = {
  border: "1px dashed #CBD5E1",
  borderRadius: 16,
  background: "#F8FAFC",
  padding: 14,
  display: "grid",
  gap: 10,
} satisfies CSSProperties;

const uploadActionStyle = {
  border: "1px solid #D9D0FF",
  borderRadius: 16,
  background: "#FFFFFF",
  padding: 14,
  minHeight: 86,
  display: "grid",
  gap: 7,
  cursor: "pointer",
  boxShadow: "0 6px 18px rgba(23,32,75,0.035)",
} satisfies CSSProperties;

const latestEvidenceStyle = {
  border: "1px solid #D9D0FF",
  borderRadius: 16,
  background: "#F8F5FF",
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
} satisfies CSSProperties;

const photoAttachedBadgeStyle = {
  border: "1px solid #CDEFD9",
  borderRadius: 999,
  background: "#F0FDF4",
  color: "#15803D",
  padding: "7px 10px",
  fontSize: 12,
  fontWeight: 850,
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
  flex: "1 1 220px",
  cursor: "pointer",
} satisfies CSSProperties;

const cancelButtonStyle = {
  ...secondaryButtonStyle,
  flex: "1 1 140px",
  cursor: "pointer",
} satisfies CSSProperties;

const smallSoftButtonStyle = {
  border: "1px solid #CBD5E1",
  borderRadius: 999,
  background: "#FFFFFF",
  color: "#17204B",
  padding: "7px 10px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
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

const savedAttachmentStyle = {
  border: "1px solid #BBF7D0",
  borderRadius: 16,
  background: "#F0FDF4",
  padding: 12,
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 10,
} satisfies CSSProperties;

const nextStepStyle = {
  border: "1px solid #E7EAF2",
  borderRadius: 16,
  background: "#FFFFFF",
  padding: 12,
  display: "grid",
  gap: 5,
} satisfies CSSProperties;
