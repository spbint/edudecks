"use client";

import React from "react";
import Link from "next/link";
import type {
  CalendarTemplate,
  Program,
  ProgramSegment,
} from "@/lib/familyPlanningTemplates";

export const LABEL = "text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500";
export const H2 = "text-[18px] font-bold tracking-tight text-slate-950";
export const H3 = "text-[15px] font-semibold text-slate-950";
export const BODY = "text-[14px] leading-5 text-slate-600";
export const META = "text-[13px] leading-5 text-slate-500";
export const INPUT =
  "w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100";

const CHIP_BASE =
  "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]";

function readinessForProgram(program: Program) {
  if (!program.segments.length) {
    return {
      label: "Needs segment",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (!program.scheduleMapping?.calendarTemplateSlotId) {
    return {
      label: "Needs slot",
      tone: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  return {
    label: "Ready",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function readinessForSegment(segment: ProgramSegment, hasSlot: boolean) {
  if (!segment.title.trim()) {
    return {
      label: "Needs segment",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (!hasSlot) {
    return {
      label: "Needs slot",
      tone: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  return {
    label: "Ready",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

export function ProgramsFirstRunCard({
  onStartSetup,
  onLearnHow,
  primaryLabel = "Start setup",
  hasCalendarTemplate = false,
  hasProgram = false,
  generationReady = false,
  hasGeneratedItems = false,
}: {
  onStartSetup: () => void;
  onLearnHow?: () => void;
  primaryLabel?: string;
  hasCalendarTemplate?: boolean;
  hasProgram?: boolean;
  generationReady?: boolean;
  hasGeneratedItems?: boolean;
}) {
  const steps = [
    {
      step: "Step 1",
      title: "Set your weekly rhythm",
      note: hasCalendarTemplate ? "My Calendar rhythm is ready." : "Use My Calendar to set the repeating weekly shape first.",
      stateLabel: hasCalendarTemplate ? "Complete" : "Next",
      stateTone: hasCalendarTemplate
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-blue-200 bg-blue-50 text-blue-700",
      cta: !hasCalendarTemplate ? "Open My Calendar" : null,
    },
    {
      step: "Step 2",
      title: "Shape your sequence",
      note: hasProgram ? "Your first sequence is ready to edit." : "Use My Programs to shape the first learning sequence.",
      stateLabel: hasProgram ? "Active" : hasCalendarTemplate ? "Next" : "Waiting",
      stateTone: hasProgram
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : hasCalendarTemplate
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-slate-50 text-slate-600",
      cta: hasCalendarTemplate && !hasProgram ? "Start program" : null,
    },
    {
      step: "Step 3",
      title: "Open the live week",
      note: hasGeneratedItems
        ? "The live week already has generated program blocks."
        : generationReady
          ? "Your sequence is ready to flow into My Calendar."
          : "Choose the weekly slot and the first start date when you are ready.",
      stateLabel: hasGeneratedItems ? "Complete" : generationReady ? "Ready" : hasProgram ? "Upcoming" : "Later",
      stateTone: hasGeneratedItems
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : generationReady
          ? "border-violet-200 bg-violet-50 text-violet-700"
        : "border-slate-200 bg-slate-50 text-slate-600",
      cta: hasGeneratedItems ? "Open My Calendar" : generationReady ? "Generate into My Calendar" : null,
    },
  ] as const;

  return (
    <section className="grid gap-4 rounded-[24px] border border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.94)_100%)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="grid gap-1.5">
        <div className={LABEL}>Getting started</div>
        <h2 className={H2}>Build your first program</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((item) => (
          <article
            key={item.step}
            className="grid gap-1 rounded-[18px] border border-slate-200 bg-white/90 px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className={LABEL}>{item.step}</div>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] ${item.stateTone}`}
              >
                {item.stateLabel}
              </span>
            </div>
            <div className={H3}>{item.title}</div>
            <div className={META}>{item.note}</div>
            {item.cta ? <div className="pt-1 text-[13px] font-semibold text-slate-700">{item.cta}</div> : null}
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onStartSetup}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-slate-800"
        >
          {primaryLabel}
        </button>
        {onLearnHow ? (
          <button
            type="button"
            onClick={onLearnHow}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View planner
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function ProgramsGuidedSetupBanner({
  title,
  note,
}: {
  title: string;
  note: string;
}) {
  return (
    <section className="rounded-[20px] border border-slate-200 bg-slate-50/80 px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
      <div className={LABEL}>Guided setup</div>
      <div className={`mt-2 ${H3}`}>{title}</div>
      <div className={`mt-1 ${BODY}`}>{note}</div>
    </section>
  );
}

export function ProgramGenerationSuccessBanner({
  count,
  onOpenPlan,
  onStayHere,
}: {
  count: number;
  onOpenPlan: () => void;
  onStayHere: () => void;
}) {
  return (
    <section className="grid gap-4 rounded-[24px] border border-emerald-200 bg-emerald-50/90 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="grid gap-1.5">
        <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Generation complete
        </div>
        <h2 className={H2}>{count} block{count === 1 ? "" : "s"} generated into My Calendar</h2>
        <p className={META}>Open My Calendar to adjust the live week.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onOpenPlan}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-slate-800"
        >
          Open My Calendar
        </button>
        <button
          type="button"
          onClick={onStayHere}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Stay here
        </button>
      </div>
    </section>
  );
}

export function ProgramList({
  programs,
  selectedProgramId,
  onSelect,
  onCreate,
  firstRun = false,
}: {
  programs: Program[];
  selectedProgramId?: string;
  onSelect: (programId: string) => void;
  onCreate: () => void;
  firstRun?: boolean;
}) {
  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <div className={LABEL}>My Programs</div>
          <h2 className={H2}>Program list</h2>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-[14px] font-semibold transition ${
            firstRun
              ? "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              : "bg-slate-950 text-white hover:bg-slate-800"
          }`}
        >
          New program
        </button>
      </div>

      {!programs.length ? (
        <div className="grid gap-3 rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
          <div className={H3}>No programs yet</div>
          <div className={BODY}>Start with one short sequence you can place into the week.</div>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex w-fit items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-slate-800"
          >
            New program
          </button>
        </div>
      ) : null}

      <div className="grid gap-3">
        {programs.map((program) => {
          const active = program.id === selectedProgramId;
          const readiness = readinessForProgram(program);
          return (
            <button
              key={program.id}
              type="button"
              onClick={() => onSelect(program.id)}
              aria-current={active ? "true" : undefined}
              className={`relative grid gap-3 overflow-hidden rounded-[18px] border px-4 py-4 text-left transition ${
                active
                  ? firstRun
                    ? "border-amber-200 bg-amber-50 shadow-[0_0_0_4px_rgba(251,191,36,0.12)]"
                    : "border-blue-200 bg-blue-50 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-y-0 left-0 w-1 ${active ? "bg-slate-950" : "bg-transparent"}`}
              />
              <div className="flex items-start justify-between gap-3">
                <span className={H3}>{program.title}</span>
                <span className={`${CHIP_BASE} ${readiness.tone}`}>
                  {readiness.label}
                </span>
              </div>
              <span className={META}>
                {[program.subjectId, program.periodLabel].filter(Boolean).join(" • ")}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-semibold text-slate-600">
                  {program.segments.length} segment{program.segments.length === 1 ? "" : "s"}
                </span>
                <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-semibold text-slate-600">
                  {program.periodLabel || "Draft"}
                </span>
              </div>
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
        <div className={LABEL}>Program detail</div>
        <h2 className={`mt-2 ${H2}`}>No program selected</h2>
      </section>
    );
  }

  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="grid gap-1.5">
        <div className={LABEL}>Program setup</div>
        <h2 className={H2}>Name and span</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className={LABEL}>Title</span>
          <input
            className={INPUT}
            value={program.title}
            onChange={(event) => onChange({ ...program, title: event.target.value })}
          />
        </label>
        <label className="grid gap-2">
          <span className={LABEL}>Subject</span>
          <input
            className={INPUT}
            value={program.subjectId}
            onChange={(event) => onChange({ ...program, subjectId: event.target.value })}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <label className="grid gap-2">
          <span className={LABEL}>Period type</span>
          <select
            className={INPUT}
            value={program.periodType}
            onChange={(event) =>
              onChange({ ...program, periodType: event.target.value as Program["periodType"] })
            }
          >
            <option value="term">Term</option>
            <option value="semester">Semester</option>
            <option value="season">Season</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className={LABEL}>Period label</span>
          <input
            className={INPUT}
            value={program.periodLabel}
            onChange={(event) => onChange({ ...program, periodLabel: event.target.value })}
          />
        </label>
        <label className="grid gap-2">
          <span className={LABEL}>Duration</span>
          <input
            className={INPUT}
            inputMode="numeric"
            value={program.durationCount}
            onChange={(event) =>
              onChange({ ...program, durationCount: Number(event.target.value || 0) || 1 })
            }
          />
        </label>
        <label className="grid gap-2">
          <span className={LABEL}>Segment type</span>
          <select
            className={INPUT}
            value={program.segmentType}
            onChange={(event) =>
              onChange({ ...program, segmentType: event.target.value as Program["segmentType"] })
            }
          >
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
  hasSlot = true,
  onChange,
  onAttachCurriculum,
}: {
  segment: ProgramSegment;
  hasSlot?: boolean;
  onChange: (segment: ProgramSegment) => void;
  onAttachCurriculum: (segmentId: string) => void;
}) {
  const readiness = readinessForSegment(segment, hasSlot);

  return (
    <article className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
      <div className="grid md:grid-cols-[74px_minmax(0,1fr)]">
        <div className="flex items-start justify-center bg-slate-950 px-4 py-5 text-white">
          <div className="grid gap-1 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
              Seg
            </span>
            <span className="text-[22px] font-bold">{segment.order}</span>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-1">
              <div className={LABEL}>Segment {segment.order}</div>
              <div className={H3}>{segment.title || "Untitled segment"}</div>
              {segment.notes ? <div className={META}>{segment.notes}</div> : null}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <span className={`${CHIP_BASE} ${readiness.tone}`}>{readiness.label}</span>
              <button
                type="button"
                onClick={() => onAttachCurriculum(segment.id)}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {segment.curriculumOutcomeIds.length ? "Edit curriculum" : "Add curriculum"}
              </button>
            </div>
          </div>

          <input
            className={INPUT}
            value={segment.title}
            onChange={(event) => onChange({ ...segment, title: event.target.value })}
            placeholder="Segment title"
          />
          <textarea
            className={`${INPUT} min-h-[78px] py-3`}
            value={segment.notes || ""}
            onChange={(event) => onChange({ ...segment, notes: event.target.value })}
            placeholder="Focus for this segment"
          />
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-semibold text-slate-600">
              {segment.curriculumOutcomeIds.length
                ? `${segment.curriculumOutcomeIds.length} outcome${segment.curriculumOutcomeIds.length === 1 ? "" : "s"}`
                : "No outcomes"}
            </span>
          </div>
        </div>
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
  generationReady,
  hasLearner,
  hasSegments,
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
  generationReady: boolean;
  hasLearner: boolean;
  hasSegments: boolean;
}) {
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? null;
  const slots = selectedTemplate?.slots || [];
  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) ?? null;
  const state = !templates.length
    ? "blocked_template"
    : !selectedTemplateId
      ? "ready_choose_template"
      : !slots.length
        ? "blocked_slots"
        : !selectedSlotId
          ? "ready_choose_slot"
          : !startDate
            ? "ready_choose_date"
            : !hasLearner
              ? "blocked_learner"
              : !hasSegments
                ? "blocked_segments"
            : generationReady
              ? "ready_generate"
              : "partial";
  const panelTitle =
    state === "blocked_template"
      ? "Set your weekly rhythm first"
      : state === "blocked_slots"
        ? "Create a slot to continue"
        : state === "ready_choose_slot"
          ? "Choose a slot to continue"
          : state === "ready_choose_date"
            ? "Choose when this sequence should begin"
            : state === "blocked_learner"
              ? "Choose a learner to generate"
              : state === "blocked_segments"
                ? "Add at least one segment"
            : state === "ready_generate"
              ? "Generate into My Calendar"
              : "Choose where this program should land";
  const panelNote =
    state === "blocked_template"
      ? "Choose a calendar slot"
      : state === "blocked_slots"
        ? "Choose a calendar slot"
        : state === "ready_choose_slot"
        ? "Choose a calendar slot"
        : state === "ready_choose_date"
          ? "Choose a start date"
          : state === "blocked_learner"
            ? "Choose a learner"
            : state === "blocked_segments"
              ? "Add at least one segment"
            : state === "ready_generate"
              ? "Generate blocks into My Calendar."
              : "Choose a calendar slot";

  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="grid gap-1.5">
        <div className={LABEL}>Calendar slot</div>
        <h2 className={H2}>{panelTitle}</h2>
        <p className={BODY}>Choose where this program belongs in the week.</p>
      </div>

      {!templates.length ? (
        <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
          <div className={H3}>My Calendar rhythm not set yet</div>
          <Link
            href="/my-calendar"
            className="mt-4 inline-flex w-fit items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Open My Calendar
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2">
          <span className={LABEL}>Calendar template</span>
          <select
            className={INPUT}
            value={selectedTemplateId}
            onChange={(event) => onTemplateChange(event.target.value)}
            disabled={!templates.length}
          >
            {!templates.length ? <option value="">Open My Calendar first</option> : null}
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className={LABEL}>Calendar slot</span>
          <select
            className={INPUT}
            value={selectedSlotId}
            onChange={(event) => onSlotChange(event.target.value)}
            disabled={!slots.length}
          >
            {!slots.length ? <option value="">Create a slot to continue</option> : null}
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className={LABEL}>Start date</span>
          <input
            className={INPUT}
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            disabled={!selectedTemplateId || !slots.length}
          />
        </label>
      </div>

      <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4">
        <div className={LABEL}>Selected slot</div>
        <div className={`mt-2 ${H3}`}>{selectedSlot?.label || "No slot selected"}</div>
        <div className={`mt-1 ${META}`}>
          {[
            selectedSlot?.subjectId,
            [selectedSlot?.startTime, selectedSlot?.endTime].filter(Boolean).join(" - "),
          ]
            .filter(Boolean)
            .join(" • ") || "Choose a slot to continue"}
        </div>
      </div>

      <div className="grid gap-3">
        {!templates.length ? (
          <div className={META}>Choose a calendar slot</div>
        ) : !selectedTemplateId ? (
          <div className={META}>Choose a calendar slot</div>
        ) : !slots.length ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className={META}>Choose a calendar slot</div>
            <Link
              href="/my-calendar"
              className="inline-flex w-fit items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Open My Calendar
            </Link>
          </div>
        ) : !selectedSlotId ? (
          <div className={META}>Choose a calendar slot</div>
        ) : !startDate ? (
          <div className={META}>Choose a start date</div>
        ) : !hasLearner ? (
          <div className={META}>Choose a learner</div>
        ) : !hasSegments ? (
          <div className={META}>Add at least one segment</div>
        ) : (
          <div className={META}>{panelNote}</div>
        )}
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating || !generationReady}
          className="inline-flex w-fit items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {generating ? "Generating..." : "Generate into My Calendar"}
        </button>
      </div>
    </section>
  );
}
