"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CleanCalendarPopover from "@/app/components/clean/CleanCalendarPopover";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import {
  createCleanCalendarItem,
  deleteCleanCalendarItem,
  listCleanCalendarItems,
  updateCleanCalendarItem,
} from "@/lib/clean/calendar/client";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import {
  buildCleanGeneratedWeekPreview,
  createCleanGenerationRun,
  listCleanGenerationRuns,
} from "@/lib/clean/generation/client";
import type {
  CleanGeneratedWeekSuggestion,
  CleanGenerationRun,
} from "@/lib/clean/generation/types";
import { normalizeCleanErrorMessage } from "@/lib/clean/family/client";
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
  createCleanLearningPeriod,
  listCleanAcademicYears,
  listCleanBlackoutDays,
  listCleanLearningPeriods,
} from "@/lib/clean/terms/client";
import type {
  CleanAcademicYear,
  CleanBlackoutDay,
  CleanLearningPeriod,
  CleanLearningPeriodType,
} from "@/lib/clean/terms/types";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 20,
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

const subCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#f8fafc",
  padding: 16,
  display: "grid",
  gap: 14,
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

const secondaryTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.6,
};

const AUSTRALIAN_LEARNING_AREAS = [
  "English",
  "Mathematics",
  "Science",
  "Humanities and Social Sciences",
  "The Arts",
  "Languages",
  "Health and Physical Education",
  "Technologies",
];

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

function formatWeekRangeLabel(startsOn: string, endsOn: string) {
  return `${formatDateLabel(startsOn)} to ${formatDateLabel(endsOn)}`;
}

function formatTimeLabel(value: string | null) {
  if (!value) return "Any time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatClockTimeLabel(value: string | null) {
  const time = safeTimeString(value ?? "");
  if (!time) return "";

  const [hoursText = "00", minutesText = "00"] = time.split(":");
  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText, 10);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return time;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatClockRangeLabel(startsAt: string | null, endsAt: string | null) {
  const start = formatClockTimeLabel(startsAt);
  const end = formatClockTimeLabel(endsAt);
  if (start && end) return `${start} to ${end}`;
  return start || end || "Any time";
}

function formatPeriodTypeLabel(periodType: CleanLearningPeriodType, isBreak: boolean) {
  if (isBreak || periodType === "break") return "Break";

  switch (periodType) {
    case "semester":
      return "Semester";
    case "unit":
      return "Unit block";
    case "custom":
      return "Custom block";
    default:
      return "Term";
  }
}

function getSourceLabel(sourceType: string | null) {
  if (sourceType === "generated") return "Planned from rhythm";
  if (sourceType === "template") return "From weekly rhythm";
  return "Hand added";
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

function CleanRhythmBlockPopover({
  open,
  mode,
  weekdayLabel,
  title,
  learningArea,
  learnerId,
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
  onChangeLearnerId,
  onChangeStartTime,
  onChangeEndTime,
  onChangeProgramId,
  onChangeProgramSegmentId,
  onChangeSessionLabel,
  onChangeNotes,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  mode: "create" | "edit";
  weekdayLabel: string;
  title: string;
  learningArea: string;
  learnerId: string;
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
  onChangeLearnerId: (value: string) => void;
  onChangeStartTime: (value: string) => void;
  onChangeEndTime: (value: string) => void;
  onChangeProgramId: (value: string) => void;
  onChangeProgramSegmentId: (value: string) => void;
  onChangeSessionLabel: (value: string) => void;
  onChangeNotes: (value: string) => void;
  onClose: () => void;
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
            Weekly rhythm
          </div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>
            {mode === "edit" ? "Edit rhythm block" : "Add rhythm block"}
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
            <input
              value={learningArea}
              onChange={(event) => onChangeLearningArea(event.target.value)}
              placeholder="Optional"
              list="clean-learning-areas"
              style={inputStyle}
            />
          </label>
        </div>

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
            Linked program
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
            Program segment
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
            placeholder="Anything you want to remember about this usual rhythm"
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
        </div>
      </div>
    </div>
  );
}

function CleanCalendarWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();

  const [academicYears, setAcademicYears] = useState<CleanAcademicYear[]>([]);
  const [learningPeriods, setLearningPeriods] = useState<CleanLearningPeriod[]>([]);
  const [blackoutDays, setBlackoutDays] = useState<CleanBlackoutDay[]>([]);
  const [masterTemplates, setMasterTemplates] = useState<CleanMasterTemplate[]>([]);
  const [templateBlocks, setTemplateBlocks] = useState<CleanTemplateBlock[]>([]);
  const [programs, setPrograms] = useState<CleanProgram[]>([]);
  const [programSegments, setProgramSegments] = useState<CleanProgramSegment[]>([]);
  const [generationRuns, setGenerationRuns] = useState<CleanGenerationRun[]>([]);
  const [items, setItems] = useState<CleanCalendarItem[]>([]);

  const [setupLoading, setSetupLoading] = useState(false);
  const [templateBlocksLoading, setTemplateBlocksLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [selectedLearningPeriodId, setSelectedLearningPeriodId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedWeekStart, setSelectedWeekStart] = useState(getWeekStart());

  const [yearTitle, setYearTitle] = useState("");
  const [yearStartsOn, setYearStartsOn] = useState(getWeekStart());
  const [yearEndsOn, setYearEndsOn] = useState(addDays(getWeekStart(), 83));
  const [yearCountryCode, setYearCountryCode] = useState("AU");
  const [yearJurisdictionCode, setYearJurisdictionCode] = useState("");

  const [periodTitle, setPeriodTitle] = useState("");
  const [periodStartsOn, setPeriodStartsOn] = useState(getWeekStart());
  const [periodEndsOn, setPeriodEndsOn] = useState(addDays(getWeekStart(), 13));
  const [periodType, setPeriodType] = useState<CleanLearningPeriodType>("term");
  const [periodIsBreak, setPeriodIsBreak] = useState(false);

  const [templateTitle, setTemplateTitle] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateScopeType, setTemplateScopeType] = useState<"family" | "learner">("family");
  const [templateLearnerId, setTemplateLearnerId] = useState("");

  const [editingTemplateBlockId, setEditingTemplateBlockId] = useState<string | null>(null);
  const [blockWeekday, setBlockWeekday] = useState("1");
  const [blockTitle, setBlockTitle] = useState("");
  const [blockLearningArea, setBlockLearningArea] = useState("");
  const [blockLearnerId, setBlockLearnerId] = useState("");
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
  const [popoverStartTime, setPopoverStartTime] = useState("");
  const [popoverEndTime, setPopoverEndTime] = useState("");
  const [popoverDescription, setPopoverDescription] = useState("");
  const [popoverProgramId, setPopoverProgramId] = useState("");
  const [popoverProgramSegmentId, setPopoverProgramSegmentId] = useState("");

  const [planningView, setPlanningView] = useState<PlanningView>("master");
  const [showYearComposer, setShowYearComposer] = useState(false);
  const [showLearningPeriodComposer, setShowLearningPeriodComposer] = useState(false);
  const [showTemplateComposer, setShowTemplateComposer] = useState(false);
  const [rhythmPopoverOpen, setRhythmPopoverOpen] = useState(false);

  const [previewSuggestions, setPreviewSuggestions] = useState<CleanGeneratedWeekSuggestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const selectedAcademicYear = useMemo(
    () => academicYears.find((year) => year.id === selectedAcademicYearId) ?? null,
    [academicYears, selectedAcademicYearId],
  );

  const selectedTemplate = useMemo(
    () => masterTemplates.find((template) => template.id === selectedTemplateId) ?? null,
    [masterTemplates, selectedTemplateId],
  );

  const selectedWeekEnd = useMemo(() => addDays(selectedWeekStart, 6), [selectedWeekStart]);
  const weekDates = useMemo(() => getWeekDates(selectedWeekStart), [selectedWeekStart]);

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

  const templateBlocksByWeekday = useMemo(() => {
    const grouped = new Map<number, CleanTemplateBlock[]>();

    for (const block of templateBlocks) {
      const existing = grouped.get(block.weekday) ?? [];
      existing.push(block);
      grouped.set(block.weekday, existing);
    }

    return grouped;
  }, [templateBlocks]);

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

  const generationSummary = useMemo(() => {
    const created = previewSuggestions.filter((item) => !item.skippedReason).length;
    const skipped = previewSuggestions.filter((item) => Boolean(item.skippedReason)).length;
    return { created, skipped };
  }, [previewSuggestions]);

  const shouldShowYearComposer = showYearComposer || !academicYears.length;
  const shouldShowLearningPeriodComposer =
    showLearningPeriodComposer || !visibleLearningPeriods.length;
  const shouldShowTemplateComposer = showTemplateComposer || !masterTemplates.length;

  const readyForCalendar =
    !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;

  const reloadSetupData = useCallback(async () => {
    if (!workspace.profile) return;

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
    } catch (error) {
      setSetupError(
        normalizeCleanErrorMessage(
          error,
          "We could not load your planning setup just now.",
        ),
      );
    } finally {
      setSetupLoading(false);
    }
  }, [workspace.profile]);

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
          "We could not load this weekly rhythm just now.",
        ),
      );
    } finally {
      setTemplateBlocksLoading(false);
    }
  }, [selectedTemplateId, workspace.profile]);

  const reloadWeekItems = useCallback(async () => {
    if (!workspace.profile) return;

    setItemsLoading(true);
    setItemsError(null);

    try {
      const nextItems = await listCleanCalendarItems(workspace.profile.id, {
        fromDate: selectedWeekStart,
        toDate: selectedWeekEnd,
        limit: 100,
      });
      setItems(nextItems);
    } catch (error) {
      setItemsError(
        normalizeCleanErrorMessage(
          error,
          "We could not load this week's blocks just now.",
        ),
      );
    } finally {
      setItemsLoading(false);
    }
  }, [selectedWeekEnd, selectedWeekStart, workspace.profile]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setAcademicYears([]);
      setLearningPeriods([]);
      setBlackoutDays([]);
      setMasterTemplates([]);
      setTemplateBlocks([]);
      setPrograms([]);
      setProgramSegments([]);
      setGenerationRuns([]);
      setItems([]);
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
    void reloadTemplateBlocks();
  }, [reloadTemplateBlocks]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setItems([]);
      return;
    }

    void reloadWeekItems();
  }, [
    reloadWeekItems,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  useEffect(() => {
    if (
      selectedLearningPeriodId &&
      !visibleLearningPeriods.some((period) => period.id === selectedLearningPeriodId)
    ) {
      setSelectedLearningPeriodId("");
    }
  }, [selectedLearningPeriodId, visibleLearningPeriods]);

  useEffect(() => {
    setPreviewSuggestions([]);
  }, [selectedWeekStart, selectedTemplateId, selectedLearningPeriodId, templateBlocks, blackoutDays]);

  function resetTemplateBlockForm() {
    setEditingTemplateBlockId(null);
    setBlockWeekday("1");
    setBlockTitle("");
    setBlockLearningArea("");
    setBlockLearnerId("");
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
    setPopoverStartTime("");
    setPopoverEndTime("");
    setPopoverDescription("");
    setPopoverProgramId("");
    setPopoverProgramSegmentId("");
  }

  function openCreatePopover(dateValue: string) {
    resetPopoverForm();
    setPopoverDate(dateValue);
    setPopoverOpen(true);
    setMessage(null);
    setActionError(null);
  }

  function openEditPopover(item: CleanCalendarItem) {
    setEditingItemId(item.id);
    setPopoverDate(item.plannedDate);
    setPopoverTitle(item.title);
    setPopoverLearnerId(item.learnerId ?? "");
    setPopoverLearningArea(item.learningArea ?? "");
    setPopoverStartTime(toTimeFieldValue(item.startsAt));
    setPopoverEndTime(toTimeFieldValue(item.endsAt));
    setPopoverDescription(item.description ?? "");
    setPopoverProgramId(item.programId ?? "");
    setPopoverProgramSegmentId(item.programSegmentId ?? "");
    setPopoverOpen(true);
    setMessage(null);
    setActionError(null);
  }

  function closePopover() {
    setPopoverOpen(false);
    resetPopoverForm();
  }

  function openCreateRhythmPopover(weekday: number) {
    resetTemplateBlockForm();
    setBlockWeekday(String(weekday));
    setRhythmPopoverOpen(true);
    setMessage(null);
    setActionError(null);
  }

  function openEditRhythmPopover(block: CleanTemplateBlock) {
    setEditingTemplateBlockId(block.id);
    setBlockWeekday(String(block.weekday));
    setBlockTitle(block.title);
    setBlockLearningArea(block.learningArea ?? "");
    setBlockLearnerId(block.learnerId ?? "");
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

  async function handleAcademicYearSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const created = await createCleanAcademicYear(workspace.profile.id, {
        title: yearTitle,
        startsOn: yearStartsOn,
        endsOn: yearEndsOn,
        countryCode: yearCountryCode || null,
        jurisdictionCode: yearJurisdictionCode || null,
      });

      setSelectedAcademicYearId(created.id);
      setShowYearComposer(false);
      setShowLearningPeriodComposer(true);
      setMessage("Learning year saved.");
      setYearTitle("");
      await reloadSetupData();
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

  async function handleLearningPeriodSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile) return;

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
      });

      setMessage("Learning period saved.");
      setShowLearningPeriodComposer(false);
      setPeriodTitle("");
      setPeriodType("term");
      setPeriodIsBreak(false);
      await reloadSetupData();
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
      setMessage("Weekly rhythm saved.");
      setTemplateTitle("");
      setTemplateDescription("");
      setTemplateLearnerId("");
      setTemplateScopeType("family");
      await reloadSetupData();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save this weekly rhythm.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTemplateBlockSubmit() {
    if (!workspace.profile || !selectedTemplateId) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const payload = {
        learnerId: blockLearnerId || null,
        weekday: Number.parseInt(blockWeekday, 10) || 1,
        title: blockTitle,
        learningArea: blockLearningArea || null,
        startsAt: blockStartTime || null,
        endsAt: blockEndTime || null,
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
      setMessage("Rhythm block saved.");
      await reloadTemplateBlocks();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save this rhythm block.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePreviewGeneration() {
    const nextPreview = buildCleanGeneratedWeekPreview({
      weekStartsOn: selectedWeekStart,
      weekEndsOn: selectedWeekEnd,
      templateBlocks,
      blackoutDays,
      programSegments: programSegments.map((segment) => ({
        id: segment.id,
        programId: segment.programId,
        title: segment.title,
      })),
    });

    setPreviewSuggestions(nextPreview);
    setMessage("This week's draft is ready to review.");
    setActionError(null);
  }

  async function handleRecordGenerationRun() {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const payload = previewSuggestions.length
        ? previewSuggestions
        : buildCleanGeneratedWeekPreview({
            weekStartsOn: selectedWeekStart,
            weekEndsOn: selectedWeekEnd,
            templateBlocks,
            blackoutDays,
            programSegments: programSegments.map((segment) => ({
              id: segment.id,
              programId: segment.programId,
              title: segment.title,
            })),
          });

      await createCleanGenerationRun(workspace.profile.id, {
        academicYearId: selectedAcademicYearId || null,
        learningPeriodId: selectedLearningPeriodId || null,
        masterTemplateId: selectedTemplateId || null,
        weekStartsOn: selectedWeekStart,
        weekEndsOn: selectedWeekEnd,
        mergeStrategy: "fill-empty",
        status: "recorded",
        previewPayload: payload,
        createdItemsCount: payload.filter((item) => !item.skippedReason).length,
        skippedItemsCount: payload.filter((item) => Boolean(item.skippedReason)).length,
        notes: "Saved from the clean weekly planning preview.",
      });

      setPreviewSuggestions(payload);
      setMessage(
        "Planning snapshot saved. Your live calendar stays unchanged until you add or edit blocks below.",
      );
      await reloadSetupData();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save this planning snapshot.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePopoverSave() {
    if (!workspace.profile) return;

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
        learningArea: popoverLearningArea || null,
        startsAt: toTimestampFromDateAndTime(popoverDate, popoverStartTime),
        endsAt: toTimestampFromDateAndTime(popoverDate, popoverEndTime),
        description: popoverDescription || null,
        sourceType: "manual" as const,
      };

      if (editingItemId) {
        await updateCleanCalendarItem(workspace.profile.id, editingItemId, payload);
        setMessage("This week's block was updated.");
      } else {
        await createCleanCalendarItem(workspace.profile.id, payload);
        setMessage("This week's block was added.");
      }

      closePopover();
      await reloadWeekItems();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save this week's block.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteItem(item: CleanCalendarItem) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await deleteCleanCalendarItem(workspace.profile.id, item.id);
      setMessage("This block was removed from the week.");

      if (editingItemId === item.id) {
        closePopover();
      }

      await reloadWeekItems();
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

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <section style={cardStyle}>
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
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Calendar</h1>
            <p style={secondaryTextStyle}>
              Set term dates, keep a reusable weekly rhythm, and shape the real week when
              you need it.
            </p>
          </div>
        </section>

        {workspace.loading ? (
          <section style={cardStyle}>Loading your clean planning space...</section>
        ) : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Planning setup not ready yet</h2>
            <p style={secondaryTextStyle}>
              The clean planning tables are not installed yet, so this page cannot load.
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
              setting learning periods or building a weekly rhythm.
            </p>
          </section>
        ) : null}

        {readyForCalendar && workspace.profile && workspace.learners.length ? (
          <>
            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Learning periods</h2>
                  <p style={{ ...secondaryTextStyle, marginTop: 8 }}>
                    A learning period is the span of time you want MyLearna to plan inside
                    — for example Term 1, Autumn term, Semester 1, or a custom unit block.
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 16,
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  }}
                >
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
                        >
                          {shouldShowYearComposer ? "Hide year form" : "Add year"}
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
                          <input
                            value={yearTitle}
                            onChange={(event) => setYearTitle(event.target.value)}
                            placeholder="2026 learning year"
                            style={inputStyle}
                          />
                          <input
                            value={yearCountryCode}
                            onChange={(event) =>
                              setYearCountryCode(event.target.value.toUpperCase())
                            }
                            placeholder="Country code"
                            style={inputStyle}
                          />
                          <input
                            value={yearJurisdictionCode}
                            onChange={(event) => setYearJurisdictionCode(event.target.value)}
                            placeholder="State or region"
                            style={inputStyle}
                          />
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
                            value={yearStartsOn}
                            onChange={(event) => setYearStartsOn(event.target.value)}
                            style={inputStyle}
                          />
                          <input
                            type="date"
                            value={yearEndsOn}
                            onChange={(event) => setYearEndsOn(event.target.value)}
                            style={inputStyle}
                          />
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button type="submit" style={buttonStyle} disabled={submitting}>
                            {submitting ? "Saving..." : "Save year"}
                          </button>
                        </div>
                      </form>
                    ) : null}

                    {academicYears.length ? (
                      <div style={{ display: "grid", gap: 12 }}>
                        {academicYears.map((year) => {
                          const yearPeriods = learningPeriods.filter(
                            (period) => period.academicYearId === year.id,
                          );
                          const isSelected = selectedAcademicYearId === year.id;

                          return (
                            <button
                              key={year.id}
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
                              onClick={() => setSelectedAcademicYearId(year.id)}
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
                                <strong style={{ color: "#0f172a" }}>{year.title}</strong>
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
                              </div>
                              <div style={{ color: "#475569" }}>
                                {formatWeekRangeLabel(year.startsOn, year.endsOn)}
                              </div>
                              <div style={{ color: "#64748b", fontSize: 13 }}>
                                {yearPeriods.length
                                  ? `${yearPeriods.length} learning period${yearPeriods.length === 1 ? "" : "s"}`
                                  : "No learning periods yet"}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={secondaryTextStyle}>
                        No year set yet. Add one before creating terms or unit blocks.
                      </p>
                    )}
                  </div>

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
                        <strong style={{ color: "#0f172a" }}>2. Add your learning periods</strong>
                        <p style={secondaryTextStyle}>
                          Choose the year, then add term dates, semesters, breaks, or custom
                          blocks.
                        </p>
                      </div>
                      <button
                        type="button"
                        style={mutedButtonStyle}
                        onClick={() => setShowLearningPeriodComposer((current) => !current)}
                        disabled={!selectedAcademicYear}
                      >
                        {shouldShowLearningPeriodComposer ? "Hide period form" : "Add period"}
                      </button>
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
                            display: "grid",
                            gap: 12,
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                          }}
                        >
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
                          <input
                            value={periodTitle}
                            onChange={(event) => setPeriodTitle(event.target.value)}
                            placeholder="Term 1, Autumn term, Unit block"
                            style={inputStyle}
                          />
                          <select
                            value={periodType}
                            onChange={(event) =>
                              setPeriodType(event.target.value as CleanLearningPeriodType)
                            }
                            style={inputStyle}
                          >
                            {PERIOD_TYPES.map((option) => (
                              <option key={option} value={option}>
                                {formatPeriodTypeLabel(option, false)}
                              </option>
                            ))}
                          </select>
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
                            value={periodStartsOn}
                            onChange={(event) => setPeriodStartsOn(event.target.value)}
                            style={inputStyle}
                          />
                          <input
                            type="date"
                            value={periodEndsOn}
                            onChange={(event) => setPeriodEndsOn(event.target.value)}
                            style={inputStyle}
                          />
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              color: "#475569",
                              padding: "10px 12px",
                              border: "1px solid #cbd5e1",
                              borderRadius: 10,
                              background: "#ffffff",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={periodIsBreak}
                              onChange={(event) => setPeriodIsBreak(event.target.checked)}
                            />
                            Mark this as a break
                          </label>
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            type="submit"
                            style={buttonStyle}
                            disabled={submitting || !selectedAcademicYearId}
                          >
                            {submitting ? "Saving..." : "Save period"}
                          </button>
                        </div>
                      </form>
                    ) : null}

                    {visibleLearningPeriods.length ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        {visibleLearningPeriods.map((period) => (
                          <div
                            key={period.id}
                            style={{
                              border: "1px solid #cbd5e1",
                              borderRadius: 14,
                              padding: 14,
                              background: "#ffffff",
                              display: "grid",
                              gap: 6,
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
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: 999,
                                  background: period.isBreak ? "#fef3c7" : "#dbeafe",
                                  color: period.isBreak ? "#92400e" : "#1d4ed8",
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                {formatPeriodTypeLabel(period.periodType, period.isBreak)}
                              </span>
                            </div>
                            <div style={{ color: "#475569" }}>
                              {formatWeekRangeLabel(period.startsOn, period.endsOn)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : selectedAcademicYear ? (
                      <p style={secondaryTextStyle}>
                        No learning periods yet for this year. Add your first term or block
                        above.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

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
                      Keep your reusable rhythm separate from the real week, then switch
                      between the two as needed.
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
                        background: planningView === "master" ? "#0f172a" : "#ffffff",
                        color: planningView === "master" ? "#ffffff" : "#0f172a",
                        borderColor: planningView === "master" ? "#0f172a" : "#ffffff",
                      }}
                      onClick={() => setPlanningView("master")}
                    >
                      Master rhythm
                    </button>
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
                  </div>
                </div>

                {planningView === "master" ? (
                  <div style={{ display: "grid", gap: 16 }}>
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
                          <strong style={{ color: "#0f172a" }}>Choose a weekly rhythm</strong>
                          <p style={secondaryTextStyle}>
                            This is your reusable pattern. It does not change the real week
                            until you choose to plan inside This week.
                          </p>
                        </div>
                        <button
                          type="button"
                          style={mutedButtonStyle}
                          onClick={() => setShowTemplateComposer((current) => !current)}
                        >
                          {shouldShowTemplateComposer ? "Hide rhythm form" : "Add rhythm"}
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
                              placeholder="Family rhythm or Maya's rhythm"
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
                            placeholder="Optional notes about how this rhythm works for your family"
                            style={textAreaStyle}
                          />
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button type="submit" style={buttonStyle} disabled={submitting}>
                              {submitting ? "Saving..." : "Save rhythm"}
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
                                  {template.description || "Reusable weekly rhythm"}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p style={secondaryTextStyle}>
                          No weekly rhythm yet. You can still plan directly inside This week.
                        </p>
                      )}
                    </div>

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
                                "Click a day to shape the usual flow of your week."}
                            </p>
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
                                )?.label || "Learner rhythm"
                              : "Whole family"}
                          </div>
                        </div>

                        {templateBlocksLoading ? (
                          <p style={secondaryTextStyle}>Loading your weekly rhythm...</p>
                        ) : (
                          <div
                            style={{
                              display: "grid",
                              gap: 12,
                              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            }}
                          >
                            {WEEKDAY_OPTIONS.map((day) => {
                              const dayBlocks = templateBlocksByWeekday.get(day.value) ?? [];

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
                                      onClick={() => openCreateRhythmPopover(day.value)}
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

                                        return (
                                          <button
                                            key={block.id}
                                            type="button"
                                            style={{
                                              border: "1px solid #dbeafe",
                                              borderRadius: 14,
                                              background: "#f8fbff",
                                              padding: 12,
                                              display: "grid",
                                              gap: 6,
                                              textAlign: "left",
                                              cursor: "pointer",
                                            }}
                                            onClick={() => openEditRhythmPopover(block)}
                                          >
                                            <strong style={{ color: "#0f172a" }}>{block.title}</strong>
                                            <div style={{ color: "#475569" }}>
                                              {formatClockRangeLabel(block.startsAt, block.endsAt)}
                                            </div>
                                            <div style={{ color: "#64748b", fontSize: 13 }}>
                                              {learnerLabel}
                                              {block.learningArea ? ` - ${block.learningArea}` : ""}
                                            </div>
                                            {block.sessionLabel ? (
                                              <div style={{ color: "#64748b", fontSize: 13 }}>
                                                {block.sessionLabel}
                                              </div>
                                            ) : null}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p style={secondaryTextStyle}>
                                      No blocks yet. Click Add block to sketch the shape of this
                                      day.
                                    </p>
                                  )}
                                </div>
                              );
                            })}
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
                          <strong style={{ color: "#0f172a" }}>Plan this week</strong>
                          <p style={{ ...secondaryTextStyle, marginTop: 6 }}>
                            Use your weekly rhythm as a guide. The preview stays separate from
                            your live calendar until you decide what to keep.
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                        </div>
                      </div>

                      <div style={{ color: "#475569", fontWeight: 700 }}>
                        {formatWeekRangeLabel(selectedWeekStart, selectedWeekEnd)}
                      </div>

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
                            {visibleLearningPeriods.map((period) => (
                              <option key={period.id} value={period.id}>
                                {period.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: "grid", gap: 6 }}>
                          <span style={{ color: "#334155", fontSize: 13, fontWeight: 700 }}>
                            Weekly rhythm
                          </span>
                          <select
                            value={selectedTemplateId}
                            onChange={(event) => setSelectedTemplateId(event.target.value)}
                            style={inputStyle}
                          >
                            <option value="">Optional: choose a weekly rhythm</option>
                            {masterTemplates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          style={buttonStyle}
                          onClick={() => void handlePreviewGeneration()}
                          disabled={!selectedTemplateId}
                        >
                          Preview this week
                        </button>
                        <button
                          type="button"
                          style={mutedButtonStyle}
                          onClick={() => void handleRecordGenerationRun()}
                          disabled={!selectedTemplateId || submitting}
                        >
                          {submitting ? "Saving..." : "Save planning snapshot"}
                        </button>
                      </div>

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
                            Preview for {formatWeekRangeLabel(selectedWeekStart, selectedWeekEnd)}.
                            {" "}
                            {generationSummary.created} planned block
                            {generationSummary.created === 1 ? "" : "s"} and{" "}
                            {generationSummary.skipped} held day marker
                            {generationSummary.skipped === 1 ? "" : "s"}.
                            {" "}
                            This preview sits beside your live week. It does not replace
                            anything in the calendar below.
                          </div>
                          {previewSuggestions.slice(0, 12).map((item, index) => (
                            <div
                              key={`${item.plannedDate}-${item.title}-${index}`}
                              style={{
                                border: "1px solid #cbd5e1",
                                borderRadius: 14,
                                padding: 14,
                                background: "#ffffff",
                                display: "grid",
                                gap: 6,
                              }}
                            >
                              <strong style={{ color: "#0f172a" }}>{item.title}</strong>
                              <div style={{ color: "#64748b" }}>
                                {formatDateLabel(item.plannedDate)}
                                {item.startsAt ? ` - ${formatTimeLabel(item.startsAt)}` : ""}
                                {item.learningArea ? ` - ${item.learningArea}` : ""}
                              </div>
                              {item.skippedReason ? (
                                <div style={{ color: "#b45309" }}>{item.skippedReason}</div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={secondaryTextStyle}>
                          No preview yet. Choose a weekly rhythm, then preview this week if you
                          want a reusable starting point.
                        </p>
                      )}

                      {generationRuns.length ? (
                        <div style={{ display: "grid", gap: 12 }}>
                          <strong style={{ color: "#0f172a" }}>Recent planning snapshots</strong>
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
                                {getSnapshotStatusLabel(run.status)} - {run.createdItemsCount} planned,{" "}
                                {run.skippedItemsCount} held
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
                            Click a day to add something, or click an existing block to adjust
                            the real week.
                          </p>
                        </div>
                      </div>

                      {itemsLoading ? (
                        <p style={secondaryTextStyle}>Loading this week&apos;s blocks...</p>
                      ) : null}
                      {itemsError ? (
                        <p style={{ margin: 0, color: "#b91c1c" }}>{itemsError}</p>
                      ) : null}
                      {setupError ? (
                        <p style={{ margin: 0, color: "#b91c1c" }}>{setupError}</p>
                      ) : null}

                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        }}
                      >
                        {weekDates.map((dateValue) => {
                          const dayItems = itemsByDate.get(dateValue) ?? [];

                          return (
                            <div
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
                                  onClick={() => openCreatePopover(dateValue)}
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

                                    return (
                                      <div
                                        key={item.id}
                                        style={{
                                          border: "1px solid #bfdbfe",
                                          borderRadius: 14,
                                          background: "#ffffff",
                                          padding: 12,
                                          display: "grid",
                                          gap: 6,
                                          cursor: "pointer",
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
                                          {item.startsAt || item.endsAt
                                            ? `${formatTimeLabel(item.startsAt)}${
                                                item.endsAt
                                                  ? ` to ${formatTimeLabel(item.endsAt)}`
                                                  : ""
                                              }`
                                            : "Any time"}
                                        </div>
                                        <div style={{ color: "#64748b" }}>
                                          {learnerLabel}
                                          {item.learningArea ? ` - ${item.learningArea}` : ""}
                                        </div>
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
                                              ...buttonStyle,
                                              background: "#b91c1c",
                                              borderColor: "#b91c1c",
                                            }}
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              void handleDeleteItem(item);
                                            }}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p style={secondaryTextStyle}>
                                  No blocks yet. Click Add block to shape this day.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
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

      <datalist id="clean-learning-areas">
        {AUSTRALIAN_LEARNING_AREAS.map((area) => (
          <option key={area} value={area} />
        ))}
      </datalist>

      <CleanCalendarPopover
        open={popoverOpen}
        mode={editingItemId ? "edit" : "create"}
        plannedDate={popoverDate}
        title={popoverTitle}
        learnerId={popoverLearnerId}
        learningArea={popoverLearningArea}
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
        learnerId={blockLearnerId}
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
        onChangeLearnerId={setBlockLearnerId}
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
        onSave={() => void handleTemplateBlockSubmit()}
        saving={submitting}
      />
    </div>
  );
}

export default function CleanCalendarWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanCalendarWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
