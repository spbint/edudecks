"use client";

import React, { useMemo } from "react";
import type { FamilyCalendarBlockEntry } from "@/lib/familyPlanner";
import type {
  CalendarTemplate,
  Program,
  TemplateSlot,
} from "@/lib/familyPlanningTemplates";
import {
  BODY,
  H2,
  H3,
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

const DAYPARTS = [
  { id: "morning", label: "Morning" },
  { id: "midday", label: "Midday" },
  { id: "afternoon", label: "Afternoon" },
] as const;

type DaypartId = (typeof DAYPARTS)[number]["id"];

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseHourFromValue(value?: string | null) {
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
  const hour = parseHourFromValue(slot.startTime);
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

  const hour = parseHourFromValue(block.time);
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
    const aTime = safe(a.time) || "99:99";
    const bTime = safe(b.time) || "99:99";
    if (aTime !== bTime) return aTime.localeCompare(bTime);
    return safe(a.title).localeCompare(safe(b.title));
  });
}

function slotAccentStyle(slot: TemplateSlot): React.CSSProperties {
  const key = `${slot.subjectId || ""} ${slot.label || ""}`.toLowerCase();
  if (key.includes("math")) return { background: "#2563eb" };
  if (key.includes("numeracy")) return { background: "#0ea5e9" };
  if (key.includes("literacy") || key.includes("reading") || key.includes("english")) {
    return { background: "#db2777" };
  }
  if (key.includes("writing") || key.includes("spelling") || key.includes("handwriting")) {
    return { background: "#9333ea" };
  }
  if (key.includes("science")) return { background: "#059669" };
  if (key.includes("art") || key.includes("creative")) return { background: "#7c3aed" };
  if (key.includes("history") || key.includes("hass") || key.includes("humanities")) {
    return { background: "#d97706" };
  }
  if (key.includes("life")) return { background: "#0f766e" };
  if (key.includes("nature")) return { background: "#16a34a" };
  if (key.includes("sport") || key.includes("movement")) return { background: "#ea580c" };
  return { background: "#0f766e" };
}

function blockAccentStyle(block: FamilyCalendarBlockEntry): React.CSSProperties {
  const key = `${block.subject || ""} ${block.title || ""}`.toLowerCase();
  if (key.includes("math")) return { background: "#2563eb" };
  if (key.includes("numeracy")) return { background: "#0ea5e9" };
  if (key.includes("literacy") || key.includes("reading") || key.includes("english")) {
    return { background: "#db2777" };
  }
  if (key.includes("writing") || key.includes("spelling") || key.includes("handwriting")) {
    return { background: "#9333ea" };
  }
  if (key.includes("science")) return { background: "#059669" };
  if (key.includes("art") || key.includes("creative")) return { background: "#7c3aed" };
  if (key.includes("history") || key.includes("hass") || key.includes("humanities")) {
    return { background: "#d97706" };
  }
  if (key.includes("life")) return { background: "#0f766e" };
  if (key.includes("nature")) return { background: "#16a34a" };
  if (key.includes("sport") || key.includes("movement")) return { background: "#ea580c" };
  return { background: "#0f766e" };
}

function slotTimeLabel(slot: TemplateSlot) {
  return [slot.startTime, slot.endTime].filter(Boolean).join(" - ") || "Template slot";
}

function liveBlockTimeLabel(block: FamilyCalendarBlockEntry) {
  return safe(block.time) || "No set time";
}

function liveBlockBadgeLabel(block: FamilyCalendarBlockEntry) {
  return block.sourceType === "generated" ? "Program block" : "Live block";
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

export function CalendarWeekView({
  template,
  weekLabel,
  weekDays,
  weekBlocks,
  programs,
  activeLearnerName,
  loading,
  errorMessage,
  onPreviousWeek,
  onToday,
  onNextWeek,
  onOpenTemplate,
}: {
  template: CalendarTemplate | null;
  weekLabel: string;
  weekDays: CalendarWeekDay[];
  weekBlocks: Record<string, FamilyCalendarBlockEntry[]>;
  programs: Program[];
  activeLearnerName: string;
  loading: boolean;
  errorMessage: string;
  onPreviousWeek: () => void;
  onToday: () => void;
  onNextWeek: () => void;
  onOpenTemplate: () => void;
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
        const liveBlocksForDay = sortLiveBlocks(weekBlocks[day.key] ?? []);
        const templateSlotsForDay = sortTemplateSlots(
          templateSlots.filter((slot) => slot.dayOfWeek === day.weekdayValue),
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
    [slotMap, templateSlots, weekBlocks, weekDays],
  );

  const hasTemplateSlots = templateSlots.length > 0;
  const totalLiveBlocks = dayColumns.reduce(
    (count, day) => count + day.liveBlocksForDay.length,
    0,
  );
  const showSetupState = !hasTemplateSlots && totalLiveBlocks === 0;

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
                {activeLearnerName || "Template rhythm only"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onPreviousWeek}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← Previous
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
              Next →
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
                Week view stays honest about live blocks. Add template slots first so the rhythm is visible.
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
      </section>

      {!showSetupState ? (
        <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
          <div className="grid gap-1.5">
            <div className={LABEL}>Live planner</div>
            <h2 className={H2}>Weekly grid</h2>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[860px] overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50/80">
              <div className="grid grid-cols-[112px_repeat(5,minmax(148px,1fr))] border-b border-slate-200 bg-white">
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
                    className="grid min-h-[176px] grid-cols-[112px_repeat(5,minmax(148px,1fr))] border-b border-slate-200 last:border-b-0"
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

                                return (
                                  <article
                                    key={block.id}
                                    className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
                                  >
                                    <div className="h-2" style={blockAccentStyle(block)} />
                                    <div className="grid gap-2 p-3">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                                          {liveBlockBadgeLabel(block)}
                                        </span>
                                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                          {liveBlockTimeLabel(block)}
                                        </span>
                                      </div>
                                      <div className="text-[14px] font-bold leading-5 text-slate-950">
                                        {safe(block.title) || "Learning block"}
                                      </div>
                                      <div className={META}>
                                        {[safe(block.subject), safe(linkedProgram?.title)]
                                          .filter(Boolean)
                                          .join(" - ") || "Live calendar block"}
                                      </div>
                                      {safe(block.note) ? (
                                        <div className="text-[12px] leading-5 text-slate-500">
                                          {safe(block.note)}
                                        </div>
                                      ) : null}
                                    </div>
                                  </article>
                                );
                              })}

                              {templateSlotsForCell.map((slot) => (
                                <article
                                  key={slot.id}
                                  className="overflow-hidden rounded-[16px] border border-dashed border-slate-200 bg-slate-50/85"
                                >
                                  <div className="h-2" style={slotAccentStyle(slot)} />
                                  <div className="grid gap-2 p-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                        Template
                                      </span>
                                      <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                        {slotTimeLabel(slot)}
                                      </span>
                                    </div>
                                    <div className="text-[14px] font-bold leading-5 text-slate-950">
                                      {safe(slot.label) || "Learning block"}
                                    </div>
                                    <div className={META}>
                                      {safe(slot.subjectId) || "Learning block"}
                                    </div>
                                    {safe(slot.notes) ? (
                                      <div className="text-[12px] leading-5 text-slate-500">
                                        {safe(slot.notes)}
                                      </div>
                                    ) : null}
                                  </div>
                                </article>
                              ))}
                            </div>
                          ) : (
                            <div className="flex h-full min-h-[142px] items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-white/70 px-3 text-center text-[12px] font-semibold text-slate-400">
                              No blocks yet
                            </div>
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
      ) : null}
    </section>
  );
}
