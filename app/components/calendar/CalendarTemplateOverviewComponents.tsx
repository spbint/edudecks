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
          <div className={LABEL}>My Calendar Template</div>
          <h2 className={H2}>Choose the weekly rhythm you want to reuse</h2>
          <p className={BODY}>Use one reusable template for a normal week, then let programs drop into those slots later.</p>
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
                {template.slots.length} slot{template.slots.length === 1 ? "" : "s"} • {template.academicStructureType || "Weekly"}
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

  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="grid gap-1.5">
        <div className={LABEL}>Weekly rhythm</div>
        <h2 className={H2}>Template week</h2>
        <p className={BODY}>
          {hasSlots
            ? "Choose a slot to refine it, or add another slot to complete the reusable week."
            : "Add at least one slot so My Programs has a reusable place to land later."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {WEEKDAY_OPTIONS.map((day) => {
          const daySlots = slots.filter((slot) => slot.dayOfWeek === day.value);
          return (
            <article key={day.value} className="grid gap-3 rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="grid gap-0.5">
                <div className={H3}>{day.label}</div>
                <div className={META}>{daySlots.length ? `${daySlots.length} slot${daySlots.length === 1 ? "" : "s"}` : "No slots yet"}</div>
              </div>
              <div className="grid gap-2">
                {daySlots.length ? (
                  daySlots.map((slot) => {
                    const active = slot.id === selectedSlotId;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => onSelectSlot(slot.id)}
                        className={`grid gap-1 rounded-[16px] border px-3 py-3 text-left transition ${
                          active
                            ? "border-blue-200 bg-blue-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className={H3}>{slot.label}</div>
                        <div className={META}>
                          {[slot.subjectId, [slot.startTime, slot.endTime].filter(Boolean).join(" - ")]
                            .filter(Boolean)
                            .join(" • ") || "Open slot"}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-[16px] border border-dashed border-slate-200 bg-white px-3 py-5 text-center text-[13px] font-medium text-slate-500">
                    Add the first slot
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
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
        <h2 className={H2}>Add the first slot to begin</h2>
        <p className={BODY}>Start with one reusable weekly slot, then return to My Programs to map a sequence into it.</p>
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
          <h2 className={H2}>Shape this weekly slot</h2>
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
          placeholder="A gentle note about how this slot usually works..."
        />
      </label>
    </section>
  );
}
