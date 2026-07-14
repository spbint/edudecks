"use client";

import React from "react";
import {
  CONTROLLED_LEARNING_AREAS,
  type CalendarTimeMode,
  type ControlledLearningArea,
} from "@/lib/clean/calendar/planningIntegrity";

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
  width: "min(560px, 100%)",
  border: "1px solid #cbd5e1",
  borderRadius: 18,
  background: "#ffffff",
  padding: 20,
  display: "grid",
  gap: 16,
  boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  color: "#334155",
  fontSize: 13,
  fontWeight: 700,
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

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function CleanCalendarPopover({
  open,
  mode,
  plannedDate,
  title,
  learnerId,
  learningArea,
  learningAreaCustom,
  timeMode,
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
  onChangeLearningAreaCustom,
  onChangeTimeMode,
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
  learningAreaCustom: string;
  timeMode: CalendarTimeMode;
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
  onChangeLearningAreaCustom: (value: string) => void;
  onChangeTimeMode: (value: CalendarTimeMode) => void;
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
            This week
          </div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>
            {mode === "edit" ? "Edit this block" : "Add a block"}
          </h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
            {formatDateLabel(plannedDate)}
          </p>
        </div>

        <label style={labelStyle}>
          What are you planning?
          <input
            autoFocus
            value={title}
            onChange={(event) => onChangeTitle(event.target.value)}
            placeholder="Read-aloud, maths, nature walk"
            style={inputStyle}
          />
        </label>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <label style={labelStyle}>
            Who is this for?
            <select
              value={learnerId}
              onChange={(event) => onChangeLearnerId(event.target.value)}
              style={inputStyle}
            >
              <option value="">Whole family</option>
              {learnerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Learning area
            <select
              value={learningArea}
              onChange={(event) =>
                onChangeLearningArea(event.target.value as ControlledLearningArea | "")
              }
              style={inputStyle}
            >
              <option value="">No learning area</option>
              {CONTROLLED_LEARNING_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>
          {learningArea === "Other" ? (
            <label style={labelStyle}>
              Custom label
              <input
                value={learningAreaCustom}
                onChange={(event) => onChangeLearningAreaCustom(event.target.value)}
                placeholder="Optional"
                style={inputStyle}
              />
            </label>
          ) : null}
        </div>

        <fieldset
          style={{
            border: "1px solid #dbeafe",
            borderRadius: 14,
            padding: 12,
            display: "grid",
            gap: 10,
          }}
        >
          <legend style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>
            Time
          </legend>
          <label style={{ display: "flex", gap: 8, alignItems: "center", color: "#334155" }}>
            <input
              type="radio"
              name="calendar-time-mode"
              checked={timeMode === "untimed"}
              onChange={() => onChangeTimeMode("untimed")}
            />
            No specific time
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", color: "#334155" }}>
            <input
              type="radio"
              name="calendar-time-mode"
              checked={timeMode === "timed"}
              onChange={() => onChangeTimeMode("timed")}
            />
            Set start and end time
          </label>
        </fieldset>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          <label style={labelStyle}>
            Start time
            <input
              type="time"
              value={startTime}
              onChange={(event) => onChangeStartTime(event.target.value)}
              style={inputStyle}
              disabled={timeMode === "untimed"}
            />
          </label>
          <label style={labelStyle}>
            End time
            <input
              type="time"
              value={endTime}
              onChange={(event) => onChangeEndTime(event.target.value)}
              style={inputStyle}
              disabled={timeMode === "untimed"}
            />
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <label style={labelStyle}>
            Program
            <select
              value={programId}
              onChange={(event) => onChangeProgramId(event.target.value)}
              style={inputStyle}
            >
              <option value="">None</option>
              {programOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Week / segment
            <select
              value={programSegmentId}
              onChange={(event) => onChangeProgramSegmentId(event.target.value)}
              style={inputStyle}
              disabled={!programId || !segmentOptions.length}
            >
              <option value="">
                {!programId ? "Choose a program first" : "None"}
              </option>
              {segmentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={labelStyle}>
          Notes
          <textarea
            value={description}
            onChange={(event) => onChangeDescription(event.target.value)}
            placeholder="Anything you want to remember for this block"
            style={textAreaStyle}
          />
        </label>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" style={buttonStyle} onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : mode === "edit" ? "Save changes" : "Save block"}
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
