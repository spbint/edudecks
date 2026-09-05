"use client";

import React, { useRef } from "react";
import {
  CLEAN_CAPTURE_FILE_ACCEPT,
  CLEAN_CAPTURE_IMAGE_ACCEPT,
} from "@/lib/clean/evidence/attachmentPolicy";
import type { CleanEvidenceAttachmentState } from "@/lib/clean/evidence/useCleanEvidenceAttachments";

const visuallyHiddenFileInputStyle: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const tertiaryButtonStyle: React.CSSProperties = {
  minHeight: 36,
  border: 0,
  background: "transparent",
  color: "#4f46b8",
  padding: "6px 2px",
  fontSize: 14,
  fontWeight: 800,
  textDecoration: "underline",
  textUnderlineOffset: 3,
  cursor: "pointer",
};

type Props = {
  attachments: CleanEvidenceAttachmentState;
  disabled?: boolean;
  cameraFirst?: boolean;
  compact?: boolean;
  title?: string;
};

export default function CleanEvidenceAttachmentControls({
  attachments,
  disabled = false,
  cameraFirst = false,
  compact = false,
  title = "Add evidence",
}: Props) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const libraryInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <fieldset
      style={{
        display: "grid",
        gap: 10,
        border: 0,
        padding: 0,
        margin: 0,
      }}
      data-capture-attachment-controls="shared"
    >
      <legend style={{ color: "#17204b", fontWeight: 850, padding: 0 }}>
        {title} <span style={{ color: "#5b6478", fontWeight: 500, fontSize: 13 }}>(optional)</span>
      </legend>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          style={{ minHeight: compact ? 56 : 64, border: `1px solid ${cameraFirst ? "#6c4df6" : "#c4b5fd"}`, borderRadius: 12, background: cameraFirst ? "#6c4df6" : "#faf9ff", color: cameraFirst ? "#ffffff" : "#17204b", fontWeight: 800, cursor: disabled ? "default" : "pointer", ...(cameraFirst ? { gridColumn: "1 / -1" } : {}) }}
        >
          Take photo
        </button>
        <button
          type="button"
          onClick={() => libraryInputRef.current?.click()}
          disabled={disabled}
          style={{ minHeight: compact ? 56 : 64, border: "1px solid #cbd5e1", borderRadius: 12, background: "#ffffff", color: "#17204b", fontWeight: 800, cursor: disabled ? "default" : "pointer" }}
        >
          Choose photo
        </button>
        <label
          style={{ minHeight: compact ? 56 : 64, border: "1px solid #cbd5e1", borderRadius: 12, background: "#ffffff", color: "#17204b", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: disabled ? "default" : "pointer" }}
        >
          Upload file
          <input
            ref={fileInputRef}
            type="file"
            accept={CLEAN_CAPTURE_FILE_ACCEPT}
            disabled={disabled}
            onChange={attachments.handleEvidenceFileChange}
            aria-label="Upload a file"
            style={visuallyHiddenFileInputStyle}
            data-capture-file-input="shared"
          />
        </label>
      </div>
      <input
        ref={cameraInputRef}
        type="file"
        accept={CLEAN_CAPTURE_IMAGE_ACCEPT}
        capture="environment"
        disabled={disabled}
        onChange={attachments.handlePhotoChange}
        aria-label="Take a photo"
        style={visuallyHiddenFileInputStyle}
        data-capture-photo-input-camera="shared"
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept={CLEAN_CAPTURE_IMAGE_ACCEPT}
        disabled={disabled}
        onChange={attachments.handlePhotoChange}
        aria-label="Choose a photo"
        style={visuallyHiddenFileInputStyle}
        data-capture-photo-input-library="shared"
      />
      {attachments.attachmentError ? (
        <p role="alert" style={{ margin: 0, color: "#b91c1c", fontSize: 13, lineHeight: 1.5 }}>
          {attachments.attachmentError}
        </p>
      ) : null}
      {attachments.photoFile ? (
        <div style={{ display: "grid", gap: 8, border: "1px solid #bbf7d0", borderRadius: 12, padding: 10, background: "#f0fdf4" }}>
          <strong style={{ color: "#15803d", fontSize: 13 }}>Photo attached: {attachments.photoName}</strong>
          {attachments.photoPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={attachments.photoPreviewUrl} alt="Selected learning evidence" style={{ width: "100%", maxHeight: compact ? 220 : 260, objectFit: "contain", borderRadius: 10 }} />
          ) : null}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={() => libraryInputRef.current?.click()} disabled={disabled} style={tertiaryButtonStyle}>Replace photo</button>
            <button type="button" onClick={attachments.removePhoto} disabled={disabled} style={tertiaryButtonStyle}>Remove photo</button>
          </div>
          <span style={{ color: "#64748b", fontSize: 12 }}>{attachments.photoSelectionMessage}</span>
        </div>
      ) : null}
      {attachments.evidenceFile ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", border: "1px solid #dbeafe", borderRadius: 12, padding: 10, background: "#eff6ff" }}>
          <div style={{ display: "grid", gap: 3 }}>
            <strong style={{ color: "#1d4ed8", fontSize: 13 }}>File attached: {attachments.evidenceFileName}</strong>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled} style={{ ...tertiaryButtonStyle, width: "fit-content" }}>Replace file</button>
            <span style={{ color: "#64748b", fontSize: 12 }}>{attachments.fileSelectionMessage}</span>
          </div>
          <button type="button" onClick={attachments.removeEvidenceFile} disabled={disabled} style={tertiaryButtonStyle}>Remove file</button>
        </div>
      ) : null}
    </fieldset>
  );
}
