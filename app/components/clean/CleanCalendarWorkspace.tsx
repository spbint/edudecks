"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import CleanCalendarPopover from "@/app/components/clean/CleanCalendarPopover";
import CleanPageIntroVideo from "@/app/components/clean/CleanPageIntroVideo";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanFirstRunSetupGate from "@/app/components/clean/setup/CleanFirstRunSetupGate";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import CoreJourneyCue, {
  CoreJourneyHelp,
} from "@/app/components/clean/design-v2/CoreJourneyCue";
import MyPlanHeader from "@/app/components/clean/design-v2/MyPlanHeader";
import {
  GuidancePageAction,
  GuidanceSetupProgress,
  GuidanceSetupNextAction,
} from "@/app/components/clean/guidance/GuidanceToggle";
import { useGuidance } from "@/app/components/clean/guidance/GuidanceProvider";
import {
  createCleanCalendarItem,
  deleteCleanCalendarItem,
  listCleanCalendarItems,
  updateCleanCalendarItem,
} from "@/lib/clean/calendar/client";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import {
  CONTROLLED_LEARNING_AREAS,
  findBreakForDate,
  formatCalendarTimeRange,
  resolveLearningAreaControl,
  resolveStoredLearningArea,
  validateCalendarTimeMode,
  type CalendarTimeMode,
  type ControlledLearningArea,
} from "@/lib/clean/calendar/planningIntegrity";
import {
  canAddBreakOrHoliday,
  validateLearningPeriodDates,
  validateLearningYearDateChange,
  validateLearningYearDates,
} from "@/lib/clean/calendar/setupConstraints";
import {
  applyCleanGeneratedWeek,
  buildCleanGeneratedWeekPreview,
  listCleanGenerationRuns,
} from "@/lib/clean/generation/client";
import type {
  CleanGeneratedWeekSuggestion,
  CleanGenerationRun,
} from "@/lib/clean/generation/types";
import { PAGE_INTRO_VIDEOS } from "@/lib/clean/pageIntroVideos";
import { normalizeCleanErrorMessage } from "@/lib/clean/family/client";
import { listCleanEvidenceEntries } from "@/lib/clean/evidence/client";
import {
  buildCleanPlanningCacheKey,
  clearCleanPlanningCacheForFamily,
  getOrCreateCleanPlanningCalendarItemsRequest,
  readCleanPlanningCalendarItems,
  writeCleanPlanningCalendarItems,
} from "@/lib/clean/planning/cache";
import {
  listCleanProgramSegments,
  listCleanPrograms,
} from "@/lib/clean/programs/client";
import type {
  CleanProgram,
  CleanProgramSegment,
} from "@/lib/clean/programs/types";
import {
  createCleanMasterTemplate,
  createCleanTemplateBlock,
  deleteCleanTemplateBlock,
  listCleanMasterTemplates,
  listCleanTemplateBlocks,
  updateCleanTemplateBlock,
} from "@/lib/clean/templates/client";
import type {
  CleanMasterTemplate,
  CleanTemplateBlock,
} from "@/lib/clean/templates/types";
import {
  createCleanAcademicYear,
  deleteCleanAcademicYear,
  createCleanLearningPeriod,
  deleteCleanLearningPeriod,
  listCleanAcademicYears,
  listCleanBlackoutDays,
  listCleanLearningPeriods,
  updateCleanAcademicYear,
  updateCleanLearningPeriod,
} from "@/lib/clean/terms/client";
import type {
  CleanAcademicYear,
  CleanAcademicYearUpdate,
  CleanBlackoutDay,
  CleanLearningPeriod,
  CleanLearningPeriodType,
} from "@/lib/clean/terms/types";
import {
  getBreakPeriods,
  getPeriodForDate,
  getTeachingPeriods,
  isBreakLearningPeriod,
} from "@/lib/clean/setup/setupStatus";
import {
  buildCleanWeeklyPlannerEntriesFromCalendarItems,
  buildCleanWeeklyPlannerEntriesFromTemplateBlocks,
  buildCleanDailyPlannerPdfFilename,
  buildCleanMonthlyPlannerPdfFilename,
  buildCleanWeeklyPlannerPdfFilename,
  generateCleanDailyPlannerPdfBytes,
  generateCleanMonthlyPlannerPdfBytes,
  generateCleanWeeklyPlannerPdfBytes,
} from "@/lib/clean/outputs/weeklyPlanner";
import {
  getSignupCountryLabel,
  getSignupJurisdictionLabel,
} from "@/lib/signupPrefill";
import {
  trackCoreJourneyEvent,
  trackProductEvent,
} from "@/lib/clean/analytics/productAnalytics";
import { requestCoachStateRefresh } from "@/lib/clean/coach/coachRefresh";
import {
  beginCleanPlanningTiming,
  recordCleanPlanningMilestone,
} from "@/lib/clean/performance/planningTiming";

type PendingCalendarDelete =
  | { type: "academic-year"; year: CleanAcademicYear }
  | { type: "calendar-item"; item: CleanCalendarItem }
  | { type: "learning-period"; period: CleanLearningPeriod }
  | { type: "template-block"; block: CleanTemplateBlock };

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "clamp(14px, 3vw, 24px) clamp(10px, 3vw, 18px) 40px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  display: "grid",
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#ffffff",
  padding: 18,
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
};

const subCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  background: "#f8fafc",
  padding: 14,
  display: "grid",
  gap: 12,
};

const helperCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 14,
  background: "#f8fbff",
  padding: 14,
  display: "grid",
  gap: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  background: "#ffffff",
};

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 100,
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

const mutedButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#ffffff",
  color: "#0f172a",
};

const dangerButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#fff5f5",
  borderColor: "#fecaca",
  color: "#b91c1c",
};

const secondaryTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.6,
};

const CALENDAR_VIEW_STATE_KEY_PREFIX = "mylearna.calendar.viewState";

function getCalendarViewStateKey(familyId?: string | null) {
  return familyId ? `${CALENDAR_VIEW_STATE_KEY_PREFIX}.${familyId}` : CALENDAR_VIEW_STATE_KEY_PREFIX;
}

const subtleFieldCardStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  background: "#ffffff",
  padding: 12,
  display: "grid",
  gap: 8,
};

function getInteractiveZoneStyle(isActive: boolean): React.CSSProperties {
  return {
    width: "100%",
    border: `1px ${isActive ? "solid" : "dashed"} ${isActive ? "#60a5fa" : "#93c5fd"}`,
    borderRadius: 14,
    background: isActive ? "#eff6ff" : "#f8fbff",
    padding: "16px 14px",
    display: "grid",
    gap: 4,
    textAlign: "left",
    cursor: "pointer",
    transition: "border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease",
    boxShadow: isActive ? "0 0 0 3px rgba(59,130,246,0.14)" : "none",
  };
}

function getClickableCardStyle(isActive: boolean): React.CSSProperties {
  return {
    border: `1px solid ${isActive ? "#60a5fa" : "#dbeafe"}`,
    borderRadius: 14,
    background: isActive ? "#f8fbff" : "#ffffff",
    padding: 12,
    display: "grid",
    gap: 6,
    cursor: "pointer",
    transition: "border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease",
    boxShadow: isActive ? "0 0 0 3px rgba(59,130,246,0.14)" : "none",
  };
}

const PERIOD_TYPES: CleanLearningPeriodType[] = [
  "term",
  "semester",
  "unit",
  "break",
  "custom",
];

const WEEKDAY_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

type PickerOption = {
  value: string;
  label: string;
};

type PlanningView = "master" | "week";
type CalendarBoardView = "week" | "month";
type MasterWeekView = "school" | "full";
type LiveWeekView = "school" | "full";
type LearningPeriodComposerMode = "term" | "break";

function getTodayDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDays(dateValue: string, dayOffset: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  date.setDate(date.getDate() + dayOffset);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function clampDate(value: string, minimum: string, maximum: string) {
  if (value < minimum) return minimum;
  if (value > maximum) return maximum;
  return value;
}

function getWeekStart(dateValue = getTodayDate()) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return getTodayDate();
  const weekday = date.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + diff);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getWeekDates(weekStartsOn: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStartsOn, index));
}

function getMonthStart(dateValue = getTodayDate()) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return getTodayDate().slice(0, 8) + "01";
  date.setDate(1);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addMonths(dateValue: string, monthOffset: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  date.setMonth(date.getMonth() + monthOffset, 1);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getMonthGridDates(monthStartsOn: string) {
  const gridStart = getWeekStart(monthStartsOn);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function doDateRangesOverlap(
  startsOn: string,
  endsOn: string,
  otherStartsOn: string,
  otherEndsOn: string,
) {
  return startsOn <= otherEndsOn && endsOn >= otherStartsOn;
}

function dateRangeContains(
  outerStartsOn: string,
  outerEndsOn: string,
  innerStartsOn: string,
  innerEndsOn: string,
) {
  return innerStartsOn >= outerStartsOn && innerEndsOn <= outerEndsOn;
}

function dateRangeCoversWeek(
  startsOn: string,
  endsOn: string,
  weekStartsOn: string,
  weekEndsOn: string,
) {
  return startsOn <= weekStartsOn && endsOn >= weekEndsOn;
}

function getLearningYearNameSuggestion(startsOn: string, endsOn: string) {
  const startYear = new Date(`${startsOn}T00:00:00`).getFullYear();
  const endYear = new Date(`${endsOn}T00:00:00`).getFullYear();

  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
    return "2026-2027 Learning Year";
  }

  if (startYear === endYear) return `${startYear} Learning Year`;
  return `${startYear}-${endYear} Learning Year`;
}

function getLearnerLabel(firstName: string, preferredName: string | null) {
  return preferredName || firstName;
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatLongDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatDayMonthLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
  });
}

function formatWeekdayLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "long",
  });
}

function formatWeekRangeLabel(startsOn: string, endsOn: string) {
  return `${formatDateLabel(startsOn)} to ${formatDateLabel(endsOn)}`;
}

function formatMonthLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function downloadPdf(bytes: Uint8Array, filename: string) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const blob = new Blob([buffer], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

function formatPeriodTypeLabel(periodType: CleanLearningPeriodType, isBreak: boolean) {
  if (isBreak || periodType === "break") return "Break / holiday";

  switch (periodType) {
    case "semester":
      return "Semester";
    case "unit":
      return "Unit block";
    case "custom":
      return "Custom block";
    default:
      return "Learning term";
  }
}

function getSourceLabel(sourceType: string | null) {
  if (sourceType === "generated") return "Added from master week";
  if (sourceType === "template") return "From master week";
  return "Added";
}

function getSnapshotStatusLabel(status: string) {
  if (status === "recorded" || status === "applied") return "Saved snapshot";
  if (status === "preview") return "Preview only";
  if (status === "cancelled") return "Cancelled";
  return status;
}

function toTimestampFromDateAndTime(dateValue: string, timeValue: string) {
  const time = String(timeValue ?? "").trim();
  if (!time) return null;
  const localDate = new Date(`${dateValue}T${time}:00`);
  if (Number.isNaN(localDate.getTime())) return null;
  return localDate.toISOString();
}

function toTimeFieldValue(timestamp: string | null) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function safeTimeString(value: string) {
  const time = String(value ?? "").trim();
  return time.length >= 5 ? time.slice(0, 5) : time;
}

function isPlanningView(value: string | null): value is PlanningView {
  return value === "master" || value === "week";
}

function CleanRhythmBlockPopover({
  open,
  mode,
  weekdayLabel,
  title,
  learningArea,
  learningAreaCustom,
  learnerId,
  timeMode,
  startTime,
  endTime,
  programId,
  programSegmentId,
  sessionLabel,
  notes,
  learnerOptions,
  programOptions,
  segmentOptions,
  onChangeTitle,
  onChangeLearningArea,
  onChangeLearningAreaCustom,
  onChangeLearnerId,
  onChangeTimeMode,
  onChangeStartTime,
  onChangeEndTime,
  onChangeProgramId,
  onChangeProgramSegmentId,
  onChangeSessionLabel,
  onChangeNotes,
  onClose,
  onDelete,
  onSave,
  saving,
}: {
  open: boolean;
  mode: "create" | "edit";
  weekdayLabel: string;
  title: string;
  learningArea: string;
  learningAreaCustom: string;
  learnerId: string;
  timeMode: CalendarTimeMode;
  startTime: string;
  endTime: string;
  programId: string;
  programSegmentId: string;
  sessionLabel: string;
  notes: string;
  learnerOptions: PickerOption[];
  programOptions: PickerOption[];
  segmentOptions: PickerOption[];
  onChangeTitle: (value: string) => void;
  onChangeLearningArea: (value: string) => void;
  onChangeLearningAreaCustom: (value: string) => void;
  onChangeLearnerId: (value: string) => void;
  onChangeTimeMode: (value: CalendarTimeMode) => void;
  onChangeStartTime: (value: string) => void;
  onChangeEndTime: (value: string) => void;
  onChangeProgramId: (value: string) => void;
  onChangeProgramSegmentId: (value: string) => void;
  onChangeSessionLabel: (value: string) => void;
  onChangeNotes: (value: string) => void;
  onClose: () => void;
  onDelete?: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.24)",
        display: "grid",
        placeItems: "center",
        padding: 20,
        zIndex: 60,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(620px, 100%)",
          border: "1px solid #cbd5e1",
          borderRadius: 18,
          background: "#ffffff",
          padding: 20,
          display: "grid",
          gap: 16,
          boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
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
            Master week
          </div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>
            {mode === "edit" ? "Edit master block" : "Add master block"}
          </h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
            {weekdayLabel}
          </p>
        </div>

        <label
          style={{
            display: "grid",
            gap: 6,
            color: "#334155",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          What usually happens here?
          <input
            autoFocus
            value={title}
            onChange={(event) => onChangeTitle(event.target.value)}
            placeholder="Morning maths, read-aloud, science walk"
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
          <label
            style={{
              display: "grid",
              gap: 6,
              color: "#334155",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
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

          <label
            style={{
              display: "grid",
              gap: 6,
              color: "#334155",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
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
            <label
              style={{
                display: "grid",
                gap: 6,
                color: "#334155",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
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
              name="master-block-time-mode"
              checked={timeMode === "untimed"}
              onChange={() => onChangeTimeMode("untimed")}
            />
            No specific time
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", color: "#334155" }}>
            <input
              type="radio"
              name="master-block-time-mode"
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
          <label
            style={{
              display: "grid",
              gap: 6,
              color: "#334155",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Start time
            <input
              type="time"
              value={startTime}
              onChange={(event) => onChangeStartTime(event.target.value)}
              style={inputStyle}
              disabled={timeMode === "untimed"}
            />
          </label>
          <label
            style={{
              display: "grid",
              gap: 6,
              color: "#334155",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            End time
            <input
              type="time"
              value={endTime}
              onChange={(event) => onChangeEndTime(event.target.value)}
              style={inputStyle}
              disabled={timeMode === "untimed"}
            />
          </label>
          <label
            style={{
              display: "grid",
              gap: 6,
              color: "#334155",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Session label
            <input
              value={sessionLabel}
              onChange={(event) => onChangeSessionLabel(event.target.value)}
              placeholder="Optional"
              style={inputStyle}
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
          <label
            style={{
              display: "grid",
              gap: 6,
              color: "#334155",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
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

          <label
            style={{
              display: "grid",
              gap: 6,
              color: "#334155",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
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

        <label
          style={{
            display: "grid",
            gap: 6,
            color: "#334155",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Notes
          <textarea
            value={notes}
            onChange={(event) => onChangeNotes(event.target.value)}
            placeholder="Anything you want to remember about this usual week"
            style={textAreaStyle}
          />
        </label>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" style={buttonStyle} onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : mode === "edit" ? "Save changes" : "Save block"}
          </button>
          <button
            type="button"
            style={mutedButtonStyle}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          {mode === "edit" && onDelete ? (
            <button
              type="button"
              style={dangerButtonStyle}
              onClick={onDelete}
              disabled={saving}
            >
              Delete block
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CleanCalendarWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const { user } = useAuthUser();
  const { enabled: guidanceEnabled, setupStatus, completeSetupStep } = useGuidance();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const capturePathBase = pathname.startsWith("/clean-my-calendar")
    ? "/clean-my-capture"
    : "/my-capture";

  const [academicYears, setAcademicYears] = useState<CleanAcademicYear[]>([]);
  const [learningPeriods, setLearningPeriods] = useState<CleanLearningPeriod[]>([]);
  const [blackoutDays, setBlackoutDays] = useState<CleanBlackoutDay[]>([]);
  const [masterTemplates, setMasterTemplates] = useState<CleanMasterTemplate[]>([]);
  const [templateBlocks, setTemplateBlocks] = useState<CleanTemplateBlock[]>([]);
  const [programs, setPrograms] = useState<CleanProgram[]>([]);
  const [programSegments, setProgramSegments] = useState<CleanProgramSegment[]>([]);
  const [generationRuns, setGenerationRuns] = useState<CleanGenerationRun[]>([]);
  const [items, setItems] = useState<CleanCalendarItem[]>([]);
  const [evidenceByCalendarItemId, setEvidenceByCalendarItemId] = useState<Map<string, string>>(new Map());

  const [setupLoading, setSetupLoading] = useState(true);
  const [templateBlocksLoading, setTemplateBlocksLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const calendarItemsRequestGenerationRef = useRef(0);
  const setupRequestGenerationRef = useRef(0);
  const calendarPrimaryMilestoneRef = useRef<string | null>(null);
  const calendarSettledMilestoneRef = useRef<string | null>(null);
  const popoverSubmitLockRef = useRef(false);
  const [completionUpdatingId, setCompletionUpdatingId] = useState<string | null>(null);

  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [selectedLearningPeriodId, setSelectedLearningPeriodId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedWeekStart, setSelectedWeekStart] = useState(getWeekStart());

  const [yearTitle, setYearTitle] = useState("");
  const [yearStartsOn, setYearStartsOn] = useState(getWeekStart());
  const [yearEndsOn, setYearEndsOn] = useState(addDays(getWeekStart(), 83));
  const [yearCountryCode, setYearCountryCode] = useState("");
  const [yearJurisdictionCode, setYearJurisdictionCode] = useState("");
  const [editingAcademicYearId, setEditingAcademicYearId] = useState<string | null>(null);
  const [pendingAcademicYearUpdate, setPendingAcademicYearUpdate] = useState<{
    id: string;
    input: CleanAcademicYearUpdate;
  } | null>(null);

  const [periodTitle, setPeriodTitle] = useState("");
  const [periodNotes, setPeriodNotes] = useState("");
  const [periodStartsOn, setPeriodStartsOn] = useState(getWeekStart());
  const [periodEndsOn, setPeriodEndsOn] = useState(addDays(getWeekStart(), 13));
  const [periodType, setPeriodType] = useState<CleanLearningPeriodType>("term");
  const [periodIsBreak, setPeriodIsBreak] = useState(false);
  const [learningPeriodComposerMode, setLearningPeriodComposerMode] =
    useState<LearningPeriodComposerMode>("term");
  const [editingLearningPeriodId, setEditingLearningPeriodId] = useState<string | null>(null);
  const [editingLearningPeriodTitle, setEditingLearningPeriodTitle] = useState("");
  const [editingLearningPeriodType, setEditingLearningPeriodType] =
    useState<CleanLearningPeriodType>("term");
  const [editingLearningPeriodStartsOn, setEditingLearningPeriodStartsOn] =
    useState(getWeekStart());
  const [editingLearningPeriodEndsOn, setEditingLearningPeriodEndsOn] = useState(
    addDays(getWeekStart(), 13),
  );
  const [editingLearningPeriodIsBreak, setEditingLearningPeriodIsBreak] = useState(false);
  const [editingLearningPeriodNotes, setEditingLearningPeriodNotes] = useState("");

  const [templateTitle, setTemplateTitle] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateScopeType, setTemplateScopeType] = useState<"family" | "learner">("family");
  const [templateLearnerId, setTemplateLearnerId] = useState("");

  const [editingTemplateBlockId, setEditingTemplateBlockId] = useState<string | null>(null);
  const [blockWeekday, setBlockWeekday] = useState("1");
  const [blockTitle, setBlockTitle] = useState("");
  const [blockLearningArea, setBlockLearningArea] = useState("");
  const [blockLearningAreaCustom, setBlockLearningAreaCustom] = useState("");
  const [blockLearnerId, setBlockLearnerId] = useState("");
  const [blockTimeMode, setBlockTimeMode] = useState<CalendarTimeMode>("untimed");
  const [blockStartTime, setBlockStartTime] = useState("");
  const [blockEndTime, setBlockEndTime] = useState("");
  const [blockProgramId, setBlockProgramId] = useState("");
  const [blockProgramSegmentId, setBlockProgramSegmentId] = useState("");
  const [blockSessionLabel, setBlockSessionLabel] = useState("");
  const [blockNotes, setBlockNotes] = useState("");

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [popoverDate, setPopoverDate] = useState(getTodayDate());
  const [popoverTitle, setPopoverTitle] = useState("");
  const [popoverLearnerId, setPopoverLearnerId] = useState("");
  const [popoverLearningArea, setPopoverLearningArea] = useState("");
  const [popoverLearningAreaCustom, setPopoverLearningAreaCustom] = useState("");
  const [popoverTimeMode, setPopoverTimeMode] = useState<CalendarTimeMode>("untimed");
  const [popoverStartTime, setPopoverStartTime] = useState("");
  const [popoverEndTime, setPopoverEndTime] = useState("");
  const [popoverDescription, setPopoverDescription] = useState("");
  const [popoverProgramId, setPopoverProgramId] = useState("");
  const [popoverProgramSegmentId, setPopoverProgramSegmentId] = useState("");

  const [planningView, setPlanningView] = useState<PlanningView>("week");
  const [calendarBoardView, setCalendarBoardView] = useState<CalendarBoardView>("week");
  const [showYearComposer, setShowYearComposer] = useState(false);
  const [showLearningPeriodComposer, setShowLearningPeriodComposer] = useState(false);
  const [showTemplateComposer, setShowTemplateComposer] = useState(false);
  const [rhythmPopoverOpen, setRhythmPopoverOpen] = useState(false);
  const [showMasterBlockHandoff, setShowMasterBlockHandoff] = useState(false);
  const [masterWeekView, setMasterWeekView] = useState<MasterWeekView>("school");
  const [masterWeekViewTouched, setMasterWeekViewTouched] = useState(false);
  const [liveWeekView, setLiveWeekView] = useState<LiveWeekView>("school");
  const [liveWeekViewTouched, setLiveWeekViewTouched] = useState(false);
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [learningPeriodsOpen, setLearningPeriodsOpen] = useState(false);
  const [calendarViewStateHydrated, setCalendarViewStateHydrated] = useState(false);

  const [previewSuggestions, setPreviewSuggestions] = useState<CleanGeneratedWeekSuggestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [plannerDownloading, setPlannerDownloading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingCalendarDelete | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeSurfaceId, setActiveSurfaceId] = useState<string | null>(null);

  const handoffView = searchParams.get("view");
  const handoffProgramId = searchParams.get("programId");
  const handoffSegmentId = searchParams.get("segmentId");

  const learnerOptions = useMemo(
    () =>
      workspace.learners.map((learner) => ({
        value: learner.id,
        label: getLearnerLabel(learner.firstName, learner.preferredName),
      })),
    [workspace.learners],
  );

  const programOptions = useMemo(
    () =>
      programs.map((program) => ({
        value: program.id,
        label: program.title,
      })),
    [programs],
  );
  const learnerLabelById = useMemo(
    () => new Map(learnerOptions.map((option) => [option.value, option.label])),
    [learnerOptions],
  );
  const programLabelById = useMemo(
    () => new Map(programOptions.map((option) => [option.value, option.label])),
    [programOptions],
  );
  const segmentLabelById = useMemo(
    () => new Map(programSegments.map((segment) => [segment.id, segment.title])),
    [programSegments],
  );

  const selectedAcademicYear = useMemo(
    () => academicYears.find((year) => year.id === selectedAcademicYearId) ?? null,
    [academicYears, selectedAcademicYearId],
  );

  const selectedTemplate = useMemo(
    () => masterTemplates.find((template) => template.id === selectedTemplateId) ?? null,
    [masterTemplates, selectedTemplateId],
  );

  const selectedLearningPeriod = useMemo(
    () => learningPeriods.find((period) => period.id === selectedLearningPeriodId) ?? null,
    [learningPeriods, selectedLearningPeriodId],
  );
  const editingLearningPeriod = useMemo(
    () => learningPeriods.find((period) => period.id === editingLearningPeriodId) ?? null,
    [editingLearningPeriodId, learningPeriods],
  );
  const editingAcademicYear = useMemo(
    () =>
      editingLearningPeriod
        ? academicYears.find((year) => year.id === editingLearningPeriod.academicYearId) ?? null
        : null,
    [academicYears, editingLearningPeriod],
  );
  const editingTemplateBlock = useMemo(
    () => templateBlocks.find((block) => block.id === editingTemplateBlockId) ?? null,
    [editingTemplateBlockId, templateBlocks],
  );

  const selectedWeekEnd = useMemo(() => addDays(selectedWeekStart, 6), [selectedWeekStart]);
  const weekDates = useMemo(() => getWeekDates(selectedWeekStart), [selectedWeekStart]);
  const selectedMonthStart = useMemo(
    () => getMonthStart(selectedWeekStart),
    [selectedWeekStart],
  );
  const monthGridDates = useMemo(
    () => getMonthGridDates(selectedMonthStart),
    [selectedMonthStart],
  );
  const selectedCalendarStart = calendarBoardView === "month" ? monthGridDates[0] : selectedWeekStart;
  const selectedCalendarEnd =
    calendarBoardView === "month" ? monthGridDates[monthGridDates.length - 1] : selectedWeekEnd;
  const selectedBreakOverlapsWeek = useMemo(
    () =>
      !!selectedLearningPeriod &&
      (selectedLearningPeriod.isBreak || selectedLearningPeriod.periodType === "break") &&
      doDateRangesOverlap(
        selectedLearningPeriod.startsOn,
        selectedLearningPeriod.endsOn,
        selectedWeekStart,
        selectedWeekEnd,
      ),
    [selectedLearningPeriod, selectedWeekEnd, selectedWeekStart],
  );

  const itemsByDate = useMemo(() => {
    const grouped = new Map<string, CleanCalendarItem[]>();

    for (const item of items) {
      const existing = grouped.get(item.plannedDate) ?? [];
      existing.push(item);
      grouped.set(item.plannedDate, existing);
    }

    return grouped;
  }, [items]);

  const visibleLearningPeriods = useMemo(() => {
    if (!selectedAcademicYearId) return learningPeriods;
    return learningPeriods.filter((period) => period.academicYearId === selectedAcademicYearId);
  }, [learningPeriods, selectedAcademicYearId]);

  const learningTermsForSelectedYear = useMemo(
    () => getTeachingPeriods(visibleLearningPeriods),
    [visibleLearningPeriods],
  );
  const breakPeriodsForSelectedYear = useMemo(
    () => getBreakPeriods(visibleLearningPeriods),
    [visibleLearningPeriods],
  );
  const hasLearningYear = academicYears.length > 0;
  const hasRealLearningPeriod = learningTermsForSelectedYear.length > 0;
  const planningSetupPeriodCount = learningTermsForSelectedYear.length;
  const planningSetupBreakCount = breakPeriodsForSelectedYear.length;
  const hasExistingPlanningSetup = hasLearningYear && hasRealLearningPeriod;
  const hasMasterWeekBlock = templateBlocks.length > 0;
  const masterWeekStartedEnough = hasMasterWeekBlock;
  const calendarSetupReady = hasRealLearningPeriod && masterWeekStartedEnough;
  const calendarSetupTask = !hasLearningYear
    ? "Set your learning year"
    : !hasRealLearningPeriod
      ? "Add your first learning period"
      : !masterWeekStartedEnough
        ? "Add your first weekly learning block"
        : "Continue to My Day";
  const calendarHandoffState = !hasLearningYear
    ? "year"
    : !hasRealLearningPeriod
      ? breakPeriodsForSelectedYear.length
        ? "period-after-break"
        : "period"
      : !masterWeekStartedEnough
        ? "master-week"
        : "ready";
  const shouldShowLearningPeriodsManagement =
    learningPeriodsOpen || !hasExistingPlanningSetup;
  const activeLearningPeriod = useMemo(() => {
    const today = getTodayDate();
    return getPeriodForDate(learningTermsForSelectedYear, today);
  }, [learningTermsForSelectedYear]);
  const currentBreakPeriod = useMemo(
    () => getPeriodForDate(breakPeriodsForSelectedYear, getTodayDate()),
    [breakPeriodsForSelectedYear],
  );
  const learningPeriodsSummary = useMemo(() => {
    if (!hasLearningYear) return "Set up your learning year to organise your calendar.";
    if (!hasExistingPlanningSetup && !planningSetupBreakCount) {
      return "Set up your first learning period to start planning.";
    }

    const summaryParts = [
      selectedAcademicYear?.title ?? "Learning year set",
      activeLearningPeriod?.title ? `Active period: ${activeLearningPeriod.title}` : null,
      !activeLearningPeriod && currentBreakPeriod?.title
        ? `Currently on break: ${currentBreakPeriod.title}`
        : null,
      !activeLearningPeriod && !currentBreakPeriod ? "No active learning period" : null,
      `${planningSetupPeriodCount} learning period${planningSetupPeriodCount === 1 ? "" : "s"} set`,
      `${planningSetupBreakCount} break${planningSetupBreakCount === 1 ? "" : "s"} added`,
    ].filter(Boolean);

    return `${summaryParts.join(" - ")}.`;
  }, [
    activeLearningPeriod,
    currentBreakPeriod,
    hasExistingPlanningSetup,
    hasLearningYear,
    planningSetupBreakCount,
    planningSetupPeriodCount,
    selectedAcademicYear?.title,
  ]);

  const selectedWeekInsideLearningYear = useMemo(
    () =>
      selectedAcademicYear
        ? dateRangeCoversWeek(
            selectedAcademicYear.startsOn,
            selectedAcademicYear.endsOn,
            selectedWeekStart,
            selectedWeekEnd,
          )
        : false,
    [selectedAcademicYear, selectedWeekEnd, selectedWeekStart],
  );

  const weeklySelectableLearningPeriods = useMemo(
    () =>
      learningTermsForSelectedYear.filter((period) =>
        dateRangeCoversWeek(period.startsOn, period.endsOn, selectedWeekStart, selectedWeekEnd),
      ),
    [learningTermsForSelectedYear, selectedWeekEnd, selectedWeekStart],
  );

  const selectedWeekBreak = useMemo(
    () =>
      visibleLearningPeriods.find(
        (period) =>
          isBreakLearningPeriod(period) &&
          doDateRangesOverlap(
            period.startsOn,
            period.endsOn,
            selectedWeekStart,
            selectedWeekEnd,
          ),
      ) ?? null,
    [selectedWeekEnd, selectedWeekStart, visibleLearningPeriods],
  );

  const selectedWeekPlanningMessage = useMemo(() => {
    if (!selectedAcademicYear) return "Add a learning year before planning weeks.";
    if (!selectedWeekInsideLearningYear) {
      return "This week sits outside your learning year. Choose a week inside your learning year or adjust your learning year dates.";
    }
    if (selectedWeekBreak) {
      return "This week is marked as a break / holiday. Regular planning is paused.";
    }
    if (!weeklySelectableLearningPeriods.length) {
      return "No learning period covers this week yet. Add a term or choose a week inside an existing term.";
    }
    return "";
  }, [
    selectedAcademicYear,
    selectedWeekBreak,
    selectedWeekInsideLearningYear,
    weeklySelectableLearningPeriods.length,
  ]);

  const visibleComposerPeriodTypes = useMemo(
    () => PERIOD_TYPES.filter((option) => option !== "break"),
    [],
  );

  const templateBlocksByWeekday = useMemo(() => {
    const grouped = new Map<number, CleanTemplateBlock[]>();

    for (const block of templateBlocks) {
      const existing = grouped.get(block.weekday) ?? [];
      existing.push(block);
      grouped.set(block.weekday, existing);
    }

    return grouped;
  }, [templateBlocks]);

  const hasWeekendTemplateBlocks = useMemo(
    () => templateBlocks.some((block) => block.weekday === 6 || block.weekday === 7),
    [templateBlocks],
  );

  const visibleMasterDays = useMemo(
    () =>
      masterWeekView === "school"
        ? WEEKDAY_OPTIONS.filter((day) => day.value <= 5)
        : WEEKDAY_OPTIONS,
    [masterWeekView],
  );

  const hasWeekendLiveItems = useMemo(
    () =>
      weekDates
        .slice(5)
        .some((dateValue) => (itemsByDate.get(dateValue) ?? []).length > 0),
    [itemsByDate, weekDates],
  );

  const visibleWeekDates = useMemo(
    () => (liveWeekView === "school" ? weekDates.slice(0, 5) : weekDates),
    [liveWeekView, weekDates],
  );
  const calendarBoardDates = calendarBoardView === "week" ? visibleWeekDates : monthGridDates;
  const calendarBoardLabel =
    calendarBoardView === "week"
      ? formatWeekRangeLabel(selectedWeekStart, selectedWeekEnd)
      : formatMonthLabel(selectedMonthStart);

  const visibleBlockSegments = useMemo(() => {
    if (!blockProgramId) return [];

    return programSegments
      .filter((segment) => segment.programId === blockProgramId)
      .map((segment) => ({
        value: segment.id,
        label: segment.title,
      }));
  }, [blockProgramId, programSegments]);

  const visiblePopoverSegments = useMemo(() => {
    if (!popoverProgramId) return [];

    return programSegments
      .filter((segment) => segment.programId === popoverProgramId)
      .map((segment) => ({
        value: segment.id,
        label: segment.title,
      }));
  }, [popoverProgramId, programSegments]);

  const handoffProgram = useMemo(() => {
    if (!handoffProgramId) return null;
    return programs.find((program) => program.id === handoffProgramId) ?? null;
  }, [handoffProgramId, programs]);

  const handoffSegment = useMemo(() => {
    if (!handoffSegmentId) return null;
    return programSegments.find((segment) => segment.id === handoffSegmentId) ?? null;
  }, [handoffSegmentId, programSegments]);

  const activeHandoffProgram = handoffProgram ?? (
    handoffSegment
      ? programs.find((program) => program.id === handoffSegment.programId) ?? null
      : null
  );

  const handoffDefaults = useMemo(
    () => ({
      title: handoffSegment?.title || activeHandoffProgram?.title || "",
      learnerId: handoffSegment?.learnerId ?? activeHandoffProgram?.learnerId ?? "",
      learningArea: activeHandoffProgram?.learningArea ?? "",
      notes: handoffSegment?.notes || activeHandoffProgram?.description || "",
      programId: activeHandoffProgram?.id ?? "",
      segmentId: handoffSegment?.id ?? "",
    }),
    [activeHandoffProgram, handoffSegment],
  );

  const hasCalendarHandoff =
    Boolean(activeHandoffProgram) || Boolean(handoffSegment);

  const handoffSummary = useMemo(() => {
    if (!hasCalendarHandoff) return null;

    if (activeHandoffProgram && handoffSegment) {
      return `${activeHandoffProgram.title} - ${handoffSegment.title}`;
    }

    return activeHandoffProgram?.title ?? handoffSegment?.title ?? null;
  }, [activeHandoffProgram, handoffSegment, hasCalendarHandoff]);

  const generationSummary = useMemo(() => {
    let readyToAdd = 0;
    let alreadyPlanned = 0;
    let skipped = 0;

    const existingKeys = new Set(
      items
        .map((item) =>
          item.sourceTemplateBlockId
            ? `${item.plannedDate}::${item.sourceTemplateBlockId}`
            : "",
        )
        .filter(Boolean),
    );

    for (const item of previewSuggestions) {
      if (item.skippedReason) {
        skipped += 1;
        continue;
      }

      const duplicateKey = item.sourceTemplateBlockId
        ? `${item.plannedDate}::${item.sourceTemplateBlockId}`
        : "";

      if (duplicateKey !== "" && existingKeys.has(duplicateKey)) {
        alreadyPlanned += 1;
      } else {
        readyToAdd += 1;
      }
    }

    return { readyToAdd, alreadyPlanned, skipped };
  }, [items, previewSuggestions]);

  const previewRows = useMemo(() => {
    const learnerLabelById = new Map(learnerOptions.map((option) => [option.value, option.label]));
    const programLabelById = new Map(programOptions.map((option) => [option.value, option.label]));
    const segmentLabelById = new Map(
      programSegments.map((segment) => [segment.id, segment.title]),
    );
    const existingKeys = new Set(
      items
        .map((item) =>
          item.sourceTemplateBlockId
            ? `${item.plannedDate}::${item.sourceTemplateBlockId}`
            : "",
        )
        .filter(Boolean),
    );

    return previewSuggestions.map((item, index) => {
      const duplicateKey = item.sourceTemplateBlockId
        ? `${item.plannedDate}::${item.sourceTemplateBlockId}`
        : "";
      const alreadyPlanned =
        !item.skippedReason &&
        duplicateKey !== "" &&
        existingKeys.has(duplicateKey);

      return {
        ...item,
        previewKey: `${item.plannedDate}-${item.title}-${index}`,
        weekdayLabel: formatWeekdayLabel(item.plannedDate),
        learnerLabel: item.learnerId
          ? learnerLabelById.get(item.learnerId) ?? "Learner"
          : "Whole family",
        programLabel: item.programId ? programLabelById.get(item.programId) ?? null : null,
        segmentLabel: item.programSegmentId
          ? segmentLabelById.get(item.programSegmentId) ?? null
          : null,
        statusLabel: item.skippedReason
          ? item.skippedReason.includes("marked as a break")
            ? "Not added — break week"
            : item.skippedReason.includes("blocks learning")
              ? "Not added — blocked day"
              : item.skippedReason.includes("falls outside")
                ? "Not added — outside this term"
                : "Not added"
          : alreadyPlanned
            ? "Already planned"
            : "Ready to add",
        statusReason: item.skippedReason,
        canApply: !item.skippedReason && !alreadyPlanned,
      };
    });
  }, [items, learnerOptions, previewSuggestions, programOptions, programSegments]);

  const previewRowsByDate = useMemo(() => {
    const grouped = new Map<string, typeof previewRows>();

    for (const item of previewRows) {
      const existing = grouped.get(item.plannedDate) ?? [];
      existing.push(item);
      grouped.set(item.plannedDate, existing);
    }

    return grouped;
  }, [previewRows]);

  const hasWeekendPreviewItems = useMemo(
    () =>
      weekDates
        .slice(5)
        .some((dateValue) => (previewRowsByDate.get(dateValue) ?? []).length > 0),
    [previewRowsByDate, weekDates],
  );

  const hasHiddenWeekendWeekContent =
    liveWeekView === "school" && (hasWeekendLiveItems || hasWeekendPreviewItems);

  const shouldShowYearComposer =
    showYearComposer || !academicYears.length || Boolean(editingAcademicYearId);
  const shouldShowLearningPeriodComposer =
    showLearningPeriodComposer || !learningTermsForSelectedYear.length;
  const shouldShowTemplateComposer = showTemplateComposer || !masterTemplates.length;

  const readyForCalendar =
    !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;
  const calendarPrimaryKey = workspace.profile
    ? `${workspace.currentUserId}:${workspace.profile.id}:${selectedWeekStart}:${calendarBoardView}`
    : null;

  useEffect(() => {
    if (!readyForCalendar || !workspace.profile || !calendarPrimaryKey) return;
    if (calendarPrimaryMilestoneRef.current === calendarPrimaryKey) return;
    calendarPrimaryMilestoneRef.current = calendarPrimaryKey;
    recordCleanPlanningMilestone({
      operation: "calendar-primary-content",
      criticality: "page-primary",
      gatesPage: false,
    });
  }, [calendarPrimaryKey, readyForCalendar, workspace.profile]);

  useEffect(() => {
    if (!user?.id) return;
    recordCleanPlanningMilestone({
      operation: "calendar-route-mounted",
      criticality: "page-primary",
      gatesPage: false,
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !calendarPrimaryKey || setupLoading || itemsLoading || templateBlocksLoading) {
      return;
    }
    if (calendarSettledMilestoneRef.current === calendarPrimaryKey) return;
    calendarSettledMilestoneRef.current = calendarPrimaryKey;
    recordCleanPlanningMilestone({
      operation: "calendar-fully-settled",
      criticality: "page-primary",
      gatesPage: false,
    });
  }, [calendarPrimaryKey, itemsLoading, setupLoading, templateBlocksLoading, user?.id]);

  const reloadSetupData = useCallback(async () => {
    if (!workspace.profile) return;

    const requestGeneration = ++setupRequestGenerationRef.current;
    const setupTiming = beginCleanPlanningTiming({
      operation: "calendar-planning-setup",
      criticality: "section-secondary",
      gatesPage: false,
      requestKey: `calendar-planning-setup:${workspace.currentUserId}:${workspace.profile.id}`,
    });
    setSetupLoading(true);
    setSetupError(null);

    try {
      const [
        nextAcademicYears,
        nextLearningPeriods,
        nextBlackoutDays,
        nextMasterTemplates,
        nextPrograms,
        nextGenerationRuns,
      ] = await Promise.all([
        listCleanAcademicYears(workspace.profile.id, { limit: 20 }),
        listCleanLearningPeriods(workspace.profile.id, { limit: 50 }),
        listCleanBlackoutDays(workspace.profile.id, { limit: 50 }),
        listCleanMasterTemplates(workspace.profile.id, { limit: 20 }),
        listCleanPrograms(workspace.profile.id, { limit: 50 }),
        listCleanGenerationRuns(workspace.profile.id, { limit: 20 }),
      ]);

      const segmentGroups = await Promise.all(
        nextPrograms.map((program) =>
          listCleanProgramSegments(workspace.profile!.id, program.id),
        ),
      );

      if (requestGeneration !== setupRequestGenerationRef.current) {
        setupTiming("cancelled");
        return;
      }

      setAcademicYears(nextAcademicYears);
      setLearningPeriods(nextLearningPeriods);
      setBlackoutDays(nextBlackoutDays);
      setMasterTemplates(nextMasterTemplates);
      setPrograms(nextPrograms);
      setProgramSegments(segmentGroups.flat());
      setGenerationRuns(nextGenerationRuns);

      setSelectedAcademicYearId((current) =>
        current && nextAcademicYears.some((year) => year.id === current)
          ? current
          : nextAcademicYears[0]?.id ?? "",
      );

      setSelectedTemplateId((current) =>
        current && nextMasterTemplates.some((template) => template.id === current)
          ? current
          : nextMasterTemplates[0]?.id ?? "",
      );
      setupTiming("success");
    } catch (error) {
      setupTiming("error");
      if (requestGeneration === setupRequestGenerationRef.current) {
        setSetupError(
          normalizeCleanErrorMessage(
            error,
            "We could not load your planning setup just now.",
          ),
        );
      }
    } finally {
      if (requestGeneration === setupRequestGenerationRef.current) {
        setSetupLoading(false);
      }
    }
  }, [workspace.currentUserId, workspace.profile]);

  const reloadTemplateBlocks = useCallback(async () => {
    if (!workspace.profile || !selectedTemplateId) {
      setTemplateBlocks([]);
      return;
    }

    setTemplateBlocksLoading(true);
    setSetupError(null);

    try {
      const nextTemplateBlocks = await listCleanTemplateBlocks(
        workspace.profile.id,
        selectedTemplateId,
      );
      setTemplateBlocks(nextTemplateBlocks);
    } catch (error) {
      setSetupError(
        normalizeCleanErrorMessage(
          error,
          "We could not load this master week just now.",
        ),
      );
    } finally {
      setTemplateBlocksLoading(false);
    }
  }, [selectedTemplateId, workspace.profile]);

  const reloadCalendarItems = useCallback(async () => {
    if (!workspace.profile) return;

    const requestGeneration = ++calendarItemsRequestGenerationRef.current;
    const cacheKey = buildCleanPlanningCacheKey({
      userId: workspace.currentUserId,
      familyId: workspace.profile.id,
      route: "calendar",
      fromDate: selectedCalendarStart,
      toDate: selectedCalendarEnd,
      view: calendarBoardView,
    });
    const cachedItems = readCleanPlanningCalendarItems(cacheKey);
    const itemsTiming = beginCleanPlanningTiming({
      operation: "calendar-visible-activities",
      criticality: "page-primary",
      gatesPage: false,
      requestKey: `calendar-visible-activities:${workspace.currentUserId}:${workspace.profile.id}:${selectedCalendarStart}:${selectedCalendarEnd}`,
    });
    setItems(cachedItems ?? []);
    setItemsLoading(!cachedItems);
    setItemsError(null);

    try {
      const nextItems = await getOrCreateCleanPlanningCalendarItemsRequest(
        cacheKey,
        () =>
          listCleanCalendarItems(workspace.profile!.id, {
            fromDate: selectedCalendarStart,
            toDate: selectedCalendarEnd,
            limit: calendarBoardView === "month" ? 240 : 100,
          }),
      );
      if (requestGeneration !== calendarItemsRequestGenerationRef.current) {
        itemsTiming("cancelled");
        return;
      }
      itemsTiming("success");
      writeCleanPlanningCalendarItems(cacheKey, nextItems);
      setItems(nextItems);
    } catch (error) {
      itemsTiming("error");
      if (requestGeneration === calendarItemsRequestGenerationRef.current) {
        setItemsError(
          normalizeCleanErrorMessage(
            error,
            "We could not load these calendar blocks just now.",
          ),
        );
      }
    } finally {
      if (requestGeneration === calendarItemsRequestGenerationRef.current) {
        setItemsLoading(false);
      }
    }
  }, [
    calendarBoardView,
    workspace.currentUserId,
    selectedCalendarEnd,
    selectedCalendarStart,
    workspace.profile,
  ]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      calendarItemsRequestGenerationRef.current += 1;
      setupRequestGenerationRef.current += 1;
      setAcademicYears([]);
      setLearningPeriods([]);
      setBlackoutDays([]);
      setMasterTemplates([]);
      setTemplateBlocks([]);
      setPrograms([]);
      setProgramSegments([]);
      setGenerationRuns([]);
      setItems([]);
      setItemsLoading(false);
      setItemsError(null);
      setLearningPeriodsOpen(false);
      return;
    }

    void reloadSetupData();
  }, [
    reloadSetupData,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  useEffect(() => {
    if (!workspace.profile) return;
    const savedCountryCode = String(workspace.profile.countryCode ?? "").trim();
    const savedJurisdictionCode = String(workspace.profile.jurisdictionCode ?? "").trim();

    if (savedCountryCode && !yearCountryCode) {
      setYearCountryCode(savedCountryCode);
    }
    if (savedJurisdictionCode && !yearJurisdictionCode) {
      setYearJurisdictionCode(savedJurisdictionCode);
    }
  }, [
    workspace.profile,
    yearCountryCode,
    yearJurisdictionCode,
  ]);

  useEffect(() => {
    if (!workspace.profile || typeof window === "undefined") {
      setCalendarViewStateHydrated(false);
      return;
    }

    try {
      const rawState = window.localStorage.getItem(getCalendarViewStateKey(workspace.profile.id));
      const parsed = rawState ? (JSON.parse(rawState) as Record<string, unknown>) : null;
      const nextWeekStart =
        typeof parsed?.selectedWeekStart === "string"
          ? getWeekStart(parsed.selectedWeekStart)
          : null;
      const nextBoardView =
        parsed?.calendarBoardView === "month" || parsed?.calendarBoardView === "week"
          ? parsed.calendarBoardView
          : null;
      const nextLiveView =
        parsed?.liveWeekView === "full" || parsed?.liveWeekView === "school"
          ? parsed.liveWeekView
          : null;

      if (nextWeekStart) setSelectedWeekStart(nextWeekStart);
      if (nextBoardView) setCalendarBoardView(nextBoardView);
      if (nextLiveView) {
        setLiveWeekView(nextLiveView);
        setLiveWeekViewTouched(true);
      }
    } catch {
      window.localStorage.removeItem(getCalendarViewStateKey(workspace.profile.id));
    } finally {
      setCalendarViewStateHydrated(true);
    }
  }, [workspace.profile]);

  useEffect(() => {
    if (!workspace.profile || !calendarViewStateHydrated || typeof window === "undefined") return;

    window.localStorage.setItem(
      getCalendarViewStateKey(workspace.profile.id),
      JSON.stringify({
        selectedWeekStart,
        calendarBoardView,
        liveWeekView,
      }),
    );
  }, [
    calendarBoardView,
    calendarViewStateHydrated,
    liveWeekView,
    selectedWeekStart,
    workspace.profile,
  ]);

  useEffect(() => {
    void reloadTemplateBlocks();
  }, [reloadTemplateBlocks]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setItems([]);
      return;
    }

    void reloadCalendarItems();
  }, [
    reloadCalendarItems,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setEvidenceByCalendarItemId(new Map());
      return;
    }

    let active = true;
    void listCleanEvidenceEntries(workspace.profile.id, {
      fromDate: selectedCalendarStart,
      toDate: selectedCalendarEnd,
      limit: 240,
    }).then((entries) => {
      if (!active) return;
      setEvidenceByCalendarItemId(
        new Map(
          entries
            .filter((entry) => entry.calendarItemId)
            .map((entry) => [entry.calendarItemId as string, entry.id]),
        ),
      );
    }).catch(() => {
      if (active) setEvidenceByCalendarItemId(new Map());
    });

    return () => {
      active = false;
    };
  }, [selectedCalendarEnd, selectedCalendarStart, workspace.profile, workspace.requiresFamilyCreation, workspace.schemaMissing]);

  useEffect(() => {
    if (
      selectedLearningPeriodId &&
      !visibleLearningPeriods.some((period) => period.id === selectedLearningPeriodId)
    ) {
      setSelectedLearningPeriodId("");
    }
  }, [selectedLearningPeriodId, visibleLearningPeriods]);

  useEffect(() => {
    if (
      selectedLearningPeriodId &&
      !weeklySelectableLearningPeriods.some((period) => period.id === selectedLearningPeriodId)
    ) {
      setSelectedLearningPeriodId("");
    }
  }, [selectedLearningPeriodId, weeklySelectableLearningPeriods]);

  useEffect(() => {
    if (
      editingLearningPeriodId &&
      !visibleLearningPeriods.some((period) => period.id === editingLearningPeriodId)
    ) {
      resetLearningPeriodEditor();
    }
  }, [editingLearningPeriodId, visibleLearningPeriods]);

  useEffect(() => {
    setMasterWeekViewTouched(false);
  }, [selectedTemplateId]);

  useEffect(() => {
    if (!selectedTemplateId || masterWeekViewTouched) return;
    setMasterWeekView(hasWeekendTemplateBlocks ? "full" : "school");
  }, [hasWeekendTemplateBlocks, masterWeekViewTouched, selectedTemplateId]);

  useEffect(() => {
    setLiveWeekViewTouched(false);
  }, [selectedWeekStart]);

  useEffect(() => {
    if (liveWeekViewTouched) return;
    setLiveWeekView(hasWeekendLiveItems ? "full" : "school");
  }, [hasWeekendLiveItems, liveWeekViewTouched]);

  useEffect(() => {
    if (!isPlanningView(handoffView)) return;
    setPlanningView(handoffView);
  }, [handoffView]);

  useEffect(() => {
    setPreviewSuggestions([]);
  }, [
    blackoutDays,
    learningPeriods,
    selectedLearningPeriodId,
    selectedTemplateId,
    selectedWeekStart,
    templateBlocks,
  ]);

  function resetTemplateBlockForm() {
    setEditingTemplateBlockId(null);
    setBlockWeekday("1");
    setBlockTitle("");
    setBlockLearningArea("");
    setBlockLearningAreaCustom("");
    setBlockLearnerId("");
    setBlockTimeMode("untimed");
    setBlockStartTime("");
    setBlockEndTime("");
    setBlockProgramId("");
    setBlockProgramSegmentId("");
    setBlockSessionLabel("");
    setBlockNotes("");
  }

  function resetPopoverForm() {
    setEditingItemId(null);
    setPopoverDate(getTodayDate());
    setPopoverTitle("");
    setPopoverLearnerId("");
    setPopoverLearningArea("");
    setPopoverLearningAreaCustom("");
    setPopoverTimeMode("untimed");
    setPopoverStartTime("");
    setPopoverEndTime("");
    setPopoverDescription("");
    setPopoverProgramId("");
    setPopoverProgramSegmentId("");
  }

  function resetLearningPeriodEditor() {
    setEditingLearningPeriodId(null);
    setEditingLearningPeriodTitle("");
    setEditingLearningPeriodType("term");
    setEditingLearningPeriodStartsOn(getWeekStart());
    setEditingLearningPeriodEndsOn(addDays(getWeekStart(), 13));
    setEditingLearningPeriodIsBreak(false);
    setEditingLearningPeriodNotes("");
  }

  function openCreatePopover(dateValue: string) {
    resetPopoverForm();
    setPopoverDate(dateValue);
    setPopoverLearnerId(workspace.setupStatus.activeLearnerId ?? "");
    if (hasCalendarHandoff) {
      setPopoverTitle(handoffDefaults.title);
      setPopoverLearnerId(handoffDefaults.learnerId || workspace.setupStatus.activeLearnerId || "");
      const handoffArea = resolveLearningAreaControl(handoffDefaults.learningArea);
      setPopoverLearningArea(handoffArea.area);
      setPopoverLearningAreaCustom(handoffArea.customLabel);
      setPopoverDescription(handoffDefaults.notes);
      setPopoverProgramId(handoffDefaults.programId);
      setPopoverProgramSegmentId(handoffDefaults.segmentId);
    }
    setPopoverOpen(true);
    trackCoreJourneyEvent(
      "calendar_block_form_opened",
      { area: "my_calendar", route: pathname, outcome: "create" },
      user?.id,
    );
    setMessage(null);
    setActionError(null);
  }

  function openEditPopover(item: CleanCalendarItem) {
    setEditingItemId(item.id);
    setPopoverDate(item.plannedDate);
    setPopoverTitle(item.title);
    setPopoverLearnerId(item.learnerId ?? "");
    const itemArea = resolveLearningAreaControl(item.learningArea);
    setPopoverLearningArea(itemArea.area);
    setPopoverLearningAreaCustom(itemArea.customLabel);
    setPopoverTimeMode(item.startsAt && item.endsAt ? "timed" : "untimed");
    setPopoverStartTime(toTimeFieldValue(item.startsAt));
    setPopoverEndTime(toTimeFieldValue(item.endsAt));
    setPopoverDescription(item.description ?? "");
    setPopoverProgramId(item.programId ?? "");
    setPopoverProgramSegmentId(item.programSegmentId ?? "");
    setPopoverOpen(true);
    trackCoreJourneyEvent(
      "calendar_block_form_opened",
      { area: "my_calendar", route: pathname, outcome: "edit" },
      user?.id,
    );
    setMessage(null);
    setActionError(null);
  }

  function closePopover() {
    setPopoverOpen(false);
    resetPopoverForm();
  }

  function openLearningPeriodEditor(period: CleanLearningPeriod) {
    setLearningPeriodsOpen(true);
    setEditingLearningPeriodId(period.id);
    setEditingLearningPeriodTitle(period.title);
    setEditingLearningPeriodType(
      period.periodType === "break" ? "term" : period.periodType,
    );
    setEditingLearningPeriodStartsOn(period.startsOn);
    setEditingLearningPeriodEndsOn(period.endsOn);
    setEditingLearningPeriodIsBreak(period.isBreak || period.periodType === "break");
    setEditingLearningPeriodNotes(period.notes ?? "");
    setMessage(null);
    setActionError(null);
  }

  function openAcademicYearEditor(year: CleanAcademicYear) {
    setSelectedAcademicYearId(year.id);
    setEditingAcademicYearId(year.id);
    setYearTitle(year.title);
    setYearStartsOn(year.startsOn);
    setYearEndsOn(year.endsOn);
    setYearCountryCode(year.countryCode ?? "");
    setYearJurisdictionCode(year.jurisdictionCode ?? "");
    setPendingAcademicYearUpdate(null);
    setShowYearComposer(true);
    setMessage(null);
    setActionError(null);
    scrollToCalendarSection("learning-year-setup");
  }

  function closeAcademicYearEditor() {
    setEditingAcademicYearId(null);
    setPendingAcademicYearUpdate(null);
    setYearTitle("");
    setYearStartsOn(getWeekStart());
    setYearEndsOn(addDays(getWeekStart(), 83));
    setYearCountryCode("");
    setYearJurisdictionCode("");
  }

  function closeLearningPeriodEditor() {
    resetLearningPeriodEditor();
  }

  function openCreateRhythmPopover(weekday: number) {
    resetTemplateBlockForm();
    setBlockWeekday(String(weekday));
    setBlockLearnerId(workspace.setupStatus.activeLearnerId ?? "");
    if (hasCalendarHandoff) {
      setBlockTitle(handoffDefaults.title);
      setBlockLearnerId(handoffDefaults.learnerId || workspace.setupStatus.activeLearnerId || "");
      const handoffArea = resolveLearningAreaControl(handoffDefaults.learningArea);
      setBlockLearningArea(handoffArea.area);
      setBlockLearningAreaCustom(handoffArea.customLabel);
      setBlockNotes(handoffDefaults.notes);
      setBlockProgramId(handoffDefaults.programId);
      setBlockProgramSegmentId(handoffDefaults.segmentId);
    }
    setRhythmPopoverOpen(true);
    setMessage(null);
    setActionError(null);
  }

  function openEditRhythmPopover(block: CleanTemplateBlock) {
    setEditingTemplateBlockId(block.id);
    setBlockWeekday(String(block.weekday));
    setBlockTitle(block.title);
    const blockArea = resolveLearningAreaControl(block.learningArea);
    setBlockLearningArea(blockArea.area);
    setBlockLearningAreaCustom(blockArea.customLabel);
    setBlockLearnerId(block.learnerId ?? "");
    setBlockTimeMode(block.startsAt && block.endsAt ? "timed" : "untimed");
    setBlockStartTime(block.startsAt ? safeTimeString(block.startsAt) : "");
    setBlockEndTime(block.endsAt ? safeTimeString(block.endsAt) : "");
    setBlockProgramId(block.programId ?? "");
    setBlockProgramSegmentId(block.programSegmentId ?? "");
    setBlockSessionLabel(block.sessionLabel ?? "");
    setBlockNotes(block.notes ?? "");
    setRhythmPopoverOpen(true);
    setMessage(null);
    setActionError(null);
  }

  function closeRhythmPopover() {
    setRhythmPopoverOpen(false);
    resetTemplateBlockForm();
  }

  function clearCalendarHandoff() {
    router.replace(pathname);
  }

  function scrollToCalendarSection(sectionId: string) {
    window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function focusLearningYearSetup() {
    setLearningPeriodsOpen(true);
    setShowYearComposer(true);
    scrollToCalendarSection("learning-year-setup");
  }

  function focusLearningPeriodSetup() {
    setLearningPeriodsOpen(true);
    openLearningPeriodComposer("term");
    scrollToCalendarSection("learning-period-setup");
  }

  function focusBreakSetup() {
    if (!hasRealLearningPeriod) return;
    setLearningPeriodsOpen(true);
    openLearningPeriodComposer("break");
    scrollToCalendarSection("learning-period-setup");
  }

  function focusMasterWeekTemplate() {
    setPlanningView("master");
    setShowTemplateComposer(true);
    setShowMasterBlockHandoff(false);
    setMessage(null);
    setActionError(null);
    scrollToCalendarSection("master-week-template");
  }

  function continueToMyDayFromCalendar() {
    if (setupStatus === "active") {
      completeSetupStep("calendar");
    }
    router.push("/my-day");
  }

  function addAnotherMasterBlock() {
    setPlanningView("master");
    setShowMasterBlockHandoff(false);
    scrollToCalendarSection("master-week-template");
    window.requestAnimationFrame(() => {
      const firstDay = visibleMasterDays[0]?.value ?? 1;
      openCreateRhythmPopover(firstDay);
    });
  }

  function openLearningPeriodComposer(mode: LearningPeriodComposerMode) {
    if (mode === "break" && !canAddBreakOrHoliday(visibleLearningPeriods)) {
      setActionError("Add a learning period before adding a break or holiday.");
      setMessage(null);
      return;
    }
    setLearningPeriodsOpen(true);
    setLearningPeriodComposerMode(mode);
    setShowLearningPeriodComposer(true);
    setPeriodIsBreak(mode === "break");
    setPeriodType(mode === "break" ? "break" : "term");
    if (selectedAcademicYear) {
      const yearStart = selectedAcademicYear.startsOn;
      const yearEnd = selectedAcademicYear.endsOn;
      const suggestedStart = clampDate(
        mode === "break" ? getTodayDate() : periodStartsOn,
        yearStart,
        yearEnd,
      );
      const suggestedEnd = clampDate(
        mode === "break" ? addDays(suggestedStart, 6) : periodEndsOn,
        suggestedStart,
        yearEnd,
      );
      setPeriodStartsOn(suggestedStart);
      setPeriodEndsOn(suggestedEnd);
    }
  }

  async function handleAcademicYearSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile) return;

    const yearDateError = validateLearningYearDates(yearStartsOn, yearEndsOn);
    if (yearDateError) {
      setActionError(yearDateError);
      setMessage(null);
      return;
    }

    const editingAcademicYear = editingAcademicYearId
      ? academicYears.find((year) => year.id === editingAcademicYearId) ?? null
      : null;

    if (editingAcademicYear) {
      const input: CleanAcademicYearUpdate = {
        title: yearTitle || getLearningYearNameSuggestion(yearStartsOn, yearEndsOn),
        startsOn: yearStartsOn,
        endsOn: yearEndsOn,
        countryCode: yearCountryCode || null,
        jurisdictionCode: yearJurisdictionCode || null,
      };
      const dateChanged =
        input.startsOn !== editingAcademicYear.startsOn || input.endsOn !== editingAcademicYear.endsOn;
      const hasDependentPlanning =
        learningPeriods.some((period) => period.academicYearId === editingAcademicYear.id) ||
        items.length > 0;

      const dependentPeriodDateError = validateLearningYearDateChange(
        input.startsOn ?? "",
        input.endsOn ?? "",
        learningPeriods
          .filter((period) => period.academicYearId === editingAcademicYear.id)
          .map((period) => ({ startsOn: period.startsOn, endsOn: period.endsOn })),
      );
      if (dependentPeriodDateError) {
        setActionError(dependentPeriodDateError);
        setMessage(null);
        return;
      }

      if (dateChanged && hasDependentPlanning && !pendingAcademicYearUpdate) {
        setPendingAcademicYearUpdate({ id: editingAcademicYear.id, input });
        setMessage(null);
        setActionError(null);
        return;
      }

      await persistAcademicYearUpdate(editingAcademicYear.id, input);
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const created = await createCleanAcademicYear(workspace.profile.id, {
        title: yearTitle || getLearningYearNameSuggestion(yearStartsOn, yearEndsOn),
        startsOn: yearStartsOn,
        endsOn: yearEndsOn,
        countryCode: yearCountryCode || null,
        jurisdictionCode: yearJurisdictionCode || null,
      });

      setSelectedAcademicYearId(created.id);
      setShowYearComposer(false);
      setShowLearningPeriodComposer(true);
      setLearningPeriodComposerMode("term");
      setMessage("Learning year saved.");
      setYearTitle("");
      await reloadSetupData();
      requestCoachStateRefresh("learning-year-created");
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save this learning year.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function persistAcademicYearUpdate(
    academicYearId: string,
    input: CleanAcademicYearUpdate,
  ) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await updateCleanAcademicYear(workspace.profile.id, academicYearId, input);
      setMessage("Learning year updated.");
      closeAcademicYearEditor();
      await reloadSetupData();
      requestCoachStateRefresh("learning-year-updated");
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(error, "We could not update this learning year."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAcademicYearDelete(year: CleanAcademicYear) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await deleteCleanAcademicYear(workspace.profile.id, year.id);
      if (selectedAcademicYearId === year.id) setSelectedAcademicYearId("");
      if (editingAcademicYearId === year.id) closeAcademicYearEditor();
      setMessage("Learning year removed.");
      await reloadSetupData();
      requestCoachStateRefresh("learning-year-deleted");
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(error, "We could not delete this learning year."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmAcademicYearDateChange() {
    if (!pendingAcademicYearUpdate) return;
    const pending = pendingAcademicYearUpdate;
    setPendingAcademicYearUpdate(null);
    await persistAcademicYearUpdate(pending.id, pending.input);
  }

  async function handleLearningPeriodSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile) return;

    if (!selectedAcademicYear) {
      setActionError("Choose a learning year before adding a learning period.");
      setMessage(null);
      return;
    }

    if (periodIsBreak && !canAddBreakOrHoliday(visibleLearningPeriods)) {
      setActionError("Add a learning period before adding a break or holiday.");
      setMessage(null);
      return;
    }

    const periodDateError = validateLearningPeriodDates({
      academicYear: selectedAcademicYear,
      startsOn: periodStartsOn,
      endsOn: periodEndsOn,
      isBreak: periodIsBreak,
      existingPeriods: visibleLearningPeriods,
    });
    if (periodDateError) {
      setActionError(periodDateError);
      setMessage(null);
      return;
    }

    if (periodStartsOn > periodEndsOn) {
      setActionError(
        periodIsBreak
          ? "The break end date must be after the start date."
          : "The learning period end date must be after the start date.",
      );
      setMessage(null);
      return;
    }

    if (
      !dateRangeContains(
        selectedAcademicYear.startsOn,
        selectedAcademicYear.endsOn,
        periodStartsOn,
        periodEndsOn,
      )
    ) {
      setActionError(
        periodIsBreak
          ? `This break must sit inside the learning year: ${formatWeekRangeLabel(
              selectedAcademicYear.startsOn,
              selectedAcademicYear.endsOn,
            )}.`
          : `This learning period must sit inside the learning year: ${formatWeekRangeLabel(
              selectedAcademicYear.startsOn,
              selectedAcademicYear.endsOn,
            )}.`,
      );
      setMessage(null);
      return;
    }

    if (!periodIsBreak) {
      const overlappingTerm = learningTermsForSelectedYear.find((period) =>
        doDateRangesOverlap(period.startsOn, period.endsOn, periodStartsOn, periodEndsOn),
      );

      if (overlappingTerm) {
        setActionError(
          `This learning period overlaps with ${overlappingTerm.title}. Adjust the dates so terms do not overlap.`,
        );
        setMessage(null);
        return;
      }
    }

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await createCleanLearningPeriod(workspace.profile.id, {
        academicYearId: selectedAcademicYearId,
        title: periodTitle,
        periodType,
        startsOn: periodStartsOn,
        endsOn: periodEndsOn,
        isBreak: periodIsBreak,
        notes: periodNotes || null,
      });

      setMessage(
        periodIsBreak
          ? "Break / holiday saved. Breaks pause regular planning inside a term."
          : "Learning period saved.",
      );
      setShowLearningPeriodComposer(false);
      setPeriodTitle("");
      setPeriodNotes("");
      setPeriodType("term");
      setPeriodIsBreak(false);
      setLearningPeriodComposerMode("term");
      await reloadSetupData();
      requestCoachStateRefresh("learning-period-created");
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save this learning period.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLearningPeriodUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile || !editingLearningPeriodId) return;

    const editingPeriod = visibleLearningPeriods.find(
      (period) => period.id === editingLearningPeriodId,
    );
    const editingAcademicYear = editingPeriod
      ? academicYears.find((year) => year.id === editingPeriod.academicYearId)
      : selectedAcademicYear;

    if (!editingAcademicYear) {
      setActionError("Choose a learning year before updating this learning period.");
      setMessage(null);
      return;
    }

    const periodDateError = validateLearningPeriodDates({
      academicYear: editingAcademicYear,
      startsOn: editingLearningPeriodStartsOn,
      endsOn: editingLearningPeriodEndsOn,
      isBreak: editingLearningPeriodIsBreak,
      existingPeriods: visibleLearningPeriods,
      excludeId: editingLearningPeriodId,
    });
    if (periodDateError) {
      setActionError(periodDateError);
      setMessage(null);
      return;
    }

    if (editingLearningPeriodStartsOn > editingLearningPeriodEndsOn) {
      setActionError(
        editingLearningPeriodIsBreak
          ? "The break end date must be after the start date."
          : "The learning period end date must be after the start date.",
      );
      setMessage(null);
      return;
    }

    if (
      !dateRangeContains(
        editingAcademicYear.startsOn,
        editingAcademicYear.endsOn,
        editingLearningPeriodStartsOn,
        editingLearningPeriodEndsOn,
      )
    ) {
      setActionError(
        editingLearningPeriodIsBreak
          ? `This break must sit inside the learning year: ${formatWeekRangeLabel(
              editingAcademicYear.startsOn,
              editingAcademicYear.endsOn,
            )}.`
          : `This learning period must sit inside the learning year: ${formatWeekRangeLabel(
              editingAcademicYear.startsOn,
              editingAcademicYear.endsOn,
            )}.`,
      );
      setMessage(null);
      return;
    }

    if (!editingLearningPeriodIsBreak) {
      const overlappingTerm = learningPeriods.find(
        (period) =>
          period.id !== editingLearningPeriodId &&
          period.academicYearId === editingAcademicYear.id &&
          !isBreakLearningPeriod(period) &&
          doDateRangesOverlap(
            period.startsOn,
            period.endsOn,
            editingLearningPeriodStartsOn,
            editingLearningPeriodEndsOn,
          ),
      );

      if (overlappingTerm) {
        setActionError(
          `This learning period overlaps with ${overlappingTerm.title}. Adjust the dates so terms do not overlap.`,
        );
        setMessage(null);
        return;
      }
    }

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await updateCleanLearningPeriod(workspace.profile.id, editingLearningPeriodId, {
        title: editingLearningPeriodTitle,
        periodType: editingLearningPeriodIsBreak ? "break" : editingLearningPeriodType,
        startsOn: editingLearningPeriodStartsOn,
        endsOn: editingLearningPeriodEndsOn,
        isBreak: editingLearningPeriodIsBreak,
        notes: editingLearningPeriodNotes || null,
      });

      setMessage(
        editingLearningPeriodIsBreak
          ? "Break / holiday updated."
          : "Learning period updated.",
      );
      closeLearningPeriodEditor();
      await reloadSetupData();
      requestCoachStateRefresh("learning-period-updated");
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not update this learning period.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLearningPeriodDelete(period: CleanLearningPeriod) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await deleteCleanLearningPeriod(workspace.profile.id, period.id);

      if (selectedLearningPeriodId === period.id) {
        setSelectedLearningPeriodId("");
      }

      if (editingLearningPeriodId === period.id) {
        closeLearningPeriodEditor();
      }

      setMessage(
        period.isBreak || period.periodType === "break"
          ? "Break / holiday removed."
          : "Learning period removed.",
      );
      await reloadSetupData();
      requestCoachStateRefresh("learning-period-deleted");
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not delete this learning period.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTemplateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const created = await createCleanMasterTemplate(workspace.profile.id, {
        title: templateTitle,
        description: templateDescription || null,
        scopeType: templateScopeType,
        learnerId: templateScopeType === "learner" ? templateLearnerId || null : null,
        isActive: true,
      });

      setSelectedTemplateId(created.id);
      setShowTemplateComposer(false);
      setMessage("Master week saved.");
      setTemplateTitle("");
      setTemplateDescription("");
      setTemplateLearnerId("");
      setTemplateScopeType("family");
      await reloadSetupData();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save this master week.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTemplateBlockSubmit() {
    if (!workspace.profile || !selectedTemplateId) return;

    const timeResult = validateCalendarTimeMode({
      mode: blockTimeMode,
      startTime: blockStartTime,
      endTime: blockEndTime,
    });
    if (!timeResult.ok) {
      setActionError(timeResult.message);
      setMessage(null);
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const payload = {
        learnerId: blockLearnerId || null,
        weekday: Number.parseInt(blockWeekday, 10) || 1,
        title: blockTitle,
        learningArea: resolveStoredLearningArea(
          blockLearningArea as ControlledLearningArea | "",
          blockLearningAreaCustom,
        ),
        startsAt: timeResult.startsAt,
        endsAt: timeResult.endsAt,
        programId: blockProgramId || null,
        programSegmentId: blockProgramSegmentId || null,
        notes: blockNotes || null,
        sessionLabel: blockSessionLabel || null,
      };

      if (editingTemplateBlockId) {
        await updateCleanTemplateBlock(
          workspace.profile.id,
          editingTemplateBlockId,
          payload,
        );
      } else {
        await createCleanTemplateBlock(
          workspace.profile.id,
          selectedTemplateId,
          payload,
        );
      }

      closeRhythmPopover();
      if (firstSetupMode && !hasMasterWeekBlock) {
        setShowMasterBlockHandoff(true);
      }
      setMessage(hasMasterWeekBlock ? "Master block updated." : "Learning plan started.");
      await reloadTemplateBlocks();
      requestCoachStateRefresh(editingTemplateBlockId ? "weekly-block-updated" : "weekly-block-created");
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save this master block.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTemplateBlockDelete(block: CleanTemplateBlock) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await deleteCleanTemplateBlock(workspace.profile.id, block.id);
      closeRhythmPopover();
      setMessage("Block deleted.");
      await reloadTemplateBlocks();
      requestCoachStateRefresh("weekly-block-deleted");
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "Could not delete this block. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function buildWeekPreview() {
    return buildCleanGeneratedWeekPreview({
      weekStartsOn: selectedWeekStart,
      weekEndsOn: selectedWeekEnd,
      templateBlocks,
      blackoutDays,
      breakPeriods: learningPeriods
        .filter((period) => period.isBreak || period.periodType === "break")
        .map((period) => ({
          startsOn: period.startsOn,
          endsOn: period.endsOn,
          title: period.title,
        })),
      selectedLearningPeriod: selectedLearningPeriod
        ? {
            title: selectedLearningPeriod.title,
            startsOn: selectedLearningPeriod.startsOn,
            endsOn: selectedLearningPeriod.endsOn,
            isBreak: selectedLearningPeriod.isBreak,
            periodType: selectedLearningPeriod.periodType,
          }
        : null,
      programSegments: programSegments.map((segment) => ({
        id: segment.id,
        programId: segment.programId,
        title: segment.title,
      })),
    });
  }

  async function handlePreviewGeneration() {
    if (selectedWeekPlanningMessage) {
      setActionError(selectedWeekPlanningMessage);
      setMessage(null);
      return;
    }

    if (!selectedTemplateId) {
      setMessage("Choose or create a master week first, then plan this week using master.");
      setActionError(null);
      return;
    }

    const nextPreview = buildWeekPreview();
    setPreviewSuggestions(nextPreview);
    setMessage("Preview your week below, then add the master blocks you want to keep.");
    setActionError(null);
  }

  async function handleApplyGeneratedWeek() {
    if (!workspace.profile) return;
    if (selectedWeekPlanningMessage) {
      setActionError(selectedWeekPlanningMessage);
      setMessage(null);
      return;
    }

    if (!selectedTemplateId) {
      setMessage("Choose or create a master week first, then plan this week using master.");
      setActionError(null);
      return;
    }

    if (!previewSuggestions.length) {
      setMessage("Preview this week first, then add the master blocks you want to keep.");
      setActionError(null);
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const latestWeekItems = await listCleanCalendarItems(workspace.profile.id, {
        fromDate: selectedWeekStart,
        toDate: selectedWeekEnd,
        limit: 100,
      });

      const result = await applyCleanGeneratedWeek(workspace.profile.id, {
        academicYearId: selectedAcademicYearId || null,
        learningPeriodId: selectedLearningPeriodId || null,
        masterTemplateId: selectedTemplateId || null,
        weekStartsOn: selectedWeekStart,
        weekEndsOn: selectedWeekEnd,
        previewSuggestions,
        existingCalendarItems: latestWeekItems.map((item) => ({
          plannedDate: item.plannedDate,
          sourceTemplateBlockId: item.sourceTemplateBlockId,
        })),
      });

      const alreadyPlannedCount = result.skippedItems.filter(
        (item) => item.skippedReason === "Already planned",
      ).length;
      const blockedCount = result.skippedItems.length - alreadyPlannedCount;
      const messageParts = [
        `${result.createdItems.length} block${result.createdItems.length === 1 ? "" : "s"} added`,
      ];

      if (alreadyPlannedCount) {
        messageParts.push(
          `${alreadyPlannedCount} already planned`,
        );
      }

      if (blockedCount) {
        messageParts.push(
          `${blockedCount} not added for breaks or blocked days`,
        );
      }

      setMessage(`${messageParts.join(". ")}.`);
      await Promise.all([reloadCalendarItems(), reloadSetupData()]);
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not add these blocks to this week.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePopoverSave() {
    if (!workspace.profile || submitting || popoverSubmitLockRef.current) return;
    popoverSubmitLockRef.current = true;

    const breakForPlannedDate = findBreakForDate(popoverDate, breakPeriodsForSelectedYear);
    if (breakForPlannedDate) {
      setActionError(
        `${formatLongDateLabel(popoverDate)} is inside ${breakForPlannedDate.title} (${formatWeekRangeLabel(
          breakForPlannedDate.startsOn,
          breakForPlannedDate.endsOn,
        )}). Regular learning blocks are paused for this break / holiday.`,
      );
      setMessage(null);
      trackCoreJourneyEvent(
        "calendar_block_save_failed",
        { area: "my_calendar", route: pathname, failureStage: "validation" },
        user?.id,
      );
      popoverSubmitLockRef.current = false;
      return;
    }

    const timeResult = validateCalendarTimeMode({
      mode: popoverTimeMode,
      startTime: popoverStartTime,
      endTime: popoverEndTime,
    });
    if (!timeResult.ok) {
      setActionError(timeResult.message);
      setMessage(null);
      trackCoreJourneyEvent(
        "calendar_block_save_failed",
        { area: "my_calendar", route: pathname, failureStage: "validation" },
        user?.id,
      );
      popoverSubmitLockRef.current = false;
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const payload = {
        title: popoverTitle,
        plannedDate: popoverDate,
        learnerId: popoverLearnerId || null,
        programId: popoverProgramId || null,
        programSegmentId: popoverProgramSegmentId || null,
        learningArea: resolveStoredLearningArea(
          popoverLearningArea as ControlledLearningArea | "",
          popoverLearningAreaCustom,
        ),
        startsAt: timeResult.startsAt
          ? toTimestampFromDateAndTime(popoverDate, timeResult.startsAt)
          : null,
        endsAt: timeResult.endsAt
          ? toTimestampFromDateAndTime(popoverDate, timeResult.endsAt)
          : null,
        description: popoverDescription || null,
        sourceType: "manual" as const,
      };

      if (editingItemId) {
        await updateCleanCalendarItem(workspace.profile.id, editingItemId, payload);
        trackProductEvent(
          "calendar_block_updated",
          {
            area: "my_calendar",
            route: pathname,
            hasLearner: Boolean(payload.learnerId),
            hasLearningArea: Boolean(payload.learningArea),
            hasStartTime: Boolean(payload.startsAt),
            hasEndTime: Boolean(payload.endsAt),
            blockType: payload.sourceType,
          },
          user?.id,
        );
        setMessage("This week's block was updated.");
      } else {
        await createCleanCalendarItem(workspace.profile.id, payload);
        trackProductEvent(
          "calendar_block_created",
          {
            area: "my_calendar",
            route: pathname,
            hasLearner: Boolean(payload.learnerId),
            hasLearningArea: Boolean(payload.learningArea),
            hasStartTime: Boolean(payload.startsAt),
            hasEndTime: Boolean(payload.endsAt),
            blockType: payload.sourceType,
          },
          user?.id,
        );
        setMessage("This week's block was added.");
      }

      trackCoreJourneyEvent(
        "calendar_block_save_succeeded",
        {
          area: "my_calendar",
          route: pathname,
          outcome: editingItemId ? "updated" : "created",
          hasLearner: Boolean(payload.learnerId),
          hasLearningArea: Boolean(payload.learningArea),
          hasStartTime: Boolean(payload.startsAt),
          hasEndTime: Boolean(payload.endsAt),
        },
        user?.id,
      );

      closePopover();
      await reloadCalendarItems();
    } catch (error) {
      trackCoreJourneyEvent(
        "calendar_block_save_failed",
        { area: "my_calendar", route: pathname, failureStage: "request" },
        user?.id,
      );
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save this week's block.",
        ),
      );
    } finally {
      setSubmitting(false);
      popoverSubmitLockRef.current = false;
    }
  }

  async function handleDeleteItem(item: CleanCalendarItem) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await deleteCleanCalendarItem(workspace.profile.id, item.id);
      clearCleanPlanningCacheForFamily(workspace.profile.id);
      trackProductEvent(
        "calendar_block_deleted",
        {
          area: "my_calendar",
          route: pathname,
          hasLearner: Boolean(item.learnerId),
          hasLearningArea: Boolean(item.learningArea),
          hasStartTime: Boolean(item.startsAt),
          hasEndTime: Boolean(item.endsAt),
          blockType: item.sourceType,
        },
        user?.id,
      );
      setMessage("This block was removed from the week.");

      if (editingItemId === item.id) {
        closePopover();
      }

      await reloadCalendarItems();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not remove this block from the week.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCalendarCompletionToggle(item: CleanCalendarItem) {
    if (!workspace.profile || completionUpdatingId) return;

    setCompletionUpdatingId(item.id);
    try {
      const updatedItem = await updateCleanCalendarItem(workspace.profile.id, item.id, {
        completedAt: item.completedAt ? null : new Date().toISOString(),
      });
      clearCleanPlanningCacheForFamily(workspace.profile.id);
      setItems((current) => current.map((currentItem) => currentItem.id === updatedItem.id ? updatedItem : currentItem));
      trackProductEvent(
        "calendar_block_completed",
        { area: "my_calendar", route: pathname, source: "calendar", stateChanged: true },
        user?.id,
      );
    } catch (error) {
      setActionError(normalizeCleanErrorMessage(error, "We could not update this block."));
    } finally {
      setCompletionUpdatingId(null);
    }
  }

  function buildCalendarCaptureHref(item: CleanCalendarItem) {
    const params = new URLSearchParams({
      mode: "quick",
      calendar_item_id: item.id,
      observed_on: item.plannedDate,
      returnTo: pathname.startsWith("/clean-my-calendar") ? "/clean-my-calendar" : "/my-calendar",
    });
    if (item.learnerId) params.set("learner_id", item.learnerId);
    if (item.programId) params.set("program_id", item.programId);
    if (item.programSegmentId) params.set("program_segment_id", item.programSegmentId);
    if (item.learningArea) params.set("learning_area", item.learningArea);
    return `${capturePathBase}?${params.toString()}`;
  }

  async function handleConfirmCalendarDelete() {
    if (!pendingDelete) return;
    const deleteRequest = pendingDelete;

    if (deleteRequest.type === "academic-year") {
      await handleAcademicYearDelete(deleteRequest.year);
    } else if (deleteRequest.type === "calendar-item") {
      await handleDeleteItem(deleteRequest.item);
    } else if (deleteRequest.type === "learning-period") {
      await handleLearningPeriodDelete(deleteRequest.period);
    } else {
      await handleTemplateBlockDelete(deleteRequest.block);
    }

    setPendingDelete(null);
  }

  async function handleWeeklyPlannerDownload() {
    if (!workspace.profile) return;

    setPlannerDownloading(true);
    setPrintMenuOpen(false);
    setMessage(null);
    setActionError(null);

    try {
      const weekItems = items.filter(
        (item) => item.plannedDate >= selectedWeekStart && item.plannedDate <= selectedWeekEnd,
      );
      const entries = weekItems.length
        ? buildCleanWeeklyPlannerEntriesFromCalendarItems(weekItems, {
            learnerLabelById,
            programLabelById,
            segmentLabelById,
          })
        : buildCleanWeeklyPlannerEntriesFromTemplateBlocks(selectedWeekStart, templateBlocks, {
            learnerLabelById,
            programLabelById,
            segmentLabelById,
          });
      const learnerLabel =
        selectedTemplate?.scopeType === "learner" && selectedTemplate.learnerId
          ? learnerLabelById.get(selectedTemplate.learnerId) ?? null
          : null;
      const sourceLabel = weekItems.length
        ? "Built from this week's live calendar"
        : templateBlocks.length
          ? "Built from your master week"
          : "Built as an open weekly layout";
      const pdfBytes = await generateCleanWeeklyPlannerPdfBytes({
        familyName: workspace.profile.displayName || null,
        learnerLabel,
        weekStartsOn: selectedWeekStart,
        weekEndsOn: selectedWeekEnd,
        sourceLabel,
        entries,
        includedDates: liveWeekView === "school" ? weekDates.slice(0, 5) : weekDates,
        viewLabel: liveWeekView === "school" ? "School week view" : "Full week view",
      });

      downloadPdf(
        pdfBytes,
        buildCleanWeeklyPlannerPdfFilename(selectedWeekStart),
      );
      trackProductEvent(
        "weekly_plan_pdf_downloaded",
        {
          area: "my_calendar",
          route: pathname,
          viewType: liveWeekView,
        },
        user?.id,
      );
      setMessage("Weekly planner downloaded.");
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "Could not create the weekly planner. Please try again.",
        ),
      );
    } finally {
      setPlannerDownloading(false);
    }
  }

  async function handleMonthlyPlannerDownload() {
    if (!workspace.profile) return;

    setPlannerDownloading(true);
    setPrintMenuOpen(false);
    setMessage(null);
    setActionError(null);

    try {
      const monthItems = await listCleanCalendarItems(workspace.profile.id, {
        fromDate: monthGridDates[0],
        toDate: monthGridDates[monthGridDates.length - 1],
        limit: 240,
      });
      const entries = buildCleanWeeklyPlannerEntriesFromCalendarItems(monthItems, {
        learnerLabelById,
        programLabelById,
        segmentLabelById,
      });
      const pdfBytes = await generateCleanMonthlyPlannerPdfBytes({
        familyName: workspace.profile.displayName || null,
        learnerLabel: null,
        monthStartsOn: selectedMonthStart,
        entries,
      });

      downloadPdf(
        pdfBytes,
        buildCleanMonthlyPlannerPdfFilename(
          workspace.profile.displayName || null,
          selectedMonthStart,
        ),
      );
      trackProductEvent(
        "monthly_plan_pdf_downloaded",
        {
          area: "my_calendar",
          route: pathname,
          viewType: "month",
        },
        user?.id,
      );
      setMessage("Monthly planner downloaded.");
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "Could not create the monthly planner. Please try again.",
        ),
      );
    } finally {
      setPlannerDownloading(false);
    }
  }

  async function handleTodayPlannerDownload() {
    if (!workspace.profile) return;

    const today = getTodayDate();
    setPlannerDownloading(true);
    setPrintMenuOpen(false);
    setMessage(null);
    setActionError(null);

    try {
      const dayItems = await listCleanCalendarItems(workspace.profile.id, {
        fromDate: today,
        toDate: today,
        limit: 80,
      });
      const entries = buildCleanWeeklyPlannerEntriesFromCalendarItems(dayItems, {
        learnerLabelById,
        programLabelById,
        segmentLabelById,
      });
      const pdfBytes = await generateCleanDailyPlannerPdfBytes({
        familyName: workspace.profile.displayName || null,
        learnerLabel: null,
        plannedDate: today,
        entries,
      });

      downloadPdf(
        pdfBytes,
        buildCleanDailyPlannerPdfFilename(workspace.profile.displayName || null, today),
      );
      trackProductEvent(
        "daily_plan_pdf_downloaded",
        {
          area: "my_calendar",
          route: pathname,
          viewType: "day",
        },
        user?.id,
      );
      setMessage("Daily planner downloaded.");
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "Could not create today's planner. Please try again.",
        ),
      );
    } finally {
      setPlannerDownloading(false);
    }
  }
  const familyDisplayName = String(workspace.profile?.displayName ?? "").trim();
  const calendarHeading = familyDisplayName
    ? `${familyDisplayName} learning week`
    : "My Calendar";
  const firstSetupMode =
    guidanceEnabled && (setupStatus === "not_started" || setupStatus === "active");
  const shouldShowTermSetup = !firstSetupMode || academicYears.length > 0;
  const shouldShowWeeklyPlanner = !firstSetupMode || learningTermsForSelectedYear.length > 0;
  const shouldShowCalendarNextStep = !firstSetupMode || calendarSetupReady;

  return (
    <div style={shellStyle}>
      <MyPlanHeader />
      <div style={wrapStyle}>
        <style jsx global>{`
          @media (max-width: 720px) {
            .mylearna-calendar-intro {
              padding: 16px !important;
            }

            .mylearna-calendar-board {
              padding: 14px !important;
            }

            .mylearna-calendar-board h2 {
              font-size: 21px !important;
            }

            .mylearna-calendar-board-actions {
              width: 100% !important;
              display: grid !important;
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              align-items: stretch !important;
            }

            .mylearna-calendar-board-actions button {
              min-height: 44px !important;
              padding-left: 10px !important;
              padding-right: 10px !important;
            }

            .mylearna-calendar-board-segmented,
            .mylearna-calendar-print-action {
              grid-column: 1 / -1 !important;
              width: 100% !important;
            }

            .mylearna-calendar-board-segmented {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .mylearna-calendar-print-action > button,
            .mylearna-calendar-board-segmented > button {
              width: 100% !important;
            }

            .mylearna-calendar-print-menu {
              left: 0 !important;
              right: 0 !important;
              width: 100% !important;
            }

            .mylearna-calendar-week-scroll {
              overflow-x: visible !important;
            }

            .mylearna-calendar-week-grid {
              grid-template-columns: minmax(0, 1fr) !important;
              min-width: 0 !important;
            }

            .mylearna-calendar-day-card {
              width: 100% !important;
              min-width: 0 !important;
            }

            .mylearna-calendar-day-header {
              display: grid !important;
              grid-template-columns: minmax(0, 1fr) !important;
              align-items: stretch !important;
            }

            .mylearna-calendar-day-header button,
            .mylearna-calendar-day-empty-action {
              width: 100% !important;
              min-height: 44px !important;
            }

            .mylearna-calendar-empty-repeated-copy {
              display: none !important;
            }
          }

          .mylearna-calendar-planner-shell {
            overflow: hidden;
            display: block;
          }

          .mylearna-calendar-planner-content {
            display: grid;
            gap: 0;
          }

          .mylearna-calendar-planner-header {
            position: relative;
            z-index: 10;
            background: rgba(255, 255, 255, 0.96);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 14px;
          }

          .mylearna-calendar-planner-scroll {
            height: clamp(520px, 72dvh, 780px);
            max-height: calc(100dvh - 220px);
            overflow-y: auto;
            overflow-x: hidden;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            scrollbar-gutter: stable;
            display: grid;
            gap: 14px;
            padding: 14px 4px 4px 0;
          }

          @media (max-width: 720px) {
            .mylearna-calendar-planner-content {
              gap: 0;
            }

            .mylearna-calendar-planner-header {
              padding-bottom: 12px;
            }

            .mylearna-calendar-planner-scroll {
              height: clamp(460px, 64dvh, 720px);
              max-height: calc(100dvh - 180px);
              padding: 12px 0 0;
            }
          }
        `}</style>
        <CoreJourneyCue stage="plan" />
        {!firstSetupMode ? <CleanWorkflowRibbon /> : null}
        {setupStatus !== "active" ? <CleanFirstRunSetupGate currentStep="calendar" /> : null}
        {setupStatus !== "active" ? (
          <GuidanceSetupProgress
            stepId="calendar"
            title="Set your learning year and first term."
            body="Choose the date range MyLearna should plan inside. You can adjust this later."
            task={calendarSetupTask}
          />
        ) : null}

        {!firstSetupMode ? (
        <CleanPageIntroVideo
          configs={[
            PAGE_INTRO_VIDEOS.myCalendarWeeklyPlanner,
            PAGE_INTRO_VIDEOS.myCalendarTermTimes,
          ]}
          promptKey="my-calendar"
          promptTitle="New to My Calendar?"
          promptDescription="Watch a quick guide to plan your week or set term times."
        />
        ) : null}

        <section className="mylearna-calendar-intro" data-guidance-id="calendar-week-view" style={cardStyle}>
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              MyLearna planning
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>{calendarHeading}</h1>
            <p style={{ ...secondaryTextStyle, margin: 0, fontWeight: 700 }}>
              Plan the learning week.
            </p>
            <CoreJourneyHelp>
              <p>
                Set term dates, keep a reusable master week, and shape the live week when
                you need it.
              </p>
            </CoreJourneyHelp>
            <div>
              {!firstSetupMode ? <GuidancePageAction tourId="my-calendar" /> : null}
            </div>
          </div>
        </section>

        {workspace.loading && !workspace.profile && user?.id ? (
          <section
            style={cardStyle}
            role="region"
            aria-label="Calendar primary content"
            data-testid="calendar-primary-loading-shell"
          >
            <div style={{ display: "grid", gap: 12 }}>
              <span
                style={{
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Calendar
              </span>
              <h2 style={{ margin: 0, color: "#0f172a" }}>Choose a planning view</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={mutedButtonStyle}
                  onClick={() => setSelectedWeekStart(getWeekStart())}
                >
                  Today
                </button>
                <button
                  type="button"
                  style={mutedButtonStyle}
                  onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, -7))}
                  aria-label="Previous week"
                >
                  Previous
                </button>
                <button
                  type="button"
                  style={mutedButtonStyle}
                  onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, 7))}
                  aria-label="Next week"
                >
                  Next
                </button>
                <button type="button" style={mutedButtonStyle} disabled>
                  Add block
                </button>
              </div>
              <div
                style={{
                  minHeight: 84,
                  border: "1px solid #dbeafe",
                  borderRadius: 14,
                  background: "#f8fbff",
                  padding: 14,
                  display: "grid",
                  gap: 6,
                }}
                aria-live="polite"
              >
                <strong style={{ color: "#0f172a" }}>
                  Week of {formatLongDateLabel(selectedWeekStart)}
                </strong>
                <span style={{ color: "#64748b" }}>
                  Your family planning data will appear here as soon as it is available.
                </span>
              </div>
            </div>
          </section>
        ) : null}

        {workspace.loading && !workspace.profile && !user?.id ? (
          <section style={cardStyle} role="status">Restoring your session...</section>
        ) : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Planning setup not ready yet</h2>
            <p style={secondaryTextStyle}>
              The planning tools are not ready on this install yet, so this page cannot load.
            </p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.error ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>Workspace error</strong>
            <p style={secondaryTextStyle}>{workspace.error}</p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.requiresFamilyCreation ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Create family profile first</h2>
            <p style={secondaryTextStyle}>
              This calendar is family-based. Create your family profile first on{" "}
              <Link href="/my-profile">My Profile</Link>.
            </p>
          </section>
        ) : null}

        {readyForCalendar && !workspace.learners.length ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
            <p style={secondaryTextStyle}>
              Add at least one learner on <Link href="/my-profile">My Profile</Link> before
              setting learning periods or building a master week.
            </p>
          </section>
        ) : null}

        {readyForCalendar && workspace.profile && workspace.learners.length ? (
          <>
            {setupLoading && !hasExistingPlanningSetup ? (
              <section
                style={cardStyle}
                role="region"
                aria-label="Calendar controls"
                data-testid="calendar-primary-loading-shell"
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        color: "#64748b",
                        textTransform: "uppercase",
                      }}
                    >
                      Calendar
                    </span>
                    <h2 style={{ margin: 0, color: "#0f172a" }}>
                      Your planning view is ready
                    </h2>
                    <p style={{ ...secondaryTextStyle, margin: 0 }}>
                      Planning details are still refreshing. You can choose a date or add a
                      block without waiting for the rest of the setup.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      style={mutedButtonStyle}
                      onClick={() => setSelectedWeekStart(getWeekStart())}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      style={mutedButtonStyle}
                      onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, -7))}
                      aria-label="Previous week"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      style={mutedButtonStyle}
                      onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, 7))}
                      aria-label="Next week"
                    >
                      Next
                    </button>
                    <button
                      type="button"
                      style={{ ...buttonStyle, background: "#0f172a", color: "#ffffff" }}
                      onClick={() => openCreatePopover(getTodayDate())}
                    >
                      Add block
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 16,
                    minHeight: 96,
                    border: "1px solid #dbeafe",
                    borderRadius: 14,
                    background: "#f8fbff",
                    padding: 14,
                    display: "grid",
                    gap: 6,
                  }}
                  aria-live="polite"
                >
                  <strong style={{ color: "#0f172a" }}>
                    Week of {formatLongDateLabel(selectedWeekStart)}
                  </strong>
                  <span style={{ color: "#64748b" }}>
                    {itemsLoading ? "Loading planned blocks for this view..." : "No blocks loaded for this view yet."}
                  </span>
                </div>
              </section>
            ) : null}

            {hasExistingPlanningSetup ? (
            <section
              className="mylearna-calendar-board mylearna-calendar-planner-shell"
              style={cardStyle}
              role="region"
              aria-label="Calendar planner board"
            >
              <div className="mylearna-calendar-planner-content" style={{ display: "grid", gap: 18 }}>
                <div className="mylearna-calendar-planner-header" style={{ display: "grid", gap: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
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
                      Master planning calendar
                    </div>
                    <h2 style={{ margin: 0, color: "#0f172a" }}>{calendarBoardLabel}</h2>
                    <CoreJourneyHelp>
                      <p>
                        Plan learning blocks here. Today&apos;s blocks flow through to My Day.
                      </p>
                    </CoreJourneyHelp>
                  </div>

                  <div
                    className="mylearna-calendar-board-actions"
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      style={mutedButtonStyle}
                      onClick={() => setSelectedWeekStart(getWeekStart())}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      style={mutedButtonStyle}
                      onClick={() =>
                        setSelectedWeekStart(
                          calendarBoardView === "week"
                            ? addDays(selectedWeekStart, -7)
                            : getWeekStart(addMonths(selectedMonthStart, -1)),
                        )
                      }
                      aria-label={
                        calendarBoardView === "week" ? "Previous week" : "Previous month"
                      }
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      style={mutedButtonStyle}
                      onClick={() =>
                        setSelectedWeekStart(
                          calendarBoardView === "week"
                            ? addDays(selectedWeekStart, 7)
                            : getWeekStart(addMonths(selectedMonthStart, 1)),
                        )
                      }
                      aria-label={calendarBoardView === "week" ? "Next week" : "Next month"}
                    >
                      Next
                    </button>
                    <div
                      className="mylearna-calendar-board-segmented"
                      style={{
                        display: "inline-flex",
                        border: "1px solid #cbd5e1",
                        borderRadius: 12,
                        padding: 4,
                        background: "#f8fafc",
                        gap: 4,
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          ...buttonStyle,
                          padding: "8px 12px",
                          background: calendarBoardView === "week" ? "#0f172a" : "#ffffff",
                          color: calendarBoardView === "week" ? "#ffffff" : "#0f172a",
                          borderColor: calendarBoardView === "week" ? "#0f172a" : "#ffffff",
                        }}
                        onClick={() => setCalendarBoardView("week")}
                      >
                        Week
                      </button>
                      <button
                        type="button"
                        style={{
                          ...buttonStyle,
                          padding: "8px 12px",
                          background: calendarBoardView === "month" ? "#0f172a" : "#ffffff",
                          color: calendarBoardView === "month" ? "#ffffff" : "#0f172a",
                          borderColor: calendarBoardView === "month" ? "#0f172a" : "#ffffff",
                        }}
                        onClick={() => setCalendarBoardView("month")}
                      >
                        Month
                      </button>
                    </div>
                    <div className="mylearna-calendar-print-action" style={{ position: "relative" }}>
                      <button
                        type="button"
                        style={mutedButtonStyle}
                        onClick={() => setPrintMenuOpen((current) => !current)}
                        disabled={plannerDownloading}
                        aria-expanded={printMenuOpen}
                      >
                        {plannerDownloading ? "Preparing..." : "Print / Download"}
                      </button>
                      {printMenuOpen ? (
                        <div
                          className="mylearna-calendar-print-menu"
                          style={{
                            position: "absolute",
                            right: 0,
                            top: "calc(100% + 8px)",
                            zIndex: 20,
                            width: 230,
                            border: "1px solid #cbd5e1",
                            borderRadius: 14,
                            background: "#ffffff",
                            boxShadow: "0 18px 40px rgba(15,23,42,0.14)",
                            padding: 8,
                            display: "grid",
                            gap: 6,
                          }}
                        >
                          <button
                            type="button"
                            style={{ ...mutedButtonStyle, width: "100%", textAlign: "left" }}
                            onClick={() => void handleWeeklyPlannerDownload()}
                          >
                            Download week plan PDF
                          </button>
                          <button
                            type="button"
                            style={{ ...mutedButtonStyle, width: "100%", textAlign: "left" }}
                            onClick={() => void handleMonthlyPlannerDownload()}
                          >
                            Download month plan PDF
                          </button>
                          <button
                            type="button"
                            style={{ ...mutedButtonStyle, width: "100%", textAlign: "left" }}
                            onClick={() => void handleTodayPlannerDownload()}
                          >
                            Download today&apos;s plan - {formatDayMonthLabel(getTodayDate())}
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {calendarBoardView === "week" ? (
                      <div
                        className="mylearna-calendar-board-segmented"
                        style={{
                          display: "inline-flex",
                          border: "1px solid #cbd5e1",
                          borderRadius: 12,
                          padding: 4,
                          background: "#f8fafc",
                          gap: 4,
                        }}
                      >
                        <button
                          type="button"
                          style={{
                            ...buttonStyle,
                            padding: "8px 12px",
                            background: liveWeekView === "school" ? "#0f172a" : "#ffffff",
                            color: liveWeekView === "school" ? "#ffffff" : "#0f172a",
                            borderColor: liveWeekView === "school" ? "#0f172a" : "#ffffff",
                          }}
                          onClick={() => {
                            setLiveWeekView("school");
                            setLiveWeekViewTouched(true);
                          }}
                        >
                          School week
                        </button>
                        <button
                          type="button"
                          style={{
                            ...buttonStyle,
                            padding: "8px 12px",
                            background: liveWeekView === "full" ? "#0f172a" : "#ffffff",
                            color: liveWeekView === "full" ? "#ffffff" : "#0f172a",
                            borderColor: liveWeekView === "full" ? "#0f172a" : "#ffffff",
                          }}
                          onClick={() => {
                            setLiveWeekView("full");
                            setLiveWeekViewTouched(true);
                          }}
                        >
                          Full week
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {itemsLoading ? (
                  <p style={secondaryTextStyle}>Loading planned blocks...</p>
                ) : null}
                {itemsError ? (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <p style={{ margin: 0, color: "#b91c1c" }}>{itemsError}</p>
                    <button
                      type="button"
                      style={mutedButtonStyle}
                      onClick={() => void reloadCalendarItems()}
                    >
                      Try again
                    </button>
                  </div>
                ) : null}

                {hasHiddenWeekendWeekContent && calendarBoardView === "week" ? (
                  <div
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: 14,
                      padding: 12,
                      background: "#ffffff",
                      color: "#475569",
                      lineHeight: 1.6,
                    }}
                  >
                    Weekend plans are still part of this week. Switch to Full week to view
                    Saturday and Sunday.
                  </div>
                ) : null}

                </div>

                <div
                  className={
                    calendarBoardView === "week"
                      ? "mylearna-calendar-week-scroll mylearna-calendar-planner-scroll"
                      : "mylearna-calendar-planner-scroll"
                  }
                  style={{
                    overflowX:
                      calendarBoardView === "week" && liveWeekView === "full"
                        ? "auto"
                        : "visible",
                    paddingBottom: 4,
                  }}
                >
                  {!itemsLoading && !calendarBoardDates.some((dateValue) => (itemsByDate.get(dateValue) ?? []).length > 0) ? (
                    <div
                      style={{
                        border: "1px solid #dbeafe",
                        borderRadius: 14,
                        background: "#f8fbff",
                        color: "#475569",
                        padding: 14,
                        lineHeight: 1.6,
                      }}
                    >
                      <strong style={{ display: "block", color: "#0f172a", marginBottom: 4 }}>
                        No learning blocks planned yet.
                      </strong>
                      <span>Use a day below to add the first block for that date.</span>
                    </div>
                  ) : null}

                  <div
                    className={
                      calendarBoardView === "week" ? "mylearna-calendar-week-grid" : undefined
                    }
                    style={{
                      display: "grid",
                      gap: calendarBoardView === "month" ? 8 : 12,
                      gridTemplateColumns:
                        calendarBoardView === "month"
                          ? "repeat(7, minmax(0, 1fr))"
                          : liveWeekView === "school"
                            ? "repeat(5, minmax(0, 1fr))"
                            : "repeat(7, minmax(220px, 1fr))",
                      minWidth:
                        calendarBoardView === "week" && liveWeekView === "full"
                          ? 1640
                          : undefined,
                    }}
                  >
                    {calendarBoardView === "month"
                      ? WEEKDAY_OPTIONS.map((day) => (
                          <div
                            key={day.value}
                            style={{
                              color: "#64748b",
                              fontSize: 12,
                              fontWeight: 800,
                              textAlign: "center",
                              textTransform: "uppercase",
                            }}
                          >
                            {day.label.slice(0, 3)}
                          </div>
                        ))
                      : null}

                    {calendarBoardDates.map((dateValue) => {
                      const dayItems = itemsByDate.get(dateValue) ?? [];
                      const isToday = dateValue === getTodayDate();
                      const isOutsideSelectedMonth =
                        calendarBoardView === "month" &&
                        getMonthStart(dateValue) !== selectedMonthStart;
                      const emptyZoneSurfaceId = `calendar-board-empty-${dateValue}`;

                      return (
                        <div
                          className={
                            calendarBoardView === "week" ? "mylearna-calendar-day-card" : undefined
                          }
                          key={dateValue}
                          style={{
                            border: `1px solid ${isToday ? "#a78bfa" : "#dbeafe"}`,
                            borderRadius: calendarBoardView === "month" ? 14 : 16,
                            padding: calendarBoardView === "month" ? 10 : 14,
                            background: isOutsideSelectedMonth
                              ? "#f8fafc"
                              : isToday
                                ? "#faf5ff"
                                : "#f8fbff",
                            display: "grid",
                            gap: 10,
                            alignContent: "start",
                            minHeight: calendarBoardView === "month" ? 132 : undefined,
                            opacity: isOutsideSelectedMonth ? 0.62 : 1,
                          }}
                        >
                          <div
                            className={
                              calendarBoardView === "week"
                                ? "mylearna-calendar-day-header"
                                : undefined
                            }
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                              alignItems: "flex-start",
                            }}
                          >
                            <div style={{ display: "grid", gap: 2 }}>
                              <strong style={{ color: "#0f172a", fontSize: 14 }}>
                                {calendarBoardView === "month"
                                  ? formatDateLabel(dateValue)
                                  : formatLongDateLabel(dateValue)}
                              </strong>
                              {dayItems.length ? (
                                <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
                                  {dayItems.length} block{dayItems.length === 1 ? "" : "s"}
                                </span>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              style={{
                                ...mutedButtonStyle,
                                padding: calendarBoardView === "month" ? "6px 8px" : "8px 10px",
                                fontSize: 12,
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                openCreatePopover(dateValue);
                              }}
                            >
                              Add block
                            </button>
                          </div>

                          {dayItems.length ? (
                            <div style={{ display: "grid", gap: 8 }}>
                              {dayItems
                                .slice(0, calendarBoardView === "month" ? 3 : dayItems.length)
                                .map((item) => {
                                  const learnerLabel =
                                    learnerOptions.find((option) => option.value === item.learnerId)
                                      ?.label || "Whole family";
                                  const programLabel =
                                    programOptions.find((option) => option.value === item.programId)
                                      ?.label ?? null;
                                  const segmentLabel =
                                    programSegments.find(
                                      (segment) => segment.id === item.programSegmentId,
                                    )?.title ?? null;
                                  const blockSurfaceId = `calendar-board-block-${item.id}`;

                                  return (
                                    <div
                                      key={item.id}
                                      role="button"
                                      tabIndex={0}
                                      style={{
                                        ...getClickableCardStyle(
                                          activeSurfaceId === blockSurfaceId,
                                        ),
                                        padding: calendarBoardView === "month" ? 9 : 12,
                                      }}
                                      onMouseEnter={() => setActiveSurfaceId(blockSurfaceId)}
                                      onMouseLeave={() =>
                                        setActiveSurfaceId((current) =>
                                          current === blockSurfaceId ? null : current,
                                        )
                                      }
                                      onFocus={() => setActiveSurfaceId(blockSurfaceId)}
                                      onBlur={() =>
                                        setActiveSurfaceId((current) =>
                                          current === blockSurfaceId ? null : current,
                                        )
                                      }
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                          event.preventDefault();
                                          openEditPopover(item);
                                        }
                                      }}
                                      onClick={() => openEditPopover(item)}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          gap: 8,
                                          alignItems: "center",
                                          flexWrap: "wrap",
                                        }}
                                      >
                                        <strong style={{ color: "#0f172a", fontSize: 14 }}>
                                          {item.title}
                                        </strong>
                                        {calendarBoardView === "week" ? (
                                          <span
                                            style={{
                                              fontSize: 12,
                                              color:
                                                item.sourceType === "manual"
                                                  ? "#64748b"
                                                  : "#1d4ed8",
                                              fontWeight: 700,
                                            }}
                                          >
                                            {getSourceLabel(item.sourceType)}
                                          </span>
                                        ) : null}
                                      </div>
                                      <div style={{ color: "#475569", fontSize: 13 }}>
                                        {formatCalendarTimeRange(item.startsAt, item.endsAt)}
                                      </div>
                                      <div style={{ color: "#64748b", fontSize: 13 }}>
                                        {learnerLabel}
                                        {item.learningArea ? ` - ${item.learningArea}` : ""}
                                      </div>
                                      {calendarBoardView === "week" &&
                                      (programLabel || segmentLabel) ? (
                                        <div style={{ color: "#64748b", fontSize: 13 }}>
                                          {programLabel ? `Program: ${programLabel}` : ""}
                                          {programLabel && segmentLabel ? " - " : ""}
                                          {segmentLabel ? `Week / segment: ${segmentLabel}` : ""}
                                        </div>
                                      ) : null}
                                      {calendarBoardView === "week" ? (
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                          <button
                                            type="button"
                                            style={mutedButtonStyle}
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              openEditPopover(item);
                                            }}
                                          >
                                            Edit
                                          </button>
                                          <button
                                            type="button"
                                            style={dangerButtonStyle}
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              setPendingDelete({ type: "calendar-item", item });
                                            }}
                                          >
                                            Delete
                                          </button>
                                          <button
                                            type="button"
                                            style={mutedButtonStyle}
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              void handleCalendarCompletionToggle(item);
                                            }}
                                            disabled={completionUpdatingId === item.id}
                                          >
                                            {item.completedAt ? "Mark not complete" : "Mark complete"}
                                          </button>
                                          {evidenceByCalendarItemId.has(item.id) ? (
                                            <Link
                                              href={`${buildCalendarCaptureHref(item)}&evidence_entry_id=${encodeURIComponent(evidenceByCalendarItemId.get(item.id) ?? "")}`}
                                              onClick={(event) => event.stopPropagation()}
                                              style={{ color: "#1d4ed8", fontWeight: 700, fontSize: 13, alignSelf: "center" }}
                                            >
                                              View capture
                                            </Link>
                                          ) : (
                                            <Link
                                              href={buildCalendarCaptureHref(item)}
                                              onClick={(event) => event.stopPropagation()}
                                              style={{ color: "#1d4ed8", fontWeight: 700, fontSize: 13, alignSelf: "center" }}
                                            >
                                              Capture this moment
                                            </Link>
                                          )}
                                        </div>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              {calendarBoardView === "month" && dayItems.length > 3 ? (
                                <button
                                  type="button"
                                  style={{
                                    border: "1px solid #cbd5e1",
                                    borderRadius: 10,
                                    background: "#ffffff",
                                    color: "#475569",
                                    padding: "7px 9px",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    textAlign: "left",
                                  }}
                                  onClick={() => {
                                    setCalendarBoardView("week");
                                    setSelectedWeekStart(getWeekStart(dateValue));
                                  }}
                                >
                                  {dayItems.length - 3} more block
                                  {dayItems.length - 3 === 1 ? "" : "s"}
                                </button>
                              ) : null}
                            </div>
                          ) : (
                            <button
                              type="button"
                              className={
                                calendarBoardView === "week"
                                  ? "mylearna-calendar-day-empty-action"
                                  : undefined
                              }
                              style={{
                                ...getInteractiveZoneStyle(
                                  activeSurfaceId === emptyZoneSurfaceId,
                                ),
                                padding: calendarBoardView === "month" ? "12px 10px" : "16px 14px",
                              }}
                              onMouseEnter={() => setActiveSurfaceId(emptyZoneSurfaceId)}
                              onMouseLeave={() =>
                                setActiveSurfaceId((current) =>
                                  current === emptyZoneSurfaceId ? null : current,
                                )
                              }
                              onFocus={() => setActiveSurfaceId(emptyZoneSurfaceId)}
                              onBlur={() =>
                                setActiveSurfaceId((current) =>
                                  current === emptyZoneSurfaceId ? null : current,
                                )
                              }
                              onClick={() => openCreatePopover(dateValue)}
                            >
                              <strong style={{ color: "#0f172a", fontSize: 14 }}>Add block</strong>
                              {calendarBoardView === "week" ? (
                                <span
                                  className="mylearna-calendar-empty-repeated-copy"
                                  style={{ color: "#475569", lineHeight: 1.5 }}
                                >
                                  No learning blocks planned yet.
                                </span>
                              ) : null}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </section>
            ) : null}

            {!firstSetupMode ? (
            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>What this means</h2>
                  <p style={{ ...secondaryTextStyle, marginTop: 8 }}>
                    Keep the planning terms. Use the short notes below when you need a quick
                    reminder of what belongs where.
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    alignItems: "start",
                  }}
                >
                  <div style={helperCardStyle}>
                    <strong style={{ color: "#0f172a" }}>Learning period</strong>
                    <p style={{ ...secondaryTextStyle, margin: 0 }}>
                      A learning period is the span of time you want to plan inside, such as a
                      term, semester, unit block, or custom period.
                    </p>
                  </div>
                  <div style={helperCardStyle}>
                    <strong style={{ color: "#0f172a" }}>Master week</strong>
                    <p style={{ ...secondaryTextStyle, margin: 0 }}>
                      Use Master week when you want to set up a repeatable weekly pattern. You
                      can then apply it to an actual week and adjust that week without changing
                      the master.
                    </p>
                  </div>
                  <div style={helperCardStyle}>
                    <strong style={{ color: "#0f172a" }}>This week</strong>
                    <p style={{ ...secondaryTextStyle, margin: 0 }}>
                      Use This week for the real week you are working in now. Changes here
                      affect this week only.
                    </p>
                  </div>
                </div>

                <div style={helperCardStyle}>
                  <strong style={{ color: "#0f172a" }}>What happens next</strong>
                  <p style={{ ...secondaryTextStyle, margin: 0 }}>
                    Planned blocks appear in My Day, where you can follow the day and capture
                    what happened.
                  </p>
                </div>
              </div>
            </section>
            ) : null}

            <section
              style={{
                ...cardStyle,
                background: "#f8fafc",
                borderColor: "#dbe3ee",
              }}
            >
              <div
                style={{ display: "grid", gap: shouldShowLearningPeriodsManagement ? 16 : 0 }}
              >
                {hasExistingPlanningSetup ? (
                  <button
                    type="button"
                    onClick={() => setLearningPeriodsOpen((current) => !current)}
                    aria-expanded={learningPeriodsOpen}
                    aria-controls="planning-setup-management-panel"
                    style={{
                      width: "100%",
                      border: "1px solid #cbd5e1",
                      borderRadius: 18,
                      background: "#ffffff",
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 14,
                      alignItems: "center",
                      flexWrap: "wrap",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ display: "grid", gap: 4, minWidth: 0 }}>
                      <span style={{ color: "#0f172a", fontSize: 16, fontWeight: 850 }}>
                        Planning setup
                      </span>
                      <span style={{ color: "#475569", fontSize: 14, lineHeight: 1.5 }}>
                        {learningPeriodsSummary}
                      </span>
                    </span>
                    <span
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        background: learningPeriodsOpen ? "#e2e8f0" : "#dbeafe",
                        color: learningPeriodsOpen ? "#334155" : "#1d4ed8",
                        fontSize: 13,
                        fontWeight: 850,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {learningPeriodsOpen ? "Hide term dates" : "Edit term dates"}
                    </span>
                  </button>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 14,
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                      <h2 style={{ margin: 0, color: "#0f172a" }}>Planning setup</h2>
                      <p style={{ ...secondaryTextStyle, margin: 0 }}>
                        Learning periods, term dates, and year settings.
                      </p>
                      <p style={{ ...secondaryTextStyle, margin: 0 }}>
                        {learningPeriodsSummary}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        background: "#dbeafe",
                        color: "#1d4ed8",
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      Setup needed
                    </span>
                  </div>
                )}

                {shouldShowLearningPeriodsManagement ? (
                <div
                  id="planning-setup-management-panel"
                  style={{
                    display: "flex",
                    gap: 16,
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    id="learning-year-setup"
                    data-guidance-id="calendar-learning-year"
                    style={{
                      ...subCardStyle,
                      gap: 12,
                      flex: "1 1 320px",
                      minWidth: 0,
                      maxWidth: 360,
                      alignSelf: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "grid", gap: 6 }}>
                        <strong style={{ color: "#0f172a" }}>1. Choose your year</strong>
                        <p style={secondaryTextStyle}>
                          Start with the bigger date window you want the planner to work
                          inside.
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          style={mutedButtonStyle}
                          onClick={() => setShowYearComposer((current) => !current)}
                          disabled={Boolean(editingAcademicYearId)}
                        >
                          {editingAcademicYearId
                            ? "Editing year"
                            : shouldShowYearComposer
                              ? "Hide year form"
                              : "Add year"}
                        </button>
                        <button
                          type="button"
                          style={mutedButtonStyle}
                          onClick={() => void reloadSetupData()}
                          disabled={setupLoading || submitting}
                        >
                          {setupLoading ? "Refreshing..." : "Refresh"}
                        </button>
                      </div>
                    </div>

                    {shouldShowYearComposer ? (
                      <form onSubmit={handleAcademicYearSubmit} style={{ display: "grid", gap: 12 }}>
                        <div
                          style={{
                            display: "grid",
                            gap: 12,
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                          }}
                        >
                          <div style={{ display: "grid", gap: 6 }}>
                            <label style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>
                              Learning year name
                            </label>
                            <input
                              value={yearTitle}
                              onChange={(event) => setYearTitle(event.target.value)}
                              placeholder={getLearningYearNameSuggestion(yearStartsOn, yearEndsOn)}
                              style={inputStyle}
                            />
                          </div>
                          <div style={{ display: "grid", gap: 6 }}>
                            <label style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>
                              Country
                            </label>
                            {firstSetupMode && !editingAcademicYearId ? (
                              <div style={subtleFieldCardStyle}>
                                <strong style={{ color: "#0f172a" }}>
                                  {getSignupCountryLabel(yearCountryCode) || "Not set"}
                                </strong>
                                <span style={{ color: "#64748b", fontSize: 12 }}>
                                  From My Settings
                                </span>
                              </div>
                            ) : (
                              <input
                                value={yearCountryCode}
                                onChange={(event) =>
                                  setYearCountryCode(event.target.value.toUpperCase())
                                }
                                placeholder="Country"
                                style={inputStyle}
                              />
                            )}
                            {yearCountryCode && !firstSetupMode ? (
                              <span style={{ color: "#64748b", fontSize: 12 }}>
                                {getSignupCountryLabel(yearCountryCode)}
                              </span>
                            ) : null}
                          </div>
                          <div style={{ display: "grid", gap: 6 }}>
                            <label style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>
                              State or region
                            </label>
                            {firstSetupMode && !editingAcademicYearId ? (
                              <div style={subtleFieldCardStyle}>
                                <strong style={{ color: "#0f172a" }}>
                                  {getSignupJurisdictionLabel(
                                    yearCountryCode,
                                    yearJurisdictionCode,
                                  ) || "Not set"}
                                </strong>
                                <span style={{ color: "#64748b", fontSize: 12 }}>
                                  From My Settings
                                </span>
                              </div>
                            ) : (
                              <input
                                value={yearJurisdictionCode}
                                onChange={(event) => setYearJurisdictionCode(event.target.value)}
                                placeholder="State or region"
                                style={inputStyle}
                              />
                            )}
                            {yearJurisdictionCode && !firstSetupMode ? (
                              <span style={{ color: "#64748b", fontSize: 12 }}>
                                {getSignupJurisdictionLabel(yearCountryCode, yearJurisdictionCode)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gap: 12,
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                          }}
                        >
                          <div style={{ display: "grid", gap: 6 }}>
                            <label style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>
                              Start date
                            </label>
                            <input
                              type="date"
                              value={yearStartsOn}
                              max={yearEndsOn}
                              onChange={(event) => {
                                const nextStart = event.target.value;
                                setYearStartsOn(nextStart);
                                if (nextStart > yearEndsOn) setYearEndsOn(nextStart);
                              }}
                              style={inputStyle}
                            />
                          </div>
                          <div style={{ display: "grid", gap: 6 }}>
                            <label style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>
                              End date
                            </label>
                            <input
                              type="date"
                              value={yearEndsOn}
                              min={yearStartsOn}
                              onChange={(event) => setYearEndsOn(event.target.value)}
                              style={inputStyle}
                            />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button type="submit" style={buttonStyle} disabled={submitting}>
                            {submitting
                              ? "Saving..."
                              : editingAcademicYearId
                                ? "Save changes"
                                : "Save year"}
                          </button>
                          {editingAcademicYearId ? (
                            <button
                              type="button"
                              style={mutedButtonStyle}
                              onClick={closeAcademicYearEditor}
                              disabled={submitting}
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>
                        {pendingAcademicYearUpdate ? (
                          <div
                            role="alertdialog"
                            aria-label="Confirm learning year date change"
                            style={{
                              border: "1px solid #fcd34d",
                              borderRadius: 12,
                              padding: 12,
                              background: "#fffbeb",
                              display: "grid",
                              gap: 10,
                            }}
                          >
                            <strong style={{ color: "#92400e" }}>
                              Check the date change before saving
                            </strong>
                            <span style={{ color: "#78350f", lineHeight: 1.55 }}>
                              This learning year has existing periods or calendar blocks. Changing
                              its dates may place those records outside the year, so review them
                              after saving.
                            </span>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <button
                                type="button"
                                style={buttonStyle}
                                onClick={() => void confirmAcademicYearDateChange()}
                                disabled={submitting}
                              >
                                Save changes
                              </button>
                              <button
                                type="button"
                                style={mutedButtonStyle}
                                onClick={() => setPendingAcademicYearUpdate(null)}
                                disabled={submitting}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </form>
                    ) : null}

                    {academicYears.length ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        {academicYears.map((year) => {
                          const yearPeriods = learningPeriods.filter(
                            (period) => period.academicYearId === year.id,
                          );
                          const yearLearningPeriods = yearPeriods.filter(
                            (period) => !isBreakLearningPeriod(period),
                          );
                          const yearBreaks = yearPeriods.filter((period) =>
                            isBreakLearningPeriod(period),
                          );
                          const isSelected = selectedAcademicYearId === year.id;

                          return (
                            <div
                              key={year.id}
                              style={{
                                border: isSelected ? "2px solid #1d4ed8" : "1px solid #cbd5e1",
                                borderRadius: 14,
                                background: "#ffffff",
                                padding: 12,
                                display: "grid",
                                gap: 6,
                                textAlign: "left",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 12,
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                }}
                              >
                                <button
                                  type="button"
                                  style={{
                                    border: 0,
                                    padding: 0,
                                    background: "transparent",
                                    color: "#0f172a",
                                    fontWeight: 800,
                                    fontSize: 15,
                                    textAlign: "left",
                                    cursor: "pointer",
                                  }}
                                  onClick={() => setSelectedAcademicYearId(year.id)}
                                >
                                  {year.title}
                                </button>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <span
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: 999,
                                      background: isSelected ? "#dbeafe" : "#e2e8f0",
                                      color: isSelected ? "#1d4ed8" : "#475569",
                                      fontSize: 12,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {isSelected ? "Selected" : "Use this year"}
                                  </span>
                                  <button
                                    type="button"
                                    style={mutedButtonStyle}
                                    onClick={() => openAcademicYearEditor(year)}
                                    disabled={submitting}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    style={dangerButtonStyle}
                                    onClick={() => setPendingDelete({ type: "academic-year", year })}
                                    disabled={submitting}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              <div style={{ color: "#475569" }}>
                                {formatWeekRangeLabel(year.startsOn, year.endsOn)}
                              </div>
                              <div style={{ color: "#64748b", fontSize: 13 }}>
                                {yearLearningPeriods.length} learning period{yearLearningPeriods.length === 1 ? "" : "s"}
                                {yearBreaks.length
                                  ? ` - ${yearBreaks.length} break${yearBreaks.length === 1 ? "" : "s"}`
                                  : ""}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={secondaryTextStyle}>
                        No year set yet. Add one before creating terms or unit blocks.
                      </p>
                    )}
                  </div>

                  {shouldShowTermSetup ? (
                  <div
                    id="learning-period-setup"
                    data-guidance-id="calendar-first-term"
                    style={{
                      ...subCardStyle,
                      flex: "1.45 1 520px",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "grid", gap: 6 }}>
                        <strong style={{ color: "#0f172a" }}>2. Add your learning periods</strong>
                        <p style={secondaryTextStyle}>
                          Choose the year, then add the learning terms you do want planned.
                          Breaks and holidays stay separate.
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          style={mutedButtonStyle}
                          onClick={() => {
                            if (
                              shouldShowLearningPeriodComposer &&
                              learningPeriodComposerMode === "term"
                            ) {
                              setShowLearningPeriodComposer(false);
                            } else {
                              openLearningPeriodComposer("term");
                            }
                          }}
                          disabled={!selectedAcademicYear}
                        >
                          {shouldShowLearningPeriodComposer &&
                          learningPeriodComposerMode === "term"
                            ? "Hide term form"
                            : "Add learning period"}
                        </button>
                        <button
                          type="button"
                          style={{
                            ...mutedButtonStyle,
                            borderColor: "#fcd34d",
                            color: "#92400e",
                            background: "#fffbeb",
                          }}
                          onClick={() => {
                            if (
                              shouldShowLearningPeriodComposer &&
                              learningPeriodComposerMode === "break"
                            ) {
                              setShowLearningPeriodComposer(false);
                            } else {
                              openLearningPeriodComposer("break");
                            }
                          }}
                          disabled={!selectedAcademicYear || !hasRealLearningPeriod}
                        >
                          {!hasRealLearningPeriod
                            ? "Add a learning period first"
                            : shouldShowLearningPeriodComposer &&
                                learningPeriodComposerMode === "break"
                              ? "Hide break form"
                              : "Add a break / holiday"}
                        </button>
                      </div>
                    </div>

                    {selectedAcademicYear ? (
                      <div
                        style={{
                          border: "1px solid #cbd5e1",
                          borderRadius: 14,
                          padding: 14,
                          background: "#ffffff",
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <strong style={{ color: "#0f172a" }}>{selectedAcademicYear.title}</strong>
                        <div style={{ color: "#475569" }}>
                          {formatWeekRangeLabel(
                            selectedAcademicYear.startsOn,
                            selectedAcademicYear.endsOn,
                          )}
                        </div>
                        <div style={{ color: "#64748b", fontSize: 13 }}>
                          Example periods: Term 1, Autumn term, Semester 1, Unit block
                        </div>
                      </div>
                    ) : (
                      <p style={secondaryTextStyle}>
                        Pick a year first so your periods have a clear home.
                      </p>
                    )}

                    {shouldShowLearningPeriodComposer ? (
                      <form onSubmit={handleLearningPeriodSubmit} style={{ display: "grid", gap: 12 }}>
                        <div
                          style={{
                            border:
                              learningPeriodComposerMode === "break"
                                ? "1px solid #fcd34d"
                                : "1px solid #bfdbfe",
                            borderRadius: 14,
                            padding: 12,
                            background:
                              learningPeriodComposerMode === "break" ? "#fffbeb" : "#eff6ff",
                            display: "grid",
                            gap: 4,
                          }}
                        >
                          <strong style={{ color: "#0f172a" }}>
                            {learningPeriodComposerMode === "break"
                              ? "Add a break / holiday"
                              : "Add a learning term"}
                          </strong>
                          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                            {learningPeriodComposerMode === "break"
                              ? "Breaks pause regular planning inside a term."
                              : "Use this for Term 1, Semester 1, or any span where you do want master blocks added."}
                          </p>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gap: 12,
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                          }}
                        >
                          <div style={{ display: "grid", gap: 6 }}>
                            <label style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>
                              Learning year
                            </label>
                            <select
                              value={selectedAcademicYearId}
                              onChange={(event) => setSelectedAcademicYearId(event.target.value)}
                              style={inputStyle}
                            >
                              <option value="">Choose a year</option>
                              {academicYears.map((year) => (
                                <option key={year.id} value={year.id}>
                                  {year.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div style={{ display: "grid", gap: 6 }}>
                            <label style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>
                              {learningPeriodComposerMode === "break"
                                ? "Break name"
                                : "Learning period name"}
                            </label>
                            <input
                              value={periodTitle}
                              onChange={(event) => setPeriodTitle(event.target.value)}
                              placeholder={
                                learningPeriodComposerMode === "break"
                                  ? "Winter holidays"
                                  : "Term 1"
                              }
                              style={inputStyle}
                            />
                          </div>
                          {learningPeriodComposerMode === "break" ? (
                            <input type="hidden" value="break" readOnly />
                          ) : (
                            <div style={{ display: "grid", gap: 6 }}>
                              <label style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>
                                Period type
                              </label>
                              <select
                                value={periodType}
                                onChange={(event) =>
                                  setPeriodType(event.target.value as CleanLearningPeriodType)
                                }
                                style={inputStyle}
                              >
                                {visibleComposerPeriodTypes.map((option) => (
                                  <option key={option} value={option}>
                                    {formatPeriodTypeLabel(option, false)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gap: 12,
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                          }}
                        >
                          <div style={{ display: "grid", gap: 6 }}>
                            <label style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>
                              Start date
                            </label>
                            <input
                              type="date"
                              value={periodStartsOn}
                              min={selectedAcademicYear?.startsOn}
                              max={selectedAcademicYear?.endsOn}
                              onChange={(event) => {
                                const nextStart = event.target.value;
                                setPeriodStartsOn(nextStart);
                                if (nextStart > periodEndsOn) setPeriodEndsOn(nextStart);
                              }}
                              style={inputStyle}
                            />
                          </div>
                          <div style={{ display: "grid", gap: 6 }}>
                            <label style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>
                              End date
                            </label>
                            <input
                              type="date"
                              value={periodEndsOn}
                              min={periodStartsOn}
                              max={selectedAcademicYear?.endsOn}
                              onChange={(event) => setPeriodEndsOn(event.target.value)}
                              style={inputStyle}
                            />
                          </div>
                        </div>
                        {learningPeriodComposerMode === "break" ? (
                          <div style={subtleFieldCardStyle}>
                            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                              Only use this for school holidays, public holidays, travel
                              breaks, or weeks you do not want learning blocks added.
                            </p>
                          </div>
                        ) : null}
                        <div style={{ display: "grid", gap: 6 }}>
                          <label style={{ color: "#334155", fontSize: 13, fontWeight: 800 }}>
                            Notes
                          </label>
                          <textarea
                            value={periodNotes}
                            onChange={(event) => setPeriodNotes(event.target.value)}
                            placeholder={
                              learningPeriodComposerMode === "break"
                                ? "Optional: travel week or public holidays"
                                : "Optional notes"
                            }
                            style={textAreaStyle}
                          />
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            type="submit"
                            style={buttonStyle}
                            disabled={submitting || !selectedAcademicYearId}
                          >
                            {submitting
                              ? "Saving..."
                              : learningPeriodComposerMode === "break"
                                ? "Save break"
                                : "Save term"}
                          </button>
                        </div>
                      </form>
                    ) : null}

                    {visibleLearningPeriods.length ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        {visibleLearningPeriods.map((period) => {
                          const isBreakPeriod =
                            period.isBreak || period.periodType === "break";
                          const isEditing = editingLearningPeriodId === period.id;

                          return (
                            <div
                              key={period.id}
                              style={{
                                border: isBreakPeriod
                                  ? "1px solid #fcd34d"
                                  : "1px solid #cbd5e1",
                                borderRadius: 14,
                                padding: 14,
                                background: isBreakPeriod ? "#fffbeb" : "#ffffff",
                                display: "grid",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 12,
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                }}
                              >
                                <strong style={{ color: "#0f172a" }}>{period.title}</strong>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <span
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: 999,
                                      background: isBreakPeriod ? "#fef3c7" : "#dbeafe",
                                      color: isBreakPeriod ? "#92400e" : "#1d4ed8",
                                      fontSize: 12,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {isBreakPeriod
                                      ? "Break / holiday"
                                      : "Learning term"}
                                  </span>
                                  <button
                                    type="button"
                                    style={mutedButtonStyle}
                                    onClick={() =>
                                      isEditing
                                        ? closeLearningPeriodEditor()
                                        : openLearningPeriodEditor(period)
                                    }
                                    disabled={submitting}
                                  >
                                    {isEditing ? "Cancel edit" : "Edit"}
                                  </button>
                                  <button
                                    type="button"
                                    style={dangerButtonStyle}
                                    onClick={() => setPendingDelete({ type: "learning-period", period })}
                                    disabled={submitting}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              <div style={{ color: "#475569" }}>
                                {formatWeekRangeLabel(period.startsOn, period.endsOn)}
                              </div>
                              <div
                                style={{
                                  color: isBreakPeriod ? "#92400e" : "#64748b",
                                  fontSize: 13,
                                  lineHeight: 1.6,
                                }}
                              >
                                {isBreakPeriod
                                  ? "Learning is paused inside these dates."
                                  : "Master blocks can be planned inside these dates."}
                              </div>
                              {period.notes ? (
                                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                                  {period.notes}
                                </div>
                              ) : null}
                              {isEditing ? (
                                <form
                                  onSubmit={handleLearningPeriodUpdate}
                                  style={{
                                    ...subtleFieldCardStyle,
                                    background: "#ffffff",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "inline-flex",
                                      border: "1px solid #cbd5e1",
                                      borderRadius: 12,
                                      padding: 4,
                                      background: "#f8fafc",
                                      gap: 4,
                                      width: "fit-content",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      style={{
                                        ...buttonStyle,
                                        padding: "8px 12px",
                                        background: !editingLearningPeriodIsBreak
                                          ? "#0f172a"
                                          : "#ffffff",
                                        color: !editingLearningPeriodIsBreak
                                          ? "#ffffff"
                                          : "#0f172a",
                                        borderColor: !editingLearningPeriodIsBreak
                                          ? "#0f172a"
                                          : "#ffffff",
                                      }}
                                      onClick={() => {
                                        setEditingLearningPeriodIsBreak(false);
                                        if (editingLearningPeriodType === "break") {
                                          setEditingLearningPeriodType("term");
                                        }
                                      }}
                                    >
                                      Learning term
                                    </button>
                                    <button
                                      type="button"
                                      style={{
                                        ...buttonStyle,
                                        padding: "8px 12px",
                                        background: editingLearningPeriodIsBreak
                                          ? "#92400e"
                                          : "#ffffff",
                                        color: editingLearningPeriodIsBreak
                                          ? "#ffffff"
                                          : "#92400e",
                                        borderColor: editingLearningPeriodIsBreak
                                          ? "#92400e"
                                          : "#ffffff",
                                      }}
                                      onClick={() => setEditingLearningPeriodIsBreak(true)}
                                    >
                                      Break / holiday
                                    </button>
                                  </div>

                                  <div
                                    style={{
                                      display: "grid",
                                      gap: 12,
                                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                    }}
                                  >
                                    <input
                                      value={editingLearningPeriodTitle}
                                      onChange={(event) =>
                                        setEditingLearningPeriodTitle(event.target.value)
                                      }
                                      placeholder="Title"
                                      style={inputStyle}
                                    />
                                    {editingLearningPeriodIsBreak ? (
                                      <div
                                        style={{
                                          ...subtleFieldCardStyle,
                                          justifyContent: "center",
                                          color: "#92400e",
                                        }}
                                      >
                                        <strong>Break / holiday</strong>
                                        <p style={{ margin: 0, lineHeight: 1.6 }}>
                                          Learning blocks will not be planned inside these dates.
                                        </p>
                                      </div>
                                    ) : (
                                      <select
                                        value={editingLearningPeriodType}
                                        onChange={(event) =>
                                          setEditingLearningPeriodType(
                                            event.target.value as CleanLearningPeriodType,
                                          )
                                        }
                                        style={inputStyle}
                                      >
                                        {visibleComposerPeriodTypes.map((option) => (
                                          <option key={option} value={option}>
                                            {formatPeriodTypeLabel(option, false)}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      display: "grid",
                                      gap: 12,
                                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                    }}
                                  >
                                    <input
                                      type="date"
                                      value={editingLearningPeriodStartsOn}
                                      min={editingAcademicYear?.startsOn}
                                      max={editingAcademicYear?.endsOn}
                                      onChange={(event) => {
                                        const nextStart = event.target.value;
                                        setEditingLearningPeriodStartsOn(nextStart);
                                        if (nextStart > editingLearningPeriodEndsOn) {
                                          setEditingLearningPeriodEndsOn(nextStart);
                                        }
                                      }}
                                      style={inputStyle}
                                    />
                                    <input
                                      type="date"
                                      value={editingLearningPeriodEndsOn}
                                      min={editingLearningPeriodStartsOn}
                                      max={editingAcademicYear?.endsOn}
                                      onChange={(event) =>
                                        setEditingLearningPeriodEndsOn(event.target.value)
                                      }
                                      style={inputStyle}
                                    />
                                  </div>

                                  <textarea
                                    value={editingLearningPeriodNotes}
                                    onChange={(event) =>
                                      setEditingLearningPeriodNotes(event.target.value)
                                    }
                                    placeholder="Optional notes"
                                    style={textAreaStyle}
                                  />

                                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                    <button
                                      type="submit"
                                      style={buttonStyle}
                                      disabled={submitting}
                                    >
                                      {submitting ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                      type="button"
                                      style={mutedButtonStyle}
                                      onClick={closeLearningPeriodEditor}
                                      disabled={submitting}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : selectedAcademicYear ? (
                      <p style={secondaryTextStyle}>
                        No learning periods yet for this year. Add your first term or break
                        above.
                      </p>
                    ) : null}
                  </div>
                  ) : (
                    <div
                      data-guidance-id="calendar-first-term"
                      style={{
                        ...subCardStyle,
                        flex: "1.45 1 520px",
                        minWidth: 0,
                        background: "#f8fafc",
                      }}
                    >
                      <strong style={{ color: "#0f172a" }}>Next: add the first term</strong>
                      <p style={secondaryTextStyle}>
                        Save the learning year first. Then MyLearna will show the first term setup.
                      </p>
                    </div>
                  )}
                </div>
                ) : null}
              </div>
            </section>

            {firstSetupMode ? (
              <section data-guidance-id="calendar-next-day" style={cardStyle}>
                {calendarHandoffState === "year" ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    <div>
                      <h2 style={{ margin: 0, color: "#0f172a" }}>Set your learning year</h2>
                      <p style={{ ...secondaryTextStyle, marginTop: 8 }}>
                        Choose the date range MyLearna should plan inside.
                      </p>
                    </div>
                    <div>
                      <button type="button" style={buttonStyle} onClick={focusLearningYearSetup}>
                        Save learning year
                      </button>
                    </div>
                  </div>
                ) : calendarHandoffState === "period" ||
                  calendarHandoffState === "period-after-break" ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    <div>
                      <h2 style={{ margin: 0, color: "#0f172a" }}>
                        Add your first learning period
                      </h2>
                      <p style={{ ...secondaryTextStyle, marginTop: 8 }}>
                        {calendarHandoffState === "period-after-break"
                          ? "You've added a break or holiday. Now add the first learning period where regular learning will happen."
                          : "Add the first term or learning period inside your learning year. Breaks and holidays can be added afterwards, but they do not replace a learning period."}
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        style={buttonStyle}
                        onClick={focusLearningPeriodSetup}
                      >
                        Add learning period
                      </button>
                    </div>
                  </div>
                ) : calendarHandoffState === "master-week" ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    <div>
                      <h2 style={{ margin: 0, color: "#0f172a" }}>
                        Add your first weekly learning block
                      </h2>
                      <p style={{ ...secondaryTextStyle, marginTop: 8 }}>
                        Add one weekly block to create a simple rhythm that MyLearna can use to
                        organise your learning days. You can adjust it later.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        style={buttonStyle}
                        onClick={focusMasterWeekTemplate}
                      >
                        Add weekly learning block
                      </button>
                      <button
                        type="button"
                        style={mutedButtonStyle}
                        onClick={focusBreakSetup}
                      >
                        Add a break or holiday
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    <div>
                      <h2 style={{ margin: 0, color: "#0f172a" }}>
                        Your first learning plan is ready
                      </h2>
                      <p style={{ ...secondaryTextStyle, marginTop: 8 }}>
                        Your learning year, learning period and first weekly block are ready.
                        My Day can now show what is planned.
                      </p>
                    </div>
                    <button
                      type="button"
                      style={buttonStyle}
                      onClick={continueToMyDayFromCalendar}
                    >
                      Continue to My Day
                    </button>
                  </div>
                )}
              </section>
            ) : null}

            {shouldShowWeeklyPlanner ? (
            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, color: "#0f172a" }}>Weekly planner</h2>
                    <p style={{ ...secondaryTextStyle, marginTop: 8 }}>
                      Open This week for day-to-day changes. Use Master week when you want
                      to update the reusable template.
                    </p>
                    <p style={{ ...secondaryTextStyle, marginTop: 8 }}>
                      School week keeps the focus on Monday to Friday. Full week includes
                      Saturday and Sunday when you need weekend planning.
                    </p>
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      border: "1px solid #cbd5e1",
                      borderRadius: 12,
                      padding: 4,
                      background: "#f8fafc",
                      gap: 4,
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        ...buttonStyle,
                        padding: "9px 14px",
                        background: planningView === "week" ? "#0f172a" : "#ffffff",
                        color: planningView === "week" ? "#ffffff" : "#0f172a",
                        borderColor: planningView === "week" ? "#0f172a" : "#ffffff",
                      }}
                      onClick={() => setPlanningView("week")}
                    >
                      This week
                    </button>
                    <button
                      type="button"
                      style={{
                        ...buttonStyle,
                        padding: "9px 14px",
                        background: planningView === "master" ? "#0f172a" : "#ffffff",
                        color: planningView === "master" ? "#ffffff" : "#0f172a",
                        borderColor: planningView === "master" ? "#0f172a" : "#ffffff",
                      }}
                      onClick={() => setPlanningView("master")}
                    >
                      Master week
                    </button>
                  </div>
                </div>

                {planningView === "master" ? (
                  <div style={{ display: "grid", gap: 16 }}>
                    <div id="master-week-template" style={subCardStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "grid", gap: 6 }}>
                          <strong style={{ color: "#0f172a" }}>Choose a master week</strong>
                          <p style={secondaryTextStyle}>
                            This is your reusable master calendar. It does not change the live
                            week until you choose to plan inside This week.
                          </p>
                        </div>
                        <button
                          type="button"
                          style={mutedButtonStyle}
                          onClick={() => setShowTemplateComposer((current) => !current)}
                        >
                          {shouldShowTemplateComposer ? "Hide master form" : "Add master week"}
                        </button>
                      </div>

                      {shouldShowTemplateComposer ? (
                        <form onSubmit={handleTemplateSubmit} style={{ display: "grid", gap: 12 }}>
                          <div
                            style={{
                              display: "grid",
                              gap: 12,
                              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            }}
                          >
                            <input
                              value={templateTitle}
                              onChange={(event) => setTemplateTitle(event.target.value)}
                              placeholder="Family master week or Maya's master week"
                              style={inputStyle}
                            />
                            <select
                              value={templateScopeType}
                              onChange={(event) => {
                                const nextValue = event.target.value as "family" | "learner";
                                setTemplateScopeType(nextValue);
                                if (nextValue === "family") {
                                  setTemplateLearnerId("");
                                }
                              }}
                              style={inputStyle}
                            >
                              <option value="family">Whole family</option>
                              <option value="learner">One learner</option>
                            </select>
                            {templateScopeType === "learner" ? (
                              <select
                                value={templateLearnerId}
                                onChange={(event) => setTemplateLearnerId(event.target.value)}
                                style={inputStyle}
                              >
                                <option value="">Choose learner</option>
                                {learnerOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : null}
                          </div>
                          <textarea
                            value={templateDescription}
                            onChange={(event) => setTemplateDescription(event.target.value)}
                            placeholder="Optional notes about how this master week works for your family"
                            style={textAreaStyle}
                          />
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button type="submit" style={buttonStyle} disabled={submitting}>
                              {submitting ? "Saving..." : "Save master week"}
                            </button>
                          </div>
                        </form>
                      ) : null}

                      {masterTemplates.length ? (
                        <div
                          style={{
                            display: "grid",
                            gap: 12,
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                          }}
                        >
                          {masterTemplates.map((template) => {
                            const learnerLabel =
                              learnerOptions.find((option) => option.value === template.learnerId)
                                ?.label || "Whole family";
                            const isSelected = selectedTemplateId === template.id;

                            return (
                              <button
                                key={template.id}
                                type="button"
                                style={{
                                  border: isSelected ? "2px solid #1d4ed8" : "1px solid #cbd5e1",
                                  borderRadius: 14,
                                  background: "#ffffff",
                                  padding: 14,
                                  display: "grid",
                                  gap: 8,
                                  textAlign: "left",
                                  cursor: "pointer",
                                }}
                                onClick={() => setSelectedTemplateId(template.id)}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <strong style={{ color: "#0f172a" }}>{template.title}</strong>
                                  <span
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: 999,
                                      background: isSelected ? "#dbeafe" : "#e2e8f0",
                                      color: isSelected ? "#1d4ed8" : "#475569",
                                      fontSize: 12,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {isSelected ? "Selected" : "Open"}
                                  </span>
                                </div>
                                <div style={{ color: "#475569" }}>
                                  {template.scopeType === "learner" ? learnerLabel : "Whole family"}
                                </div>
                                <div style={{ color: "#64748b", fontSize: 13 }}>
                                  {template.description || "Reusable master week"}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                    ) : (
                        <p style={secondaryTextStyle}>
                          No master week yet. You can still plan directly inside This week.
                        </p>
                      )}
                    </div>

                    {hasCalendarHandoff ? (
                      <div
                        style={{
                          border: "1px solid #bfdbfe",
                          borderRadius: 14,
                          padding: 14,
                          background: "#eff6ff",
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        <strong style={{ color: "#0f172a" }}>Ready to place into this week</strong>
                        <div style={{ color: "#475569", lineHeight: 1.6 }}>
                          {handoffSummary}. Choose a master week, then click inside a day to
                          place this reusable block without retyping it.
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            style={mutedButtonStyle}
                            onClick={clearCalendarHandoff}
                          >
                            Clear handoff
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {firstSetupMode && showMasterBlockHandoff && hasMasterWeekBlock ? (
                      <div
                        style={{
                          border: "1px solid #bbf7d0",
                          borderRadius: 16,
                          padding: 16,
                          background: "#f0fdf4",
                          display: "grid",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "grid", gap: 6 }}>
                          <strong style={{ color: "#0f172a", fontSize: 18 }}>
                            Your first learning plan is ready
                          </strong>
                          <p style={secondaryTextStyle}>
                            Your reusable week has started. You can add more blocks now, or
                            continue to My Day and come back later.
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            style={buttonStyle}
                            onClick={addAnotherMasterBlock}
                          >
                            Add another block
                          </button>
                          <button
                            type="button"
                            style={mutedButtonStyle}
                            onClick={continueToMyDayFromCalendar}
                          >
                            Continue to My Day
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {selectedTemplate ? (
                      <div style={subCardStyle}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ display: "grid", gap: 6 }}>
                            <strong style={{ color: "#0f172a" }}>{selectedTemplate.title}</strong>
                            <p style={secondaryTextStyle}>
                              {selectedTemplate.description ||
                                "Click a day to shape your usual week."}
                            </p>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                              alignItems: "center",
                              justifyContent: "flex-end",
                            }}
                          >
                            <div
                              style={{
                                display: "inline-flex",
                                border: "1px solid #cbd5e1",
                                borderRadius: 12,
                                padding: 4,
                                background: "#f8fafc",
                                gap: 4,
                              }}
                            >
                              <button
                                type="button"
                                style={{
                                  ...buttonStyle,
                                  padding: "8px 12px",
                                  background:
                                    masterWeekView === "school" ? "#0f172a" : "#ffffff",
                                  color:
                                    masterWeekView === "school" ? "#ffffff" : "#0f172a",
                                  borderColor:
                                    masterWeekView === "school" ? "#0f172a" : "#ffffff",
                                }}
                                onClick={() => {
                                  setMasterWeekView("school");
                                  setMasterWeekViewTouched(true);
                                }}
                              >
                                School week
                              </button>
                              <button
                                type="button"
                                style={{
                                  ...buttonStyle,
                                  padding: "8px 12px",
                                  background:
                                    masterWeekView === "full" ? "#0f172a" : "#ffffff",
                                  color:
                                    masterWeekView === "full" ? "#ffffff" : "#0f172a",
                                  borderColor:
                                    masterWeekView === "full" ? "#0f172a" : "#ffffff",
                                }}
                                onClick={() => {
                                  setMasterWeekView("full");
                                  setMasterWeekViewTouched(true);
                                }}
                              >
                                Full week
                              </button>
                            </div>
                            <div
                              style={{
                                padding: "6px 12px",
                                borderRadius: 999,
                                background: "#e2e8f0",
                                color: "#334155",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {selectedTemplate.scopeType === "learner"
                                ? learnerOptions.find(
                                    (option) => option.value === selectedTemplate.learnerId,
                                  )?.label || "Learner master week"
                                : "Whole family"}
                            </div>
                          </div>
                        </div>

                        {hasWeekendTemplateBlocks && masterWeekView === "school" ? (
                          <div
                            style={{
                              border: "1px solid #cbd5e1",
                              borderRadius: 14,
                              padding: 12,
                              background: "#ffffff",
                              color: "#475569",
                              lineHeight: 1.6,
                            }}
                          >
                            Weekend blocks are still part of this master week. Switch to Full week
                            to view or edit Saturday and Sunday.
                          </div>
                        ) : null}

                        {templateBlocksLoading ? (
                          <p style={secondaryTextStyle}>Loading your master week...</p>
                        ) : (
                          <div style={{ overflowX: masterWeekView === "school" ? "visible" : "auto", paddingBottom: 4 }}>
                            <div
                              style={{
                                display: "grid",
                                gap: 12,
                                gridTemplateColumns:
                                  masterWeekView === "school"
                                    ? "repeat(5, minmax(0, 1fr))"
                                    : "repeat(auto-fit, minmax(180px, 1fr))",
                              }}
                            >
                            {visibleMasterDays.map((day) => {
                              const dayBlocks = templateBlocksByWeekday.get(day.value) ?? [];
                              const emptyZoneSurfaceId = `master-empty-${day.value}`;

                              return (
                                <div
                                  key={day.value}
                                  style={{
                                    border: "1px solid #cbd5e1",
                                    borderRadius: 16,
                                    background: "#ffffff",
                                    padding: 14,
                                    display: "grid",
                                    gap: 12,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      gap: 8,
                                      alignItems: "center",
                                    }}
                                  >
                                    <strong style={{ color: "#0f172a" }}>{day.label}</strong>
                                    <button
                                      type="button"
                                      style={{ ...buttonStyle, padding: "8px 10px" }}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openCreateRhythmPopover(day.value);
                                      }}
                                    >
                                      Add block
                                    </button>
                                  </div>

                                  {dayBlocks.length ? (
                                    <div style={{ display: "grid", gap: 10 }}>
                                      {dayBlocks.map((block) => {
                                        const learnerLabel =
                                          learnerOptions.find(
                                            (option) => option.value === block.learnerId,
                                          )?.label || "Whole family";
                                        const programLabel =
                                          programOptions.find(
                                            (option) => option.value === block.programId,
                                          )?.label ?? null;
                                        const segmentLabel =
                                          programSegments.find(
                                            (segment) =>
                                              segment.id === block.programSegmentId,
                                          )?.title ||
                                          null;
                                        const blockSurfaceId = `master-block-${block.id}`;

                                        return (
                                          <button
                                            key={block.id}
                                            type="button"
                                            style={{
                                              ...getClickableCardStyle(
                                                activeSurfaceId === blockSurfaceId,
                                              ),
                                              textAlign: "left",
                                            }}
                                            onMouseEnter={() => setActiveSurfaceId(blockSurfaceId)}
                                            onMouseLeave={() =>
                                              setActiveSurfaceId((current) =>
                                                current === blockSurfaceId ? null : current,
                                              )
                                            }
                                            onFocus={() => setActiveSurfaceId(blockSurfaceId)}
                                            onBlur={() =>
                                              setActiveSurfaceId((current) =>
                                                current === blockSurfaceId ? null : current,
                                              )
                                            }
                                            onClick={() => openEditRhythmPopover(block)}
                                          >
                                            <strong style={{ color: "#0f172a" }}>{block.title}</strong>
                                            <div style={{ color: "#475569" }}>
                                              {formatCalendarTimeRange(block.startsAt, block.endsAt)}
                                            </div>
                                            <div style={{ color: "#64748b", fontSize: 13 }}>
                                              {learnerLabel}
                                              {block.learningArea ? ` - ${block.learningArea}` : ""}
                                            </div>
                                            {programLabel || segmentLabel ? (
                                              <div style={{ color: "#64748b", fontSize: 13 }}>
                                                {programLabel ? `Program: ${programLabel}` : ""}
                                                {programLabel && segmentLabel ? " - " : ""}
                                                {segmentLabel ? `Week / segment: ${segmentLabel}` : ""}
                                              </div>
                                            ) : null}
                                            {block.sessionLabel ? (
                                              <div style={{ color: "#64748b", fontSize: 13 }}>
                                                {block.sessionLabel}
                                              </div>
                                            ) : null}
                                          </button>
                                        );
                                      })}

                                      <button
                                        type="button"
                                        style={getInteractiveZoneStyle(
                                          activeSurfaceId === emptyZoneSurfaceId,
                                        )}
                                        onMouseEnter={() =>
                                          setActiveSurfaceId(emptyZoneSurfaceId)
                                        }
                                        onMouseLeave={() =>
                                          setActiveSurfaceId((current) =>
                                            current === emptyZoneSurfaceId ? null : current,
                                          )
                                        }
                                        onFocus={() => setActiveSurfaceId(emptyZoneSurfaceId)}
                                        onBlur={() =>
                                          setActiveSurfaceId((current) =>
                                            current === emptyZoneSurfaceId ? null : current,
                                          )
                                        }
                                        onClick={() => openCreateRhythmPopover(day.value)}
                                      >
                                        <strong style={{ color: "#0f172a" }}>
                                          Click to add a learning block
                                        </strong>
                                        <span style={{ color: "#475569", lineHeight: 1.5 }}>
                                          Sketch this day
                                        </span>
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      style={getInteractiveZoneStyle(
                                        activeSurfaceId === emptyZoneSurfaceId,
                                      )}
                                      onMouseEnter={() =>
                                        setActiveSurfaceId(emptyZoneSurfaceId)
                                      }
                                      onMouseLeave={() =>
                                        setActiveSurfaceId((current) =>
                                          current === emptyZoneSurfaceId ? null : current,
                                        )
                                      }
                                      onFocus={() => setActiveSurfaceId(emptyZoneSurfaceId)}
                                      onBlur={() =>
                                        setActiveSurfaceId((current) =>
                                          current === emptyZoneSurfaceId ? null : current,
                                        )
                                      }
                                      onClick={() => openCreateRhythmPopover(day.value)}
                                    >
                                      <strong style={{ color: "#0f172a" }}>
                                        Click to add a learning block
                                      </strong>
                                      <span style={{ color: "#475569", lineHeight: 1.5 }}>
                                        Sketch this day
                                      </span>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 16 }}>
                    <div style={subCardStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <strong style={{ color: "#0f172a" }}>This week</strong>
                          <p style={{ ...secondaryTextStyle, marginTop: 6 }}>
                            This week is the real calendar you adjust day to day. Use your
                            master week as a guide, then choose what to add into the live week.
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              border: "1px solid #cbd5e1",
                              borderRadius: 12,
                              padding: 4,
                              background: "#f8fafc",
                              gap: 4,
                            }}
                          >
                            <button
                              type="button"
                              style={{
                                ...buttonStyle,
                                padding: "8px 12px",
                                background: liveWeekView === "school" ? "#0f172a" : "#ffffff",
                                color: liveWeekView === "school" ? "#ffffff" : "#0f172a",
                                borderColor:
                                  liveWeekView === "school" ? "#0f172a" : "#ffffff",
                              }}
                              onClick={() => {
                                setLiveWeekView("school");
                                setLiveWeekViewTouched(true);
                              }}
                            >
                              School week
                            </button>
                            <button
                              type="button"
                              style={{
                                ...buttonStyle,
                                padding: "8px 12px",
                                background: liveWeekView === "full" ? "#0f172a" : "#ffffff",
                                color: liveWeekView === "full" ? "#ffffff" : "#0f172a",
                                borderColor:
                                  liveWeekView === "full" ? "#0f172a" : "#ffffff",
                              }}
                              onClick={() => {
                                setLiveWeekView("full");
                                setLiveWeekViewTouched(true);
                              }}
                            >
                              Full week
                            </button>
                          </div>
                          <button
                            type="button"
                            style={mutedButtonStyle}
                            onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, -7))}
                          >
                            Previous week
                          </button>
                          <button
                            type="button"
                            style={mutedButtonStyle}
                            onClick={() => setSelectedWeekStart(getWeekStart())}
                          >
                            This week
                          </button>
                          <button
                            type="button"
                            style={mutedButtonStyle}
                            onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, 7))}
                          >
                            Next week
                          </button>
                          <button
                            type="button"
                            style={mutedButtonStyle}
                            onClick={() => void handleWeeklyPlannerDownload()}
                            disabled={
                              plannerDownloading ||
                              itemsLoading ||
                              templateBlocksLoading ||
                              setupLoading
                            }
                          >
                            {plannerDownloading ? "Preparing planner..." : "Print weekly planner"}
                          </button>
                        </div>
                      </div>

                      <div style={{ color: "#475569", fontWeight: 700 }}>
                        {formatWeekRangeLabel(selectedWeekStart, selectedWeekEnd)}
                      </div>

                      {hasCalendarHandoff ? (
                        <div
                          style={{
                            border: "1px solid #bfdbfe",
                            borderRadius: 14,
                            padding: 14,
                            background: "#eff6ff",
                            display: "grid",
                            gap: 8,
                          }}
                        >
                          <strong style={{ color: "#0f172a" }}>Ready to place into this week</strong>
                          <div style={{ color: "#475569", lineHeight: 1.6 }}>
                            {handoffSummary}. Click inside a day to place this into the live
                            week with the planning link already filled in.
                          </div>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              style={mutedButtonStyle}
                              onClick={clearCalendarHandoff}
                            >
                              Clear handoff
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {hasHiddenWeekendWeekContent ? (
                        <div
                          style={{
                            border: "1px solid #cbd5e1",
                            borderRadius: 14,
                            padding: 12,
                            background: "#ffffff",
                            color: "#475569",
                            lineHeight: 1.6,
                          }}
                        >
                          Weekend plans are still part of this week. Switch to Full week to
                          view Saturday and Sunday.
                        </div>
                      ) : null}

                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        }}
                      >
                        <div style={{ display: "grid", gap: 6 }}>
                          <span style={{ color: "#334155", fontSize: 13, fontWeight: 700 }}>
                            Week starting
                          </span>
                          <input
                            type="date"
                            value={selectedWeekStart}
                            onChange={(event) =>
                              setSelectedWeekStart(getWeekStart(event.target.value))
                            }
                            style={inputStyle}
                          />
                        </div>
                        <div style={{ display: "grid", gap: 6 }}>
                          <span style={{ color: "#334155", fontSize: 13, fontWeight: 700 }}>
                            Learning period
                          </span>
                          <select
                            value={selectedLearningPeriodId}
                            onChange={(event) => setSelectedLearningPeriodId(event.target.value)}
                            style={inputStyle}
                          >
                            <option value="">Optional: choose a learning period</option>
                            {weeklySelectableLearningPeriods.map((period) => (
                              <option key={period.id} value={period.id}>
                                {period.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: "grid", gap: 6 }}>
                          <span style={{ color: "#334155", fontSize: 13, fontWeight: 700 }}>
                            Master week
                          </span>
                          <select
                            value={selectedTemplateId}
                            onChange={(event) => setSelectedTemplateId(event.target.value)}
                            style={inputStyle}
                          >
                            <option value="">Optional: choose a master week</option>
                            {masterTemplates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {selectedWeekPlanningMessage ? (
                        <div
                          style={{
                            border: "1px solid #fed7aa",
                            borderRadius: 14,
                            background: "#fff7ed",
                            color: "#9a3412",
                            padding: 14,
                            lineHeight: 1.6,
                            fontWeight: 700,
                          }}
                        >
                          {selectedWeekPlanningMessage}
                        </div>
                      ) : null}

                      <div data-guidance-id="calendar-add-plan" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          style={buttonStyle}
                          onClick={() => void handlePreviewGeneration()}
                          disabled={Boolean(selectedWeekPlanningMessage)}
                        >
                          Plan this week using master
                        </button>
                        <button
                          data-guidance-id="calendar-save-plan"
                          type="button"
                          style={mutedButtonStyle}
                          onClick={() => void handleApplyGeneratedWeek()}
                          disabled={
                            !previewSuggestions.length ||
                            !previewRows.some((item) => item.canApply) ||
                            Boolean(selectedWeekPlanningMessage) ||
                            submitting
                          }
                        >
                          {submitting ? "Adding..." : "Add master blocks to this week"}
                        </button>
                      </div>

                      {!selectedTemplate ? (
                        <div
                          style={{
                            border: "1px solid #cbd5e1",
                            borderRadius: 14,
                            padding: 14,
                            background: "#ffffff",
                            color: "#475569",
                            lineHeight: 1.6,
                          }}
                        >
                          Choose or create a master week first, then plan this week using
                          master.
                        </div>
                      ) : null}

                      {selectedBreakOverlapsWeek ? (
                        <div
                          style={{
                            border: "1px solid #fcd34d",
                            borderRadius: 14,
                            padding: 14,
                            background: "#fffbeb",
                            color: "#92400e",
                            lineHeight: 1.6,
                          }}
                        >
                          <strong style={{ color: "#92400e" }}>
                            This week falls inside a break, so learning blocks will not be added.
                          </strong>
                          <div style={{ marginTop: 6 }}>
                            Choose a term week or edit the break.
                          </div>
                        </div>
                      ) : null}

                      {previewSuggestions.length ? (
                        <div style={{ display: "grid", gap: 12 }}>
                          <div
                            style={{
                              border: "1px solid #cbd5e1",
                              borderRadius: 14,
                              padding: 14,
                              background: "#ffffff",
                              color: "#475569",
                              lineHeight: 1.6,
                            }}
                          >
                            <strong style={{ color: "#0f172a" }}>Preview your week</strong>
                            <div style={{ marginTop: 6 }}>
                              {formatWeekRangeLabel(selectedWeekStart, selectedWeekEnd)}.{" "}
                              {generationSummary.readyToAdd} ready to add,{" "}
                              {generationSummary.alreadyPlanned} already planned,{" "}
                              {generationSummary.skipped} not added for breaks or blocked days.
                              This preview stays read-only until you click Add master blocks to
                              this week.
                            </div>
                          </div>
                          <div style={{ overflowX: liveWeekView === "school" ? "visible" : "auto", paddingBottom: 4 }}>
                            <div
                              style={{
                                display: "grid",
                                gap: 12,
                                gridTemplateColumns:
                                  liveWeekView === "school"
                                    ? "repeat(5, minmax(0, 1fr))"
                                    : "repeat(7, minmax(220px, 1fr))",
                                minWidth: liveWeekView === "school" ? undefined : 1640,
                              }}
                            >
                              {visibleWeekDates.map((dateValue) => {
                                const dayItems = previewRowsByDate.get(dateValue) ?? [];

                                return (
                                  <div
                                    key={dateValue}
                                    style={{
                                      border: "1px solid #cbd5e1",
                                      borderRadius: 14,
                                      padding: 14,
                                      background: "#ffffff",
                                      display: "grid",
                                      gap: 12,
                                      alignContent: "start",
                                    }}
                                  >
                                    <div style={{ display: "grid", gap: 2 }}>
                                      <strong style={{ color: "#0f172a" }}>
                                        {formatWeekdayLabel(dateValue)}
                                      </strong>
                                      <span style={{ color: "#64748b", fontSize: 13 }}>
                                        {formatDayMonthLabel(dateValue)}
                                      </span>
                                    </div>

                                    {dayItems.length ? (
                                      <div style={{ display: "grid", gap: 10 }}>
                                        {dayItems.map((item) => (
                                          <div
                                            key={item.previewKey}
                                            style={{
                                              border: "1px solid #e2e8f0",
                                              borderRadius: 12,
                                              padding: 12,
                                              background: "#f8fafc",
                                              display: "grid",
                                              gap: 8,
                                            }}
                                          >
                                            <div
                                              style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: 12,
                                                flexWrap: "wrap",
                                                alignItems: "center",
                                              }}
                                            >
                                              <strong style={{ color: "#0f172a" }}>
                                                {item.title}
                                              </strong>
                                              <span
                                                style={{
                                                  padding: "4px 10px",
                                                  borderRadius: 999,
                                                  background:
                                                    item.statusLabel === "Ready to add"
                                                      ? "#dcfce7"
                                                      : item.statusLabel === "Already planned"
                                                        ? "#e2e8f0"
                                                        : "#fef3c7",
                                                  color:
                                                    item.statusLabel === "Ready to add"
                                                      ? "#166534"
                                                      : item.statusLabel === "Already planned"
                                                        ? "#475569"
                                                        : "#92400e",
                                                  fontSize: 12,
                                                  fontWeight: 700,
                                                }}
                                              >
                                                {item.statusLabel}
                                              </span>
                                            </div>
                                            <div style={{ color: "#64748b" }}>
                                              {formatCalendarTimeRange(item.startsAt, item.endsAt)}
                                            </div>
                                            <div style={{ color: "#475569" }}>
                                              {item.learnerLabel}
                                              {item.learningArea ? ` - ${item.learningArea}` : ""}
                                            </div>
                                            {item.statusReason ? (
                                              <div style={{ color: "#92400e", lineHeight: 1.6 }}>
                                                {item.statusReason}
                                              </div>
                                            ) : null}
                                            {item.programLabel || item.segmentLabel ? (
                                              <div style={{ color: "#475569" }}>
                                                {item.programLabel ? `Program: ${item.programLabel}` : ""}
                                                {item.programLabel && item.segmentLabel ? " - " : ""}
                                                {item.segmentLabel
                                                  ? `Week / segment: ${item.segmentLabel}`
                                                  : ""}
                                              </div>
                                            ) : null}
                                            {item.sessionLabel ? (
                                              <div style={{ color: "#475569" }}>
                                                {item.sessionLabel}
                                              </div>
                                            ) : null}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div
                                        style={{
                                          border: "1px dashed #cbd5e1",
                                          borderRadius: 12,
                                          padding: 12,
                                          background: "#f8fafc",
                                          color: "#64748b",
                                          lineHeight: 1.6,
                                        }}
                                      >
                                        No master blocks land on this day yet.
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p style={secondaryTextStyle}>
                          Choose a master week, then plan this week using master to preview
                          what could be added.
                        </p>
                      )}

                      {generationRuns.length ? (
                        <div style={{ display: "grid", gap: 12 }}>
                          <strong style={{ color: "#0f172a" }}>Recent week plans</strong>
                          {generationRuns.slice(0, 4).map((run) => (
                            <div
                              key={run.id}
                              style={{
                                border: "1px solid #cbd5e1",
                                borderRadius: 14,
                                padding: 14,
                                background: "#ffffff",
                                display: "grid",
                                gap: 4,
                              }}
                            >
                              <strong style={{ color: "#0f172a" }}>
                                {formatWeekRangeLabel(run.weekStartsOn, run.weekEndsOn)}
                              </strong>
                              <span style={{ color: "#475569" }}>
                                {getSnapshotStatusLabel(run.status)} - {run.createdItemsCount} added,{" "}
                                {run.skippedItemsCount} not added
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div style={subCardStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <strong style={{ color: "#0f172a" }}>Live week</strong>
                          <p style={{ ...secondaryTextStyle, marginTop: 6 }}>
                            Click a day to add or adjust blocks.
                          </p>
                        </div>
                      </div>

                      {itemsLoading ? (
                        <p style={secondaryTextStyle}>Loading this week&apos;s blocks...</p>
                      ) : null}
                      {itemsError ? (
                        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                          <p style={{ margin: 0, color: "#b91c1c" }}>{itemsError}</p>
                          <button
                            type="button"
                            style={mutedButtonStyle}
                            onClick={() => void reloadCalendarItems()}
                          >
                            Try again
                          </button>
                        </div>
                      ) : null}
                      {setupError ? (
                        <p style={{ margin: 0, color: "#b91c1c" }}>{setupError}</p>
                      ) : null}

                      <div
                        className="mylearna-calendar-week-scroll"
                        data-guidance-id="calendar-learning-block"
                        style={{ overflowX: liveWeekView === "school" ? "visible" : "auto", paddingBottom: 4 }}
                      >
                        <div
                          className="mylearna-calendar-week-grid"
                          style={{
                            display: "grid",
                            gap: 12,
                            gridTemplateColumns:
                              liveWeekView === "school"
                                ? "repeat(5, minmax(0, 1fr))"
                                : "repeat(7, minmax(220px, 1fr))",
                            minWidth: liveWeekView === "school" ? undefined : 1640,
                          }}
                        >
                        {visibleWeekDates.map((dateValue) => {
                          const dayItems = itemsByDate.get(dateValue) ?? [];
                          const emptyZoneSurfaceId = `week-empty-${dateValue}`;

                          return (
                            <div
                              className="mylearna-calendar-day-card"
                              key={dateValue}
                              style={{
                                border: "1px solid #dbeafe",
                                borderRadius: 16,
                                padding: 14,
                                background: "#f8fbff",
                                display: "grid",
                                gap: 12,
                              }}
                            >
                              <div
                                className="mylearna-calendar-day-header"
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 8,
                                  alignItems: "center",
                                }}
                              >
                                <div style={{ display: "grid", gap: 2 }}>
                                  <strong style={{ color: "#0f172a" }}>
                                    {formatLongDateLabel(dateValue)}
                                  </strong>
                                </div>
                                <button
                                  type="button"
                                  style={{ ...buttonStyle, padding: "8px 10px" }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openCreatePopover(dateValue);
                                  }}
                                >
                                  Add block
                                </button>
                              </div>

                              {dayItems.length ? (
                                <div style={{ display: "grid", gap: 10 }}>
                                  {dayItems.map((item) => {
                                    const learnerLabel =
                                      learnerOptions.find(
                                        (option) => option.value === item.learnerId,
                                      )?.label || "Whole family";
                                    const programLabel =
                                      programOptions.find(
                                        (option) => option.value === item.programId,
                                      )?.label ?? null;
                                    const segmentLabel =
                                      programSegments.find(
                                        (segment) => segment.id === item.programSegmentId,
                                      )?.title ?? null;
                                    const blockSurfaceId = `week-block-${item.id}`;

                                    return (
                                      <div
                                        key={item.id}
                                        role="button"
                                        tabIndex={0}
                                        style={getClickableCardStyle(
                                          activeSurfaceId === blockSurfaceId,
                                        )}
                                        onMouseEnter={() => setActiveSurfaceId(blockSurfaceId)}
                                        onMouseLeave={() =>
                                          setActiveSurfaceId((current) =>
                                            current === blockSurfaceId ? null : current,
                                          )
                                        }
                                        onFocus={() => setActiveSurfaceId(blockSurfaceId)}
                                        onBlur={() =>
                                          setActiveSurfaceId((current) =>
                                            current === blockSurfaceId ? null : current,
                                          )
                                        }
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            openEditPopover(item);
                                          }
                                        }}
                                        onClick={() => openEditPopover(item)}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 8,
                                            alignItems: "center",
                                            flexWrap: "wrap",
                                          }}
                                        >
                                          <strong style={{ color: "#0f172a" }}>{item.title}</strong>
                                          <span
                                            style={{
                                              fontSize: 12,
                                              color:
                                                item.sourceType === "manual" ? "#64748b" : "#1d4ed8",
                                              fontWeight: 700,
                                            }}
                                          >
                                            {getSourceLabel(item.sourceType)}
                                          </span>
                                        </div>
                                        <div style={{ color: "#475569" }}>
                                          {formatCalendarTimeRange(item.startsAt, item.endsAt)}
                                        </div>
                                        <div style={{ color: "#64748b" }}>
                                          {learnerLabel}
                                          {item.learningArea ? ` - ${item.learningArea}` : ""}
                                        </div>
                                        {programLabel || segmentLabel ? (
                                          <div style={{ color: "#64748b", fontSize: 13 }}>
                                            {programLabel ? `Program: ${programLabel}` : ""}
                                            {programLabel && segmentLabel ? " - " : ""}
                                            {segmentLabel
                                              ? `Week / segment: ${segmentLabel}`
                                              : ""}
                                          </div>
                                        ) : null}
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                          <button
                                            type="button"
                                            style={mutedButtonStyle}
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              openEditPopover(item);
                                            }}
                                          >
                                            Edit
                                          </button>
                                          <button
                                            type="button"
                                            style={{
                                              ...dangerButtonStyle,
                                            }}
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              setPendingDelete({ type: "calendar-item", item });
                                            }}
                                          >
                                            Delete
                                          </button>
                                          <button
                                            type="button"
                                            style={mutedButtonStyle}
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              void handleCalendarCompletionToggle(item);
                                            }}
                                            disabled={completionUpdatingId === item.id}
                                          >
                                            {item.completedAt ? "Mark not complete" : "Mark complete"}
                                          </button>
                                          {evidenceByCalendarItemId.has(item.id) ? (
                                            <Link
                                              href={`${buildCalendarCaptureHref(item)}&evidence_entry_id=${encodeURIComponent(evidenceByCalendarItemId.get(item.id) ?? "")}`}
                                              onClick={(event) => event.stopPropagation()}
                                              style={{ color: "#1d4ed8", fontWeight: 700, fontSize: 13, alignSelf: "center" }}
                                            >
                                              View capture
                                            </Link>
                                          ) : (
                                            <Link
                                              href={buildCalendarCaptureHref(item)}
                                              onClick={(event) => event.stopPropagation()}
                                              style={{ color: "#1d4ed8", fontWeight: 700, fontSize: 13, alignSelf: "center" }}
                                            >
                                              Capture this moment
                                            </Link>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  <button
                                    type="button"
                                    style={getInteractiveZoneStyle(
                                      activeSurfaceId === emptyZoneSurfaceId,
                                    )}
                                    onMouseEnter={() => setActiveSurfaceId(emptyZoneSurfaceId)}
                                    onMouseLeave={() =>
                                      setActiveSurfaceId((current) =>
                                        current === emptyZoneSurfaceId ? null : current,
                                      )
                                    }
                                    onFocus={() => setActiveSurfaceId(emptyZoneSurfaceId)}
                                    onBlur={() =>
                                      setActiveSurfaceId((current) =>
                                        current === emptyZoneSurfaceId ? null : current,
                                      )
                                    }
                                    onClick={() => openCreatePopover(dateValue)}
                                  >
                                    <strong style={{ color: "#0f172a" }}>
                                      Add learning block
                                    </strong>
                                    <span style={{ color: "#475569", lineHeight: 1.5 }}>
                                      Add something small
                                    </span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="mylearna-calendar-day-empty-action"
                                  style={getInteractiveZoneStyle(
                                    activeSurfaceId === emptyZoneSurfaceId,
                                  )}
                                  onMouseEnter={() => setActiveSurfaceId(emptyZoneSurfaceId)}
                                  onMouseLeave={() =>
                                    setActiveSurfaceId((current) =>
                                      current === emptyZoneSurfaceId ? null : current,
                                    )
                                  }
                                  onFocus={() => setActiveSurfaceId(emptyZoneSurfaceId)}
                                  onBlur={() =>
                                    setActiveSurfaceId((current) =>
                                      current === emptyZoneSurfaceId ? null : current,
                                    )
                                  }
                                  onClick={() => openCreatePopover(dateValue)}
                                >
                                  <strong style={{ color: "#0f172a" }}>
                                    Add learning block
                                  </strong>
                                  <span style={{ color: "#475569", lineHeight: 1.5 }}>
                                    Sketch this day
                                  </span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
            ) : null}

            {!firstSetupMode && shouldShowCalendarNextStep ? (
            <section data-guidance-id="calendar-next-day" style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Next step: My Day</h2>
              <p style={secondaryTextStyle}>
                Open My Day when you are ready to focus on today&apos;s learning.
              </p>
              {setupStatus === "active" ? (
                <GuidanceSetupNextAction
                  stepId="calendar"
                  nextHref="/my-day"
                  label="Continue to My Day"
                  helperText="Your learning year and first term are ready enough to continue."
                />
              ) : (
                <Link href="/my-day" style={buttonStyle}>
                  Open My Day
                </Link>
              )}
            </section>
            ) : null}
          </>
        ) : null}

        {message ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#0f766e" }}>{message}</p>
          </section>
        ) : null}

        {actionError ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#b91c1c" }}>{actionError}</p>
          </section>
        ) : null}
      </div>

      {pendingDelete ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-delete-confirmation-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            display: "grid",
            placeItems: "center",
            padding: 20,
            background: "rgba(15,23,42,0.38)",
          }}
        >
          <div
            style={{
              width: "min(100%, 520px)",
              border: "1px solid #fecaca",
              borderRadius: 18,
              background: "#ffffff",
              padding: 20,
              boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
              display: "grid",
              gap: 14,
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <h2
                id="calendar-delete-confirmation-title"
                style={{ margin: 0, color: "#0f172a", fontSize: 24 }}
              >
                {pendingDelete.type === "academic-year"
                  ? "Delete this learning year?"
                  : pendingDelete.type === "learning-period"
                  ? pendingDelete.period.isBreak || pendingDelete.period.periodType === "break"
                    ? "Delete this break / holiday?"
                    : "Delete this learning period?"
                  : pendingDelete.type === "template-block"
                    ? "Delete this master week block?"
                    : "Delete this calendar block?"}
              </h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                {pendingDelete.type === "academic-year"
                  ? "This removes the year and its planning container. Existing periods or blocks may prevent deletion; nothing else will be deleted automatically."
                  : pendingDelete.type === "learning-period"
                  ? "This removes the date range from planning. Learners and programs are not deleted."
                  : pendingDelete.type === "template-block"
                    ? "This removes the block from the master week template."
                    : "This removes the block from this week."}
              </p>
              <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                {pendingDelete.type === "academic-year"
                  ? pendingDelete.year.title
                  : pendingDelete.type === "learning-period"
                  ? pendingDelete.period.title
                  : pendingDelete.type === "template-block"
                    ? pendingDelete.block.title
                    : pendingDelete.item.title}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                autoFocus
                style={mutedButtonStyle}
                onClick={() => setPendingDelete(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                style={dangerButtonStyle}
                onClick={() => void handleConfirmCalendarDelete()}
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <CleanCalendarPopover
        open={popoverOpen}
        mode={editingItemId ? "edit" : "create"}
        plannedDate={popoverDate}
        title={popoverTitle}
        learnerId={popoverLearnerId}
        learningArea={popoverLearningArea}
        learningAreaCustom={popoverLearningAreaCustom}
        timeMode={popoverTimeMode}
        startTime={popoverStartTime}
        endTime={popoverEndTime}
        description={popoverDescription}
        programId={popoverProgramId}
        programSegmentId={popoverProgramSegmentId}
        learnerOptions={learnerOptions}
        programOptions={programOptions}
        segmentOptions={visiblePopoverSegments}
        onChangeTitle={setPopoverTitle}
        onChangeLearnerId={setPopoverLearnerId}
        onChangeLearningArea={setPopoverLearningArea}
        onChangeLearningAreaCustom={setPopoverLearningAreaCustom}
        onChangeTimeMode={(mode) => {
          setPopoverTimeMode(mode);
          if (mode === "untimed") {
            setPopoverStartTime("");
            setPopoverEndTime("");
          }
        }}
        onChangeStartTime={setPopoverStartTime}
        onChangeEndTime={setPopoverEndTime}
        onChangeDescription={setPopoverDescription}
        onChangeProgramId={(value) => {
          setPopoverProgramId(value);
          if (!value) {
            setPopoverProgramSegmentId("");
          }
        }}
        onChangeProgramSegmentId={setPopoverProgramSegmentId}
        onClose={closePopover}
        onSave={() => void handlePopoverSave()}
        saving={submitting}
        errorMessage={actionError}
      />

      <CleanRhythmBlockPopover
        open={rhythmPopoverOpen}
        mode={editingTemplateBlockId ? "edit" : "create"}
        weekdayLabel={
          WEEKDAY_OPTIONS.find((option) => option.value === Number.parseInt(blockWeekday, 10))
            ?.label || "Day"
        }
        title={blockTitle}
        learningArea={blockLearningArea}
        learningAreaCustom={blockLearningAreaCustom}
        learnerId={blockLearnerId}
        timeMode={blockTimeMode}
        startTime={blockStartTime}
        endTime={blockEndTime}
        programId={blockProgramId}
        programSegmentId={blockProgramSegmentId}
        sessionLabel={blockSessionLabel}
        notes={blockNotes}
        learnerOptions={learnerOptions}
        programOptions={programOptions}
        segmentOptions={visibleBlockSegments}
        onChangeTitle={setBlockTitle}
        onChangeLearningArea={setBlockLearningArea}
        onChangeLearningAreaCustom={setBlockLearningAreaCustom}
        onChangeLearnerId={setBlockLearnerId}
        onChangeTimeMode={(mode) => {
          setBlockTimeMode(mode);
          if (mode === "untimed") {
            setBlockStartTime("");
            setBlockEndTime("");
          }
        }}
        onChangeStartTime={setBlockStartTime}
        onChangeEndTime={setBlockEndTime}
        onChangeProgramId={(value) => {
          setBlockProgramId(value);
          if (!value) {
            setBlockProgramSegmentId("");
          }
        }}
        onChangeProgramSegmentId={setBlockProgramSegmentId}
        onChangeSessionLabel={setBlockSessionLabel}
        onChangeNotes={setBlockNotes}
        onClose={closeRhythmPopover}
        onDelete={
          editingTemplateBlock
            ? () => setPendingDelete({ type: "template-block", block: editingTemplateBlock })
            : undefined
        }
        onSave={() => void handleTemplateBlockSubmit()}
        saving={submitting}
      />
    </div>
  );
}

export default function CleanCalendarWorkspace() {
  return <CleanCalendarWorkspaceBody />;
}

