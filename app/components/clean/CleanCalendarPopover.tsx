"use client";

import React from "react";
import {
  CONTROLLED_LEARNING_AREAS,
  type CalendarTimeMode,
  type ControlledLearningArea,
} from "@/lib/clean/calendar/planningIntegrity";

const overlayStyle = {
  position: "fixed",
  left: 0,
  right: 0,
  top: "var(--calendar-popover-offset-top, 0px)",
  height:
    "var(--calendar-popover-visible-height, var(--calendar-popover-css-viewport-height, 100vh))",
  background: "rgba(15,23,42,0.38)",
  display: "grid",
  placeItems: "center",
  padding: 20,
  zIndex: 80,
  overflow: "hidden",
  overscrollBehavior: "none",
} satisfies React.CSSProperties;

const popoverStyle = {
  width: "min(560px, 100%)",
  maxHeight:
    "min(760px, calc(var(--calendar-popover-visible-height, var(--calendar-popover-css-viewport-height, 100vh)) - 40px))",
  border: "1px solid #cbd5e1",
  borderRadius: 18,
  background: "#ffffff",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr) auto",
  overflow: "hidden",
  boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
  outline: "none",
} satisfies React.CSSProperties;

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  color: "#334155",
  fontSize: 13,
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 16,
  background: "#ffffff",
};

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 96,
  resize: "vertical",
};

const buttonStyle: React.CSSProperties = {
  minHeight: 44,
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

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

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
  errorMessage,
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
  errorMessage?: string | null;
}) {
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const dialogRef = React.useRef<HTMLFormElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef(onClose);
  const savingRef = React.useRef(saving);

  React.useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  React.useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const documentElement = document.documentElement;
    const body = document.body;
    const previousDocumentOverflow = documentElement.style.overflow;
    const previousDocumentOverscroll = documentElement.style.overscrollBehavior;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    const scrollY = window.scrollY;

    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    const focusFrame = window.requestAnimationFrame(() => {
      dialogRef.current
        ?.querySelector<HTMLElement>("[data-calendar-popover-autofocus]")
        ?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!savingRef.current) closeRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || activeElement === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!dialogRef.current.contains(activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      documentElement.style.overflow = previousDocumentOverflow;
      documentElement.style.overscrollBehavior = previousDocumentOverscroll;
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
      window.requestAnimationFrame(() => previouslyFocused?.focus({ preventScroll: true }));
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const visualViewport = window.visualViewport;
    let viewportFrame = 0;

    const keepFocusedControlVisible = () => {
      const scrollBody = bodyRef.current;
      const activeElement = document.activeElement;
      if (!scrollBody || !(activeElement instanceof HTMLElement)) return;
      if (!scrollBody.contains(activeElement)) return;

      const bodyBounds = scrollBody.getBoundingClientRect();
      const controlBounds = activeElement.getBoundingClientRect();
      const topBoundary = bodyBounds.top + 16;
      const bottomBoundary = bodyBounds.bottom - 24;

      if (controlBounds.bottom > bottomBoundary) {
        scrollBody.scrollTop += controlBounds.bottom - bottomBoundary;
      } else if (controlBounds.top < topBoundary) {
        scrollBody.scrollTop -= topBoundary - controlBounds.top;
      }
    };

    const updateViewport = () => {
      viewportFrame = 0;
      const overlay = overlayRef.current;
      if (!overlay) return;

      if (visualViewport) {
        const visibleHeight = Math.max(0, Math.round(visualViewport.height));
        const offsetTop = Math.max(0, Math.round(visualViewport.offsetTop));
        const keyboardOverlap = Math.max(
          0,
          Math.round(window.innerHeight - visualViewport.height - visualViewport.offsetTop),
        );
        overlay.style.setProperty("--calendar-popover-visible-height", `${visibleHeight}px`);
        overlay.style.setProperty("--calendar-popover-offset-top", `${offsetTop}px`);
        overlay.style.setProperty(
          "--calendar-popover-keyboard-overlap",
          `${keyboardOverlap}px`,
        );
      } else {
        overlay.style.removeProperty("--calendar-popover-visible-height");
        overlay.style.removeProperty("--calendar-popover-offset-top");
        overlay.style.removeProperty("--calendar-popover-keyboard-overlap");
      }

      keepFocusedControlVisible();
    };

    const scheduleViewportUpdate = () => {
      if (viewportFrame) return;
      viewportFrame = window.requestAnimationFrame(updateViewport);
    };

    scheduleViewportUpdate();
    window.addEventListener("resize", scheduleViewportUpdate);
    visualViewport?.addEventListener("resize", scheduleViewportUpdate);
    visualViewport?.addEventListener("scroll", scheduleViewportUpdate);
    const scrollBody = bodyRef.current;
    scrollBody?.addEventListener("focusin", scheduleViewportUpdate);

    return () => {
      if (viewportFrame) window.cancelAnimationFrame(viewportFrame);
      window.removeEventListener("resize", scheduleViewportUpdate);
      visualViewport?.removeEventListener("resize", scheduleViewportUpdate);
      visualViewport?.removeEventListener("scroll", scheduleViewportUpdate);
      scrollBody?.removeEventListener("focusin", scheduleViewportUpdate);
    };
  }, [open]);

  if (!open) return null;

  const titleId = "calendar-learning-block-dialog-title";
  const descriptionId = "calendar-learning-block-dialog-description";
  const errorId = "calendar-learning-block-dialog-error";

  return (
    <div
      ref={overlayRef}
      className="mylearna-calendar-popover-overlay"
      style={overlayStyle}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <style jsx global>{`
        .mylearna-calendar-popover-overlay {
          --calendar-popover-css-viewport-height: 100vh;
        }

        @supports (height: 100svh) {
          .mylearna-calendar-popover-overlay {
            --calendar-popover-css-viewport-height: 100svh;
          }
        }

        @supports (height: 100dvh) {
          .mylearna-calendar-popover-overlay {
            --calendar-popover-css-viewport-height: 100dvh;
          }
        }

        .mylearna-calendar-popover-dialog :is(input, select, textarea, button):focus-visible {
          outline: 3px solid rgba(37, 99, 235, 0.42);
          outline-offset: 2px;
          border-color: #2563eb !important;
        }

        .mylearna-calendar-popover-body {
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-y;
          scroll-padding-top: 16px;
          scroll-padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
          padding: 16px 20px 24px;
          display: grid;
          align-content: start;
          gap: 16px;
        }

        .mylearna-calendar-popover-body :is(input, select, textarea, button, label, fieldset) {
          scroll-margin-bottom: 24px;
        }

        .mylearna-calendar-popover-header {
          position: sticky;
          top: 0;
          z-index: 2;
          padding: 20px 20px 14px;
          border-bottom: 1px solid #e2e8f0;
          background: rgba(255, 255, 255, 0.98);
        }

        .mylearna-calendar-popover-footer {
          position: sticky;
          bottom: 0;
          z-index: 2;
          padding: 14px 20px calc(14px + env(safe-area-inset-bottom, 0px));
          border-top: 1px solid #e2e8f0;
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.08);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        .mylearna-calendar-popover-status {
          margin-right: auto;
          color: #475569;
          font-size: 13px;
          font-weight: 700;
        }

        .mylearna-calendar-popover-status:empty {
          display: none;
        }

        .mylearna-calendar-popover-time-option {
          min-height: 44px;
          padding: 6px 4px;
        }

        @media (max-width: 720px) {
          .mylearna-calendar-popover-overlay {
            place-items: stretch;
            padding: 0 !important;
          }

          .mylearna-calendar-popover-dialog {
            width: 100% !important;
            height: 100% !important;
            max-height: none !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .mylearna-calendar-popover-header {
            padding: calc(14px + env(safe-area-inset-top, 0px))
              max(16px, env(safe-area-inset-right, 0px)) 12px
              max(16px, env(safe-area-inset-left, 0px));
          }

          .mylearna-calendar-popover-body {
            padding: 14px max(16px, env(safe-area-inset-right, 0px)) 24px
              max(16px, env(safe-area-inset-left, 0px));
            scroll-padding-bottom: calc(32px + env(safe-area-inset-bottom, 0px));
          }

          .mylearna-calendar-popover-footer {
            display: grid;
            grid-template-columns: minmax(96px, 0.7fr) minmax(150px, 1fr);
            padding: 10px max(16px, env(safe-area-inset-right, 0px))
              calc(10px + env(safe-area-inset-bottom, 0px))
              max(16px, env(safe-area-inset-left, 0px));
          }

          .mylearna-calendar-popover-footer > button {
            width: 100%;
            min-height: 44px;
          }

          .mylearna-calendar-popover-status {
            grid-column: 1 / -1;
            margin: 0;
          }
        }
      `}</style>

      <form
        ref={dialogRef}
        className="mylearna-calendar-popover-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={errorMessage ? `${descriptionId} ${errorId}` : descriptionId}
        aria-busy={saving}
        style={popoverStyle}
        tabIndex={-1}
        onSubmit={(event) => {
          event.preventDefault();
          if (!saving) onSave();
        }}
      >
        <header className="mylearna-calendar-popover-header">
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
            <h2 id={titleId} style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
              {mode === "edit" ? "Edit learning block" : "Add learning block"}
            </h2>
            <p id={descriptionId} style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>
              {formatDateLabel(plannedDate)}
            </p>
          </div>
        </header>

        <div ref={bodyRef} className="mylearna-calendar-popover-body">
          {errorMessage ? (
            <div
              id={errorId}
              role="alert"
              style={{
                border: "1px solid #fecaca",
                borderRadius: 12,
                background: "#fff7f7",
                color: "#b91c1c",
                padding: "10px 12px",
                lineHeight: 1.5,
              }}
            >
              {errorMessage}
            </div>
          ) : null}

          <label style={labelStyle}>
            What are you planning?
            <input
              data-calendar-popover-autofocus
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
              gap: 4,
            }}
          >
            <legend style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>
              Time
            </legend>
            <label
              className="mylearna-calendar-popover-time-option"
              style={{ display: "flex", gap: 8, alignItems: "center", color: "#334155" }}
            >
              <input
                type="radio"
                name="calendar-time-mode"
                checked={timeMode === "untimed"}
                onChange={() => onChangeTimeMode("untimed")}
              />
              No specific time
            </label>
            <label
              className="mylearna-calendar-popover-time-option"
              style={{ display: "flex", gap: 8, alignItems: "center", color: "#334155" }}
            >
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
        </div>

        <footer className="mylearna-calendar-popover-footer">
          <span className="mylearna-calendar-popover-status" role="status" aria-live="polite">
            {saving ? "Saving learning block…" : ""}
          </span>
          <button
            type="button"
            style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" style={buttonStyle} disabled={saving}>
            {saving ? "Saving…" : "Save learning block"}
          </button>
        </footer>
      </form>
    </div>
  );
}
