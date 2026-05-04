"use client";

import React, { useMemo } from "react";
import type { FamilyCalendarBlockEntry } from "@/lib/familyPlanner";
import type { FamilyLearner } from "@/lib/familyWorkspace";
import type {
  CalendarItemType,
  CalendarTemplate,
  CalendarTimeBlock,
  Program,
  TemplateSlot,
} from "@/lib/familyPlanningTemplates";
import {
  CALENDAR_ITEM_TYPE_OPTIONS,
  CALENDAR_TIME_BLOCK_OPTIONS,
} from "@/lib/familyPlanningTemplates";
import {
  BODY,
  H2,
  H3,
  INPUT,
  LABEL,
  META,
} from "@/app/components/calendar/CalendarTemplateOverviewComponents";

export type CalendarSurfaceView = "template" | "week";

export type CalendarWeekDay = {
  key: string;
  label: string;
  dateLabel: string;
  weekdayValue: number;
  isToday: boolean;
};

export type CalendarWeekEditorMode = "create-live" | "edit-live" | "edit-template" | null;

export type CalendarWeekEditorDraft = {
  id: string | null;
  kind: "live" | "template";
  title: string;
  itemType: CalendarItemType;
  learnerIds: string[];
  date: string;
  dayOfWeek: number;
  timeBlock: CalendarTimeBlock;
  startTime: string;
  endTime: string;
  notes: string;
  learningArea: string;
  curriculumOutcomeIds: string[];
  sourceType: "manual" | "generated";
  programId: string | null;
  programSegmentId: string | null;
  calendarTemplateSlotId: string | null;
  primaryLearnerId: string | null;
};

const DAYPARTS = [
  { id: "morning", label: "Morning" },
  { id: "midday", label: "Midday" },
  { id: "afternoon", label: "Afternoon" },
] as const;

type DaypartId = (typeof DAYPARTS)[number]["id"];

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function itemTypeLabel(itemType: CalendarItemType) {
  return (
    CALENDAR_ITEM_TYPE_OPTIONS.find((option) => option.value === itemType)?.label ||
    "Learning block"
  );
}

function parseHour(value?: string | null) {
  const match = safe(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]);
}

function daypartFromHour(hour: number) {
  if (hour < 12) return "morning";
  if (hour < 14) return "midday";
  return "afternoon";
}

function fallbackDaypart(index: number): DaypartId {
  if (index === 0) return "morning";
  if (index === 1) return "midday";
  return "afternoon";
}

function slotDaypart(slot: TemplateSlot, fallbackIndex: number): DaypartId {
  if (slot.timeBlock === "morning" || slot.timeBlock === "midday" || slot.timeBlock === "afternoon") {
    return slot.timeBlock;
  }

  const hour = parseHour(slot.startTime);
  if (hour !== null) return daypartFromHour(hour);
  return fallbackDaypart(fallbackIndex);
}

function blockDaypart(
  block: FamilyCalendarBlockEntry,
  slotMap: Map<string, TemplateSlot>,
  fallbackIndex: number,
): DaypartId {
  const linkedSlot = safe(block.calendarTemplateSlotId)
    ? slotMap.get(safe(block.calendarTemplateSlotId)) ?? null
    : null;

  if (linkedSlot) return slotDaypart(linkedSlot, fallbackIndex);

  if (
    block.timeBlock === "morning" ||
    block.timeBlock === "midday" ||
    block.timeBlock === "afternoon"
  ) {
    return block.timeBlock;
  }

  const hour = parseHour(block.startTime) ?? parseHour(block.time);
  if (hour !== null) return daypartFromHour(hour);

  return fallbackDaypart(fallbackIndex);
}

function sortTemplateSlots(slots: TemplateSlot[]) {
  return [...slots].sort((a, b) => {
    const aTime = safe(a.startTime) || "99:99";
    const bTime = safe(b.startTime) || "99:99";
    if (aTime !== bTime) return aTime.localeCompare(bTime);
    return safe(a.label).localeCompare(safe(b.label));
  });
}

function sortLiveBlocks(blocks: FamilyCalendarBlockEntry[]) {
  return [...blocks].sort((a, b) => {
    const aTime = safe(a.startTime) || safe(a.time) || "99:99";
    const bTime = safe(b.startTime) || safe(b.time) || "99:99";
    if (aTime !== bTime) return aTime.localeCompare(bTime);
    return safe(a.title).localeCompare(safe(b.title));
  });
}

function learnerNames(learnerIds: string[], learners: FamilyLearner[]) {
  const labels = learnerIds
    .map((learnerId) => learners.find((learner) => learner.id === learnerId)?.label || "")
    .filter(Boolean);
  return Array.from(new Set(labels));
}

function itemTypeTone(itemType: CalendarItemType) {
  if (itemType === "task") {
    return {
      accent: "#0f766e",
      badge: "border-teal-200 bg-teal-50 text-teal-700",
      surface: "bg-[linear-gradient(180deg,rgba(240,253,250,0.95)_0%,rgba(255,255,255,0.98)_100%)]",
    };
  }
  if (itemType === "appointment") {
    return {
      accent: "#2563eb",
      badge: "border-blue-200 bg-blue-50 text-blue-700",
      surface: "bg-[linear-gradient(180deg,rgba(239,246,255,0.95)_0%,rgba(255,255,255,0.98)_100%)]",
    };
  }
  if (itemType === "playdate") {
    return {
      accent: "#d97706",
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      surface: "bg-[linear-gradient(180deg,rgba(255,251,235,0.95)_0%,rgba(255,255,255,0.98)_100%)]",
    };
  }
  if (itemType === "reminder") {
    return {
      accent: "#7c3aed",
      badge: "border-violet-200 bg-violet-50 text-violet-700",
      surface: "bg-[linear-gradient(180deg,rgba(245,243,255,0.95)_0%,rgba(255,255,255,0.98)_100%)]",
    };
  }
  if (itemType === "custom") {
    return {
      accent: "#475569",
      badge: "border-slate-200 bg-slate-100 text-slate-700",
      surface: "bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(255,255,255,0.98)_100%)]",
    };
  }
  return {
    accent: "#0f766e",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    surface: "bg-[linear-gradient(180deg,rgba(240,253,244,0.95)_0%,rgba(255,255,255,0.98)_100%)]",
  };
}

function subjectAccent(subject: string) {
  const key = safe(subject).toLowerCase();
  if (key.includes("math")) return "#2563eb";
  if (key.includes("numeracy")) return "#0ea5e9";
  if (key.includes("literacy") || key.includes("reading") || key.includes("english")) {
    return "#db2777";
  }
  if (key.includes("writing") || key.includes("spelling") || key.includes("handwriting")) {
    return "#9333ea";
  }
  if (key.includes("science")) return "#059669";
  if (key.includes("art") || key.includes("creative")) return "#7c3aed";
  if (key.includes("history") || key.includes("hass") || key.includes("humanities")) {
    return "#d97706";
  }
  if (key.includes("life") || key.includes("community")) return "#0f766e";
  if (key.includes("nature")) return "#16a34a";
  if (key.includes("sport") || key.includes("movement")) return "#ea580c";
  return "#0f766e";
}

function slotAccentStyle(slot: TemplateSlot): React.CSSProperties {
  if (slot.itemType && slot.itemType !== "learning_block") {
    return { background: itemTypeTone(slot.itemType).accent };
  }
  return { background: subjectAccent(slot.subjectId || slot.label) };
}

function blockAccentStyle(block: FamilyCalendarBlockEntry): React.CSSProperties {
  if (block.itemType && block.itemType !== "learning_block") {
    return { background: itemTypeTone(block.itemType).accent };
  }
  return { background: subjectAccent(block.subject || block.title) };
}

function slotTimeLabel(slot: TemplateSlot) {
  if (safe(slot.startTime) && safe(slot.endTime)) return `${safe(slot.startTime)} - ${safe(slot.endTime)}`;
  if (safe(slot.startTime)) return safe(slot.startTime);
  if (slot.timeBlock === "morning") return "Morning session";
  if (slot.timeBlock === "midday") return "Midday session";
  if (slot.timeBlock === "afternoon") return "Afternoon session";
  return "Template slot";
}

function liveBlockTimeLabel(block: FamilyCalendarBlockEntry) {
  if (safe(block.startTime) && safe(block.endTime)) {
    return `${safe(block.startTime)} - ${safe(block.endTime)}`;
  }
  if (safe(block.startTime)) return safe(block.startTime);
  if (safe(block.time)) return safe(block.time);
  if (block.timeBlock === "morning") return "Morning session";
  if (block.timeBlock === "midday") return "Midday session";
  if (block.timeBlock === "afternoon") return "Afternoon session";
  return "No set time";
}

function matchesLearnerFilter(
  learnerIds: string[] | undefined,
  visibleLearnerIds: string[],
  learners: FamilyLearner[],
) {
  if (!learners.length) return true;
  if (!visibleLearnerIds.length) return false;
  if (!learnerIds?.length) return true;
  return learnerIds.some((learnerId) => visibleLearnerIds.includes(learnerId));
}

function isAllLearnersSelected(learners: FamilyLearner[], visibleLearnerIds: string[]) {
  if (!learners.length) return false;
  return learners.every((learner) => visibleLearnerIds.includes(learner.id));
}

export function CalendarViewSwitcher({
  value,
  onChange,
}: {
  value: CalendarSurfaceView;
  onChange: (next: CalendarSurfaceView) => void;
}) {
  return (
    <section className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <div className={LABEL}>View</div>
          <div className={H3}>Template or live week</div>
        </div>

        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
          {(["template", "week"] as CalendarSurfaceView[]).map((option) => {
            const active = option === value;
            const label = option === "template" ? "Template" : "Week";

            return (
              <button
                key={option}
                type="button"
                onClick={() => onChange(option)}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-[14px] font-semibold transition ${
                  active
                    ? "bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)]"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LearnerVisibilitySidebar({
  learners,
  visibleLearnerIds,
  onToggleAllLearners,
  onToggleLearner,
}: {
  learners: FamilyLearner[];
  visibleLearnerIds: string[];
  onToggleAllLearners: () => void;
  onToggleLearner: (learnerId: string) => void;
}) {
  if (!learners.length) {
    return (
      <aside className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <div className="grid gap-1.5">
          <div className={LABEL}>Learners</div>
          <h2 className={H2}>No learners yet</h2>
          <p className={BODY}>
            Add a learner first to save live calendar items. Template slots can still shape the weekly rhythm.
          </p>
        </div>
      </aside>
    );
  }

  if (learners.length === 1) {
    return (
      <aside className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <div className="grid gap-1.5">
          <div className={LABEL}>Learner</div>
          <h2 className={H2}>Calendar visibility</h2>
        </div>
        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
          <div className={H3}>{learners[0]?.label || "Learner"}</div>
          <p className={META}>This calendar is showing the only learner in the family workspace.</p>
        </div>
      </aside>
    );
  }

  const allSelected = isAllLearnersSelected(learners, visibleLearnerIds);

  return (
    <aside className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="grid gap-1.5">
        <div className={LABEL}>Learner calendars</div>
        <h2 className={H2}>Visibility</h2>
        <p className={META}>Show or hide learners without changing the global active learner.</p>
      </div>

      <label className="flex items-start gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleAllLearners}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-300"
        />
        <span className="grid gap-1">
          <span className="text-[14px] font-semibold text-slate-950">All learners</span>
          <span className="text-[12px] leading-5 text-slate-500">
            Toggle the whole family calendar on or off.
          </span>
        </span>
      </label>

      <div className="grid gap-2">
        {learners.map((learner) => {
          const checked = visibleLearnerIds.includes(learner.id);
          return (
            <label
              key={learner.id}
              className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 transition ${
                checked
                  ? "border-blue-200 bg-blue-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleLearner(learner.id)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-300"
              />
              <span className="grid gap-1">
                <span className="text-[14px] font-semibold text-slate-950">{learner.label}</span>
                <span className="text-[12px] leading-5 text-slate-500">
                  {checked ? "Visible in the week" : "Hidden from the week"}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </aside>
  );
}

function CalendarWeekEditorPanel({
  mode,
  draft,
  weekDays,
  learners,
  errorMessage,
  statusMessage,
  saving,
  deleting,
  canPersistLiveItems,
  onClose,
  onChangeDraft,
  onSave,
  onDelete,
}: {
  mode: CalendarWeekEditorMode;
  draft: CalendarWeekEditorDraft | null;
  weekDays: CalendarWeekDay[];
  learners: FamilyLearner[];
  errorMessage: string;
  statusMessage: string;
  saving: boolean;
  deleting: boolean;
  canPersistLiveItems: boolean;
  onClose: () => void;
  onChangeDraft: (nextDraft: CalendarWeekEditorDraft) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  if (!draft || !mode) {
    return (
      <aside className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <div className={LABEL}>Calendar editor</div>
        <h2 className={H2}>Open a calendar item</h2>
        <p className={BODY}>
          Click an existing card to edit it, or click an empty week cell to quick-add a new item.
        </p>
      </aside>
    );
  }

  const modeMeta =
    mode === "create-live"
      ? {
          eyebrow: "Quick add",
          title: "Create a live calendar item",
          note: canPersistLiveItems
            ? "This saves directly into the live family calendar."
            : "A synced workspace and learner are required before a live item can be saved.",
          saveLabel: "Save item",
          showDelete: false,
        }
      : mode === "edit-live"
        ? {
            eyebrow: "Calendar item",
            title: "Edit this live item",
            note: "This updates the live family calendar entry.",
            saveLabel: "Save changes",
            showDelete: true,
          }
        : {
            eyebrow: "Template slot",
            title: "Edit this weekly rhythm slot",
            note: "This updates the reusable template only. Use Save calendar below to sync it.",
            saveLabel: "Update template slot",
            showDelete: true,
          };

  const activeDayOption =
    weekDays.find((day) => day.key === draft.date) ||
    weekDays.find((day) => day.weekdayValue === draft.dayOfWeek) ||
    weekDays[0] ||
    null;
  const curriculumCount = draft.curriculumOutcomeIds.length;
  const selectedLearnerNames = learnerNames(draft.learnerIds, learners);
  const canToggleLearners = learners.length > 1;

  return (
    <aside className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] xl:sticky xl:top-4 xl:self-start">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1.5">
          <div className={LABEL}>{modeMeta.eyebrow}</div>
          <h2 className={H2}>{modeMeta.title}</h2>
          <p className={META}>{modeMeta.note}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      {errorMessage ? (
        <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {statusMessage ? (
        <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      <label className="grid gap-2">
        <span className={LABEL}>Title</span>
        <input
          className={INPUT}
          value={draft.title}
          onChange={(event) => onChangeDraft({ ...draft, title: event.target.value })}
          placeholder="Add a title"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
        <label className="grid gap-2">
          <span className={LABEL}>Type</span>
          <select
            className={INPUT}
            value={draft.itemType}
            onChange={(event) =>
              onChangeDraft({
                ...draft,
                itemType: event.target.value as CalendarItemType,
                learningArea:
                  event.target.value === "learning_block" ? draft.learningArea : "",
              })
            }
          >
            {CALENDAR_ITEM_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className={LABEL}>Day</span>
          <select
            className={INPUT}
            value={activeDayOption?.key || ""}
            onChange={(event) => {
              const nextDay = weekDays.find((day) => day.key === event.target.value) || null;
              if (!nextDay) return;
              onChangeDraft({
                ...draft,
                date: nextDay.key,
                dayOfWeek: nextDay.weekdayValue,
              });
            }}
          >
            {weekDays.map((day) => (
              <option key={day.key} value={day.key}>
                {day.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
        <label className="grid gap-2">
          <span className={LABEL}>Session</span>
          <select
            className={INPUT}
            value={draft.timeBlock}
            onChange={(event) =>
              onChangeDraft({
                ...draft,
                timeBlock: event.target.value as CalendarTimeBlock,
              })
            }
          >
            {CALENDAR_TIME_BLOCK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className={LABEL}>Start time</span>
          <input
            className={INPUT}
            type="time"
            value={draft.startTime}
            onChange={(event) =>
              onChangeDraft({
                ...draft,
                startTime: event.target.value,
              })
            }
          />
        </label>

        <label className="grid gap-2">
          <span className={LABEL}>End time</span>
          <input
            className={INPUT}
            type="time"
            value={draft.endTime}
            onChange={(event) =>
              onChangeDraft({
                ...draft,
                endTime: event.target.value,
              })
            }
          />
        </label>
      </div>

      {draft.itemType === "learning_block" ? (
        <label className="grid gap-2">
          <span className={LABEL}>Learning area</span>
          <input
            className={INPUT}
            value={draft.learningArea}
            onChange={(event) =>
              onChangeDraft({
                ...draft,
                learningArea: event.target.value,
              })
            }
            placeholder="Literacy"
          />
        </label>
      ) : null}

      <section className="grid gap-3 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4">
        <div className="grid gap-1">
          <div className={LABEL}>Learners</div>
          <div className={META}>
            {draft.kind === "live"
              ? "The first checked learner becomes the primary learner for current persistence."
              : "Template slots can stay broad or be assigned to specific learners."}
          </div>
        </div>

        {!learners.length ? (
          <div className="rounded-[14px] border border-dashed border-slate-200 bg-white px-3 py-3 text-[13px] font-semibold text-slate-500">
            No learners are available yet.
          </div>
        ) : canToggleLearners ? (
          <div className="grid gap-2">
            {learners.map((learner) => {
              const checked = draft.learnerIds.includes(learner.id);
              return (
                <label
                  key={learner.id}
                  className={`flex items-start gap-3 rounded-[14px] border px-3 py-2.5 ${
                    checked ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const nextLearnerIds = checked
                        ? draft.learnerIds.filter((learnerId) => learnerId !== learner.id)
                        : [...draft.learnerIds, learner.id];
                      onChangeDraft({
                        ...draft,
                        learnerIds: nextLearnerIds,
                        primaryLearnerId: nextLearnerIds[0] || null,
                      });
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-300"
                  />
                  <span className="grid gap-0.5">
                    <span className="text-[13px] font-semibold text-slate-950">{learner.label}</span>
                    <span className="text-[12px] text-slate-500">
                      {checked ? "Visible on this item" : "Hidden from this item"}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-3">
            <div className="text-[13px] font-semibold text-slate-950">
              {selectedLearnerNames[0] || learners[0]?.label || "Learner"}
            </div>
            <div className="mt-1 text-[12px] text-slate-500">
              This is the only learner in the current family workspace.
            </div>
          </div>
        )}
      </section>

      <label className="grid gap-2">
        <span className={LABEL}>Notes</span>
        <textarea
          className={`${INPUT} min-h-[96px] py-3`}
          value={draft.notes}
          onChange={(event) => onChangeDraft({ ...draft, notes: event.target.value })}
          placeholder="Add context, next steps, or a reminder"
        />
      </label>

      <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4">
        <div className={LABEL}>Details</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {itemTypeLabel(draft.itemType)}
          </span>
          <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {activeDayOption?.label || "Day"}
          </span>
          <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {CALENDAR_TIME_BLOCK_OPTIONS.find((option) => option.value === draft.timeBlock)?.label ||
              "Session"}
          </span>
          <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {curriculumCount
              ? `${curriculumCount} curriculum link${curriculumCount === 1 ? "" : "s"}`
              : "No curriculum links"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || deleting}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : modeMeta.saveLabel}
        </button>

        {modeMeta.showDelete ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={saving || deleting}
            className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-[14px] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Removing..." : "Remove"}
          </button>
        ) : null}
      </div>
    </aside>
  );
}

export function CalendarWeekView({
  template,
  weekLabel,
  weekDays,
  weekBlocks,
  programs,
  learners,
  visibleLearnerIds,
  selectedCalendarItemKey,
  activeLearnerName,
  loading,
  errorMessage,
  editorMode,
  editorDraft,
  editorErrorMessage,
  editorStatusMessage,
  savingEditor,
  deletingEditor,
  canPersistLiveItems,
  onPreviousWeek,
  onToday,
  onNextWeek,
  onOpenTemplate,
  onToggleAllLearners,
  onToggleLearner,
  onOpenCreateItem,
  onOpenLiveBlock,
  onOpenTemplateSlot,
  onCloseEditor,
  onChangeEditorDraft,
  onSaveEditor,
  onDeleteEditor,
}: {
  template: CalendarTemplate | null;
  weekLabel: string;
  weekDays: CalendarWeekDay[];
  weekBlocks: Record<string, FamilyCalendarBlockEntry[]>;
  programs: Program[];
  learners: FamilyLearner[];
  visibleLearnerIds: string[];
  selectedCalendarItemKey: string;
  activeLearnerName: string;
  loading: boolean;
  errorMessage: string;
  editorMode: CalendarWeekEditorMode;
  editorDraft: CalendarWeekEditorDraft | null;
  editorErrorMessage: string;
  editorStatusMessage: string;
  savingEditor: boolean;
  deletingEditor: boolean;
  canPersistLiveItems: boolean;
  onPreviousWeek: () => void;
  onToday: () => void;
  onNextWeek: () => void;
  onOpenTemplate: () => void;
  onToggleAllLearners: () => void;
  onToggleLearner: (learnerId: string) => void;
  onOpenCreateItem: (day: CalendarWeekDay, timeBlock: CalendarTimeBlock) => void;
  onOpenLiveBlock: (block: FamilyCalendarBlockEntry) => void;
  onOpenTemplateSlot: (slot: TemplateSlot) => void;
  onCloseEditor: () => void;
  onChangeEditorDraft: (nextDraft: CalendarWeekEditorDraft) => void;
  onSaveEditor: () => void;
  onDeleteEditor: () => void;
}) {
  const templateSlots = useMemo(() => template?.slots ?? [], [template]);
  const slotMap = useMemo(
    () => new Map(templateSlots.map((slot) => [slot.id, slot])),
    [templateSlots],
  );
  const programMap = useMemo(
    () => new Map(programs.map((program) => [program.id, program])),
    [programs],
  );

  const dayColumns = useMemo(
    () =>
      weekDays.map((day) => {
        const liveBlocksForDay = sortLiveBlocks(
          (weekBlocks[day.key] ?? []).filter((block) =>
            matchesLearnerFilter(block.learnerIds, visibleLearnerIds, learners),
          ),
        );
        const templateSlotsForDay = sortTemplateSlots(
          templateSlots
            .filter((slot) => slot.dayOfWeek === day.weekdayValue)
            .filter((slot) => matchesLearnerFilter(slot.learnerIds, visibleLearnerIds, learners)),
        );

        const liveBlocksByDaypart: Record<DaypartId, FamilyCalendarBlockEntry[]> = {
          morning: [],
          midday: [],
          afternoon: [],
        };
        const templateSlotsByDaypart: Record<DaypartId, TemplateSlot[]> = {
          morning: [],
          midday: [],
          afternoon: [],
        };

        liveBlocksForDay.forEach((block, index) => {
          liveBlocksByDaypart[blockDaypart(block, slotMap, index)].push(block);
        });

        templateSlotsForDay.forEach((slot, index) => {
          templateSlotsByDaypart[slotDaypart(slot, index)].push(slot);
        });

        return {
          ...day,
          liveBlocksForDay,
          templateSlotsForDay,
          liveBlocksByDaypart,
          templateSlotsByDaypart,
        };
      }),
    [learners, slotMap, templateSlots, visibleLearnerIds, weekBlocks, weekDays],
  );

  const hasTemplateSlots = templateSlots.length > 0;
  const totalVisibleLiveBlocks = dayColumns.reduce(
    (count, day) => count + day.liveBlocksForDay.length,
    0,
  );
  const showSetupState = !hasTemplateSlots && totalVisibleLiveBlocks === 0;
  const allLearnersSelected = isAllLearnersSelected(learners, visibleLearnerIds);

  return (
    <section className="grid gap-5">
      <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="grid gap-2">
            <div className={LABEL}>Week view</div>
            <h2 className={H2}>{weekLabel}</h2>
            <p className={BODY}>My Day reads from this calendar.</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-600">
                {template?.title || "No template selected"}
              </span>
              <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-600">
                {activeLearnerName || "Family week"}
              </span>
              {learners.length > 1 ? (
                <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-600">
                  {allLearnersSelected
                    ? "All learners visible"
                    : `${visibleLearnerIds.length} learner${visibleLearnerIds.length === 1 ? "" : "s"} visible`}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onPreviousWeek}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={onToday}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Today
            </button>
            <button
              type="button"
              onClick={onNextWeek}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] font-semibold text-slate-500">
            Loading live week...
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-800">
            {errorMessage}
          </div>
        ) : null}

        {!hasTemplateSlots ? (
          <div className="flex flex-col gap-3 rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="grid gap-1">
              <div className={H3}>Set your weekly rhythm first</div>
              <div className={META}>
                Week view stays honest about live items. Add template slots first so the rhythm is visible.
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenTemplate}
              className="inline-flex w-fit items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-slate-800"
            >
              Open Template
            </button>
          </div>
        ) : null}

        {!visibleLearnerIds.length && learners.length ? (
          <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] font-semibold text-slate-600">
            No learner calendars are visible. Check All learners or select a learner in the sidebar.
          </div>
        ) : null}
      </section>

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <LearnerVisibilitySidebar
          learners={learners}
          visibleLearnerIds={visibleLearnerIds}
          onToggleAllLearners={onToggleAllLearners}
          onToggleLearner={onToggleLearner}
        />

        {!showSetupState ? (
          <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <div className="grid gap-1.5">
              <div className={LABEL}>Live planner</div>
              <h2 className={H2}>Weekly grid</h2>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[900px] overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50/80">
                <div className="grid grid-cols-[116px_repeat(5,minmax(152px,1fr))] border-b border-slate-200 bg-white">
                  <div className={`${LABEL} px-3 py-3`}>Time</div>
                  {dayColumns.map((day) => (
                    <div
                      key={day.key}
                      className={`border-l border-slate-200 px-3 py-3 ${
                        day.isToday ? "bg-blue-50/70" : ""
                      }`}
                    >
                      <div className={H3}>{day.label}</div>
                      <div className={META}>{day.dateLabel}</div>
                      <div className="mt-1 text-[12px] font-semibold text-slate-500">
                        {day.liveBlocksForDay.length
                          ? `${day.liveBlocksForDay.length} live`
                          : day.templateSlotsForDay.length
                            ? `${day.templateSlotsForDay.length} template`
                            : "No blocks yet"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid">
                  {DAYPARTS.map((daypart) => (
                    <div
                      key={daypart.id}
                      className="grid min-h-[188px] grid-cols-[116px_repeat(5,minmax(152px,1fr))] border-b border-slate-200 last:border-b-0"
                    >
                      <div className="flex items-start px-3 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {daypart.label}
                      </div>

                      {dayColumns.map((day) => {
                        const liveBlocks = day.liveBlocksByDaypart[daypart.id];
                        const occupiedTemplateSlotIds = new Set(
                          liveBlocks
                            .map((block) => safe(block.calendarTemplateSlotId))
                            .filter(Boolean),
                        );
                        const templateSlotsForCell = day.templateSlotsByDaypart[daypart.id].filter(
                          (slot) => !occupiedTemplateSlotIds.has(slot.id),
                        );
                        const hasContent = liveBlocks.length > 0 || templateSlotsForCell.length > 0;

                        return (
                          <div key={`${day.key}-${daypart.id}`} className="border-l border-slate-200 p-2">
                            {hasContent ? (
                              <div className="grid gap-2">
                                {liveBlocks.map((block) => {
                                  const linkedProgram = safe(block.programId)
                                    ? programMap.get(safe(block.programId)) ?? null
                                    : null;
                                  const learnerLabels = learnerNames(block.learnerIds ?? [], learners);
                                  const tone = itemTypeTone(block.itemType || "learning_block");
                                  const selected = selectedCalendarItemKey === `live:${block.id}`;

                                  return (
                                    <button
                                      key={block.id}
                                      type="button"
                                      onClick={() => onOpenLiveBlock(block)}
                                      className={`grid overflow-hidden rounded-[18px] border text-left shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-[1px] ${
                                        tone.surface
                                      } ${
                                        selected
                                          ? "border-blue-300 shadow-[0_0_0_4px_rgba(59,130,246,0.10)]"
                                          : "border-slate-200 hover:border-slate-300"
                                      }`}
                                    >
                                      <div className="h-2" style={blockAccentStyle(block)} />
                                      <div className="grid gap-2 p-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span
                                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone.badge}`}
                                          >
                                            {itemTypeLabel(block.itemType || "learning_block")}
                                          </span>
                                          <span className="inline-flex rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                            {liveBlockTimeLabel(block)}
                                          </span>
                                        </div>

                                        <div className="text-[14px] font-bold leading-5 text-slate-950">
                                          {safe(block.title) || "Learning block"}
                                        </div>

                                        <div className={META}>
                                          {[safe(block.subject), safe(linkedProgram?.title)]
                                            .filter(Boolean)
                                            .join(" - ") || "Live calendar item"}
                                        </div>

                                        {learnerLabels.length ? (
                                          <div className="flex flex-wrap gap-1.5">
                                            {learnerLabels.slice(0, 2).map((label) => (
                                              <span
                                                key={label}
                                                className="inline-flex rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                                              >
                                                {label}
                                              </span>
                                            ))}
                                            {learnerLabels.length > 2 ? (
                                              <span className="inline-flex rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                                +{learnerLabels.length - 2} more
                                              </span>
                                            ) : null}
                                          </div>
                                        ) : null}

                                        {safe(block.note) ? (
                                          <div className="text-[12px] leading-5 text-slate-500">
                                            {safe(block.note)}
                                          </div>
                                        ) : null}
                                      </div>
                                    </button>
                                  );
                                })}

                                {templateSlotsForCell.map((slot) => {
                                  const learnerLabels = learnerNames(slot.learnerIds ?? [], learners);
                                  const tone = itemTypeTone(slot.itemType || "learning_block");
                                  const selected = selectedCalendarItemKey === `template:${slot.id}`;

                                  return (
                                    <button
                                      key={slot.id}
                                      type="button"
                                      onClick={() => onOpenTemplateSlot(slot)}
                                      className={`grid overflow-hidden rounded-[18px] border border-dashed text-left shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-[1px] ${
                                        tone.surface
                                      } ${
                                        selected
                                          ? "border-blue-300 shadow-[0_0_0_4px_rgba(59,130,246,0.10)]"
                                          : "border-slate-200 hover:border-slate-300"
                                      }`}
                                    >
                                      <div className="h-2" style={slotAccentStyle(slot)} />
                                      <div className="grid gap-2 p-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="inline-flex rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                            Template
                                          </span>
                                          <span
                                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone.badge}`}
                                          >
                                            {itemTypeLabel(slot.itemType || "learning_block")}
                                          </span>
                                        </div>

                                        <div className="text-[14px] font-bold leading-5 text-slate-950">
                                          {safe(slot.label) || "Learning block"}
                                        </div>

                                        <div className={META}>
                                          {[safe(slot.subjectId), slotTimeLabel(slot)]
                                            .filter(Boolean)
                                            .join(" - ") || "Template slot"}
                                        </div>

                                        {learnerLabels.length ? (
                                          <div className="flex flex-wrap gap-1.5">
                                            {learnerLabels.slice(0, 2).map((label) => (
                                              <span
                                                key={label}
                                                className="inline-flex rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                                              >
                                                {label}
                                              </span>
                                            ))}
                                            {learnerLabels.length > 2 ? (
                                              <span className="inline-flex rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                                +{learnerLabels.length - 2} more
                                              </span>
                                            ) : null}
                                          </div>
                                        ) : null}

                                        {safe(slot.notes) ? (
                                          <div className="text-[12px] leading-5 text-slate-500">
                                            {safe(slot.notes)}
                                          </div>
                                        ) : null}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenCreateItem(day, daypart.id)}
                                className="flex h-full min-h-[154px] w-full flex-col items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-white/80 px-3 text-center transition hover:border-slate-300 hover:bg-white"
                              >
                                <span className="text-[13px] font-semibold text-slate-700">+ Add slot</span>
                                <span className="mt-1 text-[11px] font-medium text-slate-400">
                                  No blocks yet
                                </span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="grid gap-4 rounded-[24px] border border-dashed border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.03)]">
            <div className={LABEL}>Live planner</div>
            <h2 className={H2}>No blocks yet</h2>
            <p className={BODY}>Add template slots first, then return here to shape the live family week.</p>
          </section>
        )}

        <CalendarWeekEditorPanel
          mode={editorMode}
          draft={editorDraft}
          weekDays={weekDays}
          learners={learners}
          errorMessage={editorErrorMessage}
          statusMessage={editorStatusMessage}
          saving={savingEditor}
          deleting={deletingEditor}
          canPersistLiveItems={canPersistLiveItems}
          onClose={onCloseEditor}
          onChangeDraft={onChangeEditorDraft}
          onSave={onSaveEditor}
          onDelete={onDeleteEditor}
        />
      </div>
    </section>
  );
}
