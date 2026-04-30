"use client";

import React from "react";
import type { CalendarTemplate, TemplateSlot } from "@/lib/familyPlanningTemplates";

export const LABEL = "text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500";
export const H2 = "text-[18px] font-bold tracking-tight text-slate-950";
export const H3 = "text-[15px] font-semibold text-slate-950";
export const BODY = "text-[14px] leading-6 text-slate-600";
export const META = "text-[13px] leading-5 text-slate-500";
export const INPUT =
  "w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100";

export const WEEKDAY_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
];

const DAYPARTS = [
  { id: "morning", label: "Morning" },
  { id: "midday", label: "Midday" },
  { id: "afternoon", label: "Afternoon" },
] as const;

type DaypartId = (typeof DAYPARTS)[number]["id"];

function slotAccentStyle(slot: TemplateSlot): React.CSSProperties {
  const key = `${slot.subjectId || ""} ${slot.label || ""}`.toLowerCase();
  if (key.includes("math")) return { background: "#2563eb" };
  if (key.includes("literacy") || key.includes("reading") || key.includes("english")) {
    return { background: "#db2777" };
  }
  if (key.includes("science")) return { background: "#059669" };
  if (key.includes("art") || key.includes("creative")) return { background: "#7c3aed" };
  if (key.includes("history") || key.includes("humanities")) return { background: "#d97706" };
  return { background: "#0f766e" };
}

function formatSlotTime(slot: TemplateSlot) {
  return [slot.startTime, slot.endTime].filter(Boolean).join(" - ") || "Open time";
}

function sortSlots(slots: TemplateSlot[]) {
  return [...slots].sort((a, b) => {
    const aTime = a.startTime || "99:99";
    const bTime = b.startTime || "99:99";
    return aTime.localeCompare(bTime);
  });
}

function slotDaypart(slot: TemplateSlot, fallbackIndex: number): DaypartId {
  if (slot.startTime) {
    const hour = Number(slot.startTime.split(":")[0]);
    if (Number.isFinite(hour)) {
      if (hour < 12) return "morning";
      if (hour < 14) return "midday";
      return "afternoon";
    }
  }

  if (fallbackIndex === 0) return "morning";
  if (fallbackIndex === 1) return "midday";
  return "afternoon";
}

export function CalendarTemplateSelector({
  templates,
  selectedTemplateId,
  onSelect,
  onCreate,
}: {
  templates: CalendarTemplate[];
  selectedTemplateId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <div className={LABEL}>Templates</div>
          <h2 className={H2}>Weekly rhythms</h2>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-slate-800"
        >
          New template
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const active = template.id === selectedTemplateId;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={`grid gap-1 rounded-[18px] border px-4 py-4 text-left transition ${
                active
                  ? "border-blue-200 bg-blue-50 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <span className={H3}>{template.title}</span>
              <span className={META}>
                {template.slots.length} slot{template.slots.length === 1 ? "" : "s"} - {template.academicStructureType || "Weekly"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function CalendarTemplateGrid({
  slots,
  selectedSlotId,
  onSelectSlot,
}: {
  slots: TemplateSlot[];
  selectedSlotId?: string | null;
  onSelectSlot: (slotId: string) => void;
}) {
  const hasSlots = slots.length > 0;
  const dayColumns = WEEKDAY_OPTIONS.map((day) => {
    const daySlots = sortSlots(slots.filter((slot) => slot.dayOfWeek === day.value));
    const slotsByDaypart: Record<DaypartId, TemplateSlot[]> = {
      morning: [],
      midday: [],
      afternoon: [],
    };

    daySlots.forEach((slot, index) => {
      slotsByDaypart[slotDaypart(slot, index)].push(slot);
    });

    return {
      ...day,
      slots: daySlots,
      slotsByDaypart,
    };
  });

  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="grid gap-1.5">
        <div className={LABEL}>Timetable view</div>
        <h2 className={H2}>Weekly grid</h2>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px] overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50/80">
          <div className="grid grid-cols-[108px_repeat(5,minmax(124px,1fr))] border-b border-slate-200 bg-white">
            <div className={`${LABEL} px-3 py-3`}>Time</div>
            {dayColumns.map((day) => (
              <div key={day.value} className="border-l border-slate-200 px-3 py-3">
                <div className={H3}>{day.label}</div>
                <div className={META}>
                  {day.slots.length ? `${day.slots.length} block${day.slots.length === 1 ? "" : "s"}` : "Open"}
                </div>
              </div>
            ))}
          </div>

          <div className="grid">
            {DAYPARTS.map((daypart) => (
              <div
                key={daypart.id}
                className="grid min-h-[138px] grid-cols-[108px_repeat(5,minmax(124px,1fr))] border-b border-slate-200 last:border-b-0"
              >
                <div className="flex items-start px-3 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {daypart.label}
                </div>
                {dayColumns.map((day) => {
                  const daypartSlots = day.slotsByDaypart[daypart.id];

                  if (!daypartSlots.length) {
                    return (
                      <div key={`${day.value}-${daypart.id}`} className="border-l border-slate-200 p-2">
                        <div className="flex h-full min-h-[104px] items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-white/70 text-[12px] font-semibold text-slate-400">
                          + Add slot
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={`${day.value}-${daypart.id}`} className="grid gap-2 border-l border-slate-200 p-2">
                      {daypartSlots.map((slot) => {
                        const active = slot.id === selectedSlotId;
                        const subjectLabel = slot.subjectId || slot.label;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => onSelectSlot(slot.id)}
                            aria-label={`Edit ${slot.label}`}
                            className={`grid min-h-[104px] overflow-hidden rounded-[16px] border text-left transition ${
                              active
                                ? "border-blue-200 bg-blue-50 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <div className="h-2" style={slotAccentStyle(slot)} />
                            <div className="grid gap-1.5 p-3">
                              <div className="text-[14px] font-bold leading-5 text-slate-950">
                                {subjectLabel}
                              </div>
                              <div className={META}>{formatSlotTime(slot)}</div>
                              <div className="flex flex-wrap gap-1.5">
                                {slot.subjectId && slot.label !== slot.subjectId ? (
                                  <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                    {slot.label}
                                  </span>
                                ) : null}
                                <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                  {active ? "Selected" : "Draft"}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {!hasSlots ? (
        <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-[13px] font-semibold text-slate-500">
          Use the slot editor to add the first block.
        </div>
      ) : null}
    </section>
  );
}

export function CalendarTemplateSlotEditor({
  slot,
  onChange,
  onDelete,
  onAddNew,
}: {
  slot: TemplateSlot | null;
  onChange: (slot: TemplateSlot) => void;
  onDelete: (slotId: string) => void;
  onAddNew: () => void;
}) {
  if (!slot) {
    return (
      <section className="grid gap-3 rounded-[24px] border border-dashed border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.03)]">
        <div className={LABEL}>Slot editor</div>
        <h2 className={H2}>Add the first slot</h2>
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex w-fit items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-slate-800"
        >
          Add slot
        </button>
      </section>
    );
  }

  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1.5">
          <div className={LABEL}>Slot editor</div>
          <h2 className={H2}>Shape this slot</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Add slot
          </button>
          <button
            type="button"
            onClick={() => onDelete(slot.id)}
            className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-[14px] font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className={LABEL}>Day</span>
          <select
            className={INPUT}
            value={slot.dayOfWeek}
            onChange={(event) => onChange({ ...slot, dayOfWeek: Number(event.target.value) })}
          >
            {WEEKDAY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className={LABEL}>Label</span>
          <input
            className={INPUT}
            value={slot.label}
            onChange={(event) => onChange({ ...slot, label: event.target.value })}
            placeholder="Literacy block"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2">
          <span className={LABEL}>Learning area</span>
          <input
            className={INPUT}
            value={slot.subjectId || ""}
            onChange={(event) => onChange({ ...slot, subjectId: event.target.value })}
            placeholder="Literacy"
          />
        </label>
        <label className="grid gap-2">
          <span className={LABEL}>Start time</span>
          <input
            className={INPUT}
            type="time"
            value={slot.startTime || ""}
            onChange={(event) => onChange({ ...slot, startTime: event.target.value })}
          />
        </label>
        <label className="grid gap-2">
          <span className={LABEL}>End time</span>
          <input
            className={INPUT}
            type="time"
            value={slot.endTime || ""}
            onChange={(event) => onChange({ ...slot, endTime: event.target.value })}
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className={LABEL}>Notes</span>
        <textarea
          className={`${INPUT} min-h-[92px] py-3`}
          value={slot.notes || ""}
          onChange={(event) => onChange({ ...slot, notes: event.target.value })}
          placeholder="How this slot usually works"
        />
      </label>
    </section>
  );
}
