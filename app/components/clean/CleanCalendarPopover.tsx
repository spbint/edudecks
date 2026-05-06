"use client";

import React from "react";

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.24)",
  display: "grid",
  placeItems: "center",
  padding: 20,
  zIndex: 50,
};

const popoverStyle: React.CSSProperties = {
  width: "min(520px, 100%)",
  border: "1px solid #cbd5e1",
  borderRadius: 18,
  background: "#ffffff",
  padding: 20,
  display: "grid",
  gap: 12,
  boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
};

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 96,
  resize: "vertical",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

type Option = {
  value: string;
  label: string;
};

export default function CleanCalendarPopover({
  open,
  mode,
  plannedDate,
  title,
  learnerId,
  learningArea,
  startTime,
  endTime,
  description,
  programId,
  programSegmentId,
  learnerOptions,
  programOptions,
  segmentOptions,
  onChangeTitle,
  onChangeLearnerId,
  onChangeLearningArea,
  onChangeStartTime,
  onChangeEndTime,
  onChangeDescription,
  onChangeProgramId,
  onChangeProgramSegmentId,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  mode: "create" | "edit";
  plannedDate: string;
  title: string;
  learnerId: string;
  learningArea: string;
  startTime: string;
  endTime: string;
  description: string;
  programId: string;
  programSegmentId: string;
  learnerOptions: Option[];
  programOptions: Option[];
  segmentOptions: Option[];
  onChangeTitle: (value: string) => void;
  onChangeLearnerId: (value: string) => void;
  onChangeLearningArea: (value: string) => void;
  onChangeStartTime: (value: string) => void;
  onChangeEndTime: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeProgramId: (value: string) => void;
  onChangeProgramSegmentId: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  if (!open) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={popoverStyle} onClick={(event) => event.stopPropagation()}>
        <div style={{ display: "grid", gap: 6 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            Calendar popover
          </div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>
            {mode === "edit" ? "Edit block" : "Add block"}
          </h2>
          <p style={{ margin: 0, color: "#475569" }}>{plannedDate}</p>
        </div>

        <input
          value={title}
          onChange={(event) => onChangeTitle(event.target.value)}
          placeholder="Title"
          style={inputStyle}
        />

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <select
            value={learnerId}
            onChange={(event) => onChangeLearnerId(event.target.value)}
            style={inputStyle}
          >
            <option value="">Family / all learners</option>
            {learnerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            value={learningArea}
            onChange={(event) => onChangeLearningArea(event.target.value)}
            placeholder="Learning area"
            style={inputStyle}
          />
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          <input
            type="time"
            value={startTime}
            onChange={(event) => onChangeStartTime(event.target.value)}
            style={inputStyle}
          />
          <input
            type="time"
            value={endTime}
            onChange={(event) => onChangeEndTime(event.target.value)}
            style={inputStyle}
          />
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <select
            value={programId}
            onChange={(event) => onChangeProgramId(event.target.value)}
            style={inputStyle}
          >
            <option value="">No linked program</option>
            {programOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={programSegmentId}
            onChange={(event) => onChangeProgramSegmentId(event.target.value)}
            style={inputStyle}
          >
            <option value="">No linked segment</option>
            {segmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={description}
          onChange={(event) => onChangeDescription(event.target.value)}
          placeholder="Optional notes"
          style={textAreaStyle}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" style={buttonStyle} onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
            onClick={onClose}
            disabled={saving}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
