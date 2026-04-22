"use client";

import React from "react";
import Link from "next/link";
import type {
  CalendarTemplate,
  Program,
  ProgramSegment,
  TemplateSlot,
} from "@/lib/familyPlanningTemplates";

export const LABEL = "text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500";
export const H2 = "text-[18px] font-bold tracking-tight text-slate-950";
export const H3 = "text-[15px] font-semibold text-slate-950";
export const BODY = "text-[14px] leading-6 text-slate-600";
export const META = "text-[13px] leading-5 text-slate-500";
export const INPUT =
  "w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100";

export function ProgramList({
  programs,
  selectedProgramId,
  onSelect,
  onCreate,
}: {
  programs: Program[];
  selectedProgramId?: string;
  onSelect: (programId: string) => void;
  onCreate: () => void;
}) {
  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <div className={LABEL}>My Programs</div>
          <h2 className={H2}>Shape the longer sequence before it reaches the live week</h2>
          <p className={BODY}>Build reusable units, terms, or sequences here, then place them into your calendar rhythm when you are ready.</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-slate-800"
        >
          New program
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {programs.map((program) => {
          const active = program.id === selectedProgramId;
          return (
            <button
              key={program.id}
              type="button"
              onClick={() => onSelect(program.id)}
              className={`grid gap-1 rounded-[18px] border px-4 py-4 text-left transition ${
                active
                  ? "border-blue-200 bg-blue-50 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <span className={H3}>{program.title}</span>
              <span className={META}>
                {[program.subjectId, program.periodLabel].filter(Boolean).join(" • ")}
              </span>
              <span className={META}>
                {program.segments.length} segment{program.segments.length === 1 ? "" : "s"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function ProgramEditor({
  program,
  onChange,
}: {
  program: Program | null;
  onChange: (program: Program) => void;
}) {
  if (!program) {
    return (
      <section className="rounded-[24px] border border-dashed border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.03)]">
        <div className={LABEL}>Program onboarding</div>
        <h2 className={`mt-2 ${H2}`}>Move from template to live plan in three gentle steps</h2>
        <div className="mt-4 grid gap-3">
          {[
            {
              step: "Step 1",
              title: "Create calendar template",
              note: "Set up the reusable weekly rhythm your programs can land inside.",
            },
            {
              step: "Step 2",
              title: "Build program",
              note: "Shape a term, unit, or sequence without scheduling every week manually.",
            },
            {
              step: "Step 3",
              title: "Generate into plan",
              note: "Drop the program into a calendar slot and let My Plan pre-populate the live week.",
            },
          ].map((item) => (
            <article
              key={item.step}
              className="grid gap-1 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4"
            >
              <div className={LABEL}>{item.step}</div>
              <div className={H3}>{item.title}</div>
              <div className={BODY}>{item.note}</div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="grid gap-1.5">
        <div className={LABEL}>Program template</div>
        <h2 className={H2}>Shape this program</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className={LABEL}>Title</span>
          <input className={INPUT} value={program.title} onChange={(event) => onChange({ ...program, title: event.target.value })} />
        </label>
        <label className="grid gap-2">
          <span className={LABEL}>Subject</span>
          <input className={INPUT} value={program.subjectId} onChange={(event) => onChange({ ...program, subjectId: event.target.value })} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <label className="grid gap-2">
          <span className={LABEL}>Period type</span>
          <select className={INPUT} value={program.periodType} onChange={(event) => onChange({ ...program, periodType: event.target.value as Program["periodType"] })}>
            <option value="term">Term</option>
            <option value="semester">Semester</option>
            <option value="season">Season</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className={LABEL}>Period label</span>
          <input className={INPUT} value={program.periodLabel} onChange={(event) => onChange({ ...program, periodLabel: event.target.value })} />
        </label>
        <label className="grid gap-2">
          <span className={LABEL}>Duration</span>
          <input
            className={INPUT}
            inputMode="numeric"
            value={program.durationCount}
            onChange={(event) => onChange({ ...program, durationCount: Number(event.target.value || 0) || 1 })}
          />
        </label>
        <label className="grid gap-2">
          <span className={LABEL}>Segment type</span>
          <select className={INPUT} value={program.segmentType} onChange={(event) => onChange({ ...program, segmentType: event.target.value as Program["segmentType"] })}>
            <option value="week">Week</option>
            <option value="sequence">Sequence</option>
            <option value="focus">Focus</option>
            <option value="custom">Custom</option>
          </select>
        </label>
      </div>
    </section>
  );
}

export function ProgramSegmentCard({
  segment,
  onChange,
  onAttachCurriculum,
}: {
  segment: ProgramSegment;
  onChange: (segment: ProgramSegment) => void;
  onAttachCurriculum: (segmentId: string) => void;
}) {
  return (
    <article className="grid gap-4 rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className={LABEL}>Segment {segment.order}</div>
          <div className={H3}>{segment.title}</div>
        </div>
        <button
          type="button"
          onClick={() => onAttachCurriculum(segment.id)}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          {segment.curriculumOutcomeIds.length ? "Edit curriculum" : "Add curriculum"}
        </button>
      </div>

      <input
        className={INPUT}
        value={segment.title}
        onChange={(event) => onChange({ ...segment, title: event.target.value })}
        placeholder="Segment title"
      />
      <textarea
        className={`${INPUT} min-h-[88px] py-3`}
        value={segment.notes || ""}
        onChange={(event) => onChange({ ...segment, notes: event.target.value })}
        placeholder="What is the main focus of this part of the program?"
      />
      <div className={META}>
        {segment.curriculumOutcomeIds.length
          ? `${segment.curriculumOutcomeIds.length} linked outcome${segment.curriculumOutcomeIds.length === 1 ? "" : "s"}`
          : "No linked outcomes yet"}
      </div>
    </article>
  );
}

export function ProgramCalendarAssignmentPanel({
  templates,
  selectedTemplateId,
  selectedSlotId,
  startDate,
  onTemplateChange,
  onSlotChange,
  onStartDateChange,
  onGenerate,
  generating,
}: {
  templates: CalendarTemplate[];
  selectedTemplateId: string;
  selectedSlotId: string;
  startDate: string;
  onTemplateChange: (value: string) => void;
  onSlotChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onGenerate: () => void;
  generating?: boolean;
}) {
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;
  const slots = selectedTemplate?.slots || [];
  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) ?? null;

  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="grid gap-1.5">
        <div className={LABEL}>Program to calendar</div>
        <h2 className={H2}>Choose where this program should land</h2>
        <p className={BODY}>Assign the program to a reusable calendar slot, choose the start week, then generate it into the live planner.</p>
      </div>

      {!templates.length ? (
        <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
          <div className={H3}>No calendar template yet</div>
          <div className={`mt-2 ${BODY}`}>Set up your weekly rhythm to begin generating plans.</div>
          <Link
            href="/calendar"
            className="mt-4 inline-flex w-fit items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Create calendar template
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2">
          <span className={LABEL}>Calendar template</span>
          <select className={INPUT} value={selectedTemplateId} onChange={(event) => onTemplateChange(event.target.value)}>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className={LABEL}>Template slot</span>
          <select className={INPUT} value={selectedSlotId} onChange={(event) => onSlotChange(event.target.value)}>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className={LABEL}>Start date</span>
          <input className={INPUT} type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} />
        </label>
      </div>

      <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4">
        <div className={H3}>{selectedSlot?.label || "No slot selected"}</div>
        <div className={`mt-1 ${META}`}>
          {[selectedSlot?.subjectId, [selectedSlot?.startTime, selectedSlot?.endTime].filter(Boolean).join(" - ")]
            .filter(Boolean)
            .join(" • ") || "Choose a slot to continue"}
        </div>
        <div className={`mt-3 ${BODY}`}>
          Generation will place each program segment into the next matching week for this slot, then open those blocks in My Plan for live adjustment.
        </div>
      </div>

      <div className="grid gap-3">
        {!selectedTemplateId || !selectedSlotId || !startDate ? (
          <div className={META}>
            Choose a calendar template, one slot, and a start date to generate the live sequence.
          </div>
        ) : (
          <div className={META}>
            The first segment will land in the first matching week, then the rest will flow forward one week at a time.
          </div>
        )}
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating || !selectedTemplateId || !selectedSlotId || !startDate}
          className="inline-flex w-fit items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {generating ? "Generating..." : "Generate to My Plan"}
        </button>
      </div>
    </section>
  );
}
