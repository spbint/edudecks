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
          ? "Your sequence is ready to flow into My Plan."
          : "Choose the weekly slot and the first start date when you are ready.",
      stateLabel: hasGeneratedItems ? "Complete" : generationReady ? "Ready" : hasProgram ? "Upcoming" : "Later",
      stateTone: hasGeneratedItems
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : generationReady
          ? "border-violet-200 bg-violet-50 text-violet-700"
        : "border-slate-200 bg-slate-50 text-slate-600",
      cta: hasGeneratedItems ? "Open My Plan" : generationReady ? "Generate into My Plan" : null,
    },
  ] as const;

  return (
    <section className="grid gap-4 rounded-[24px] border border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.94)_100%)] p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="grid gap-1.5">
        <div className={LABEL}>Getting started</div>
        <h2 className={H2}>Build your first program</h2>
        <p className={BODY}>
          My Programs is where the longer sequence comes together before it drops into My Calendar and opens into My Plan.
        </p>
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
            Learn how it works
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
        <h2 className={H2}>Your program is now live in your weekly plan</h2>
        <p className={BODY}>
          {count} live planning block{count === 1 ? "" : "s"} {count === 1 ? "is" : "are"} ready in My Plan and can be adjusted there at any time.
        </p>
        <p className={META}>Program generated into My Plan. Open My Plan to adjust the week.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onOpenPlan}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-slate-800"
        >
          Open My Plan
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
  const heading = firstRun ? "Your first program is ready to shape" : "Shape the longer sequence before it reaches the live week";
  const support = firstRun
    ? "Start with the sample program below, rename what you need, then map it into one calendar slot."
    : "Build reusable units, terms, or sequences here, then place them into My Calendar so they can flow into My Plan.";

  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <div className={LABEL}>My Programs</div>
          <h2 className={H2}>{heading}</h2>
          <p className={BODY}>{support}</p>
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
                  ? firstRun
                    ? "border-amber-200 bg-amber-50 shadow-[0_0_0_4px_rgba(251,191,36,0.12)]"
                    : "border-blue-200 bg-blue-50 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <span className={LABEL}>{firstRun ? "Your first program" : "Program"}</span>
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
        <div className={LABEL}>Your first program</div>
        <h2 className={H2}>Shape this program</h2>
        <p className={BODY}>
          Start by renaming the title or adjusting one segment. You can refine the rest after it reaches the live week.
        </p>
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
  generationReady,
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
            : state === "ready_generate"
              ? "Generate into My Plan"
              : "Choose where this program should land";
  const panelNote =
    state === "blocked_template"
      ? "Use My Calendar first, then return here to place this sequence into one reusable weekly slot."
      : state === "blocked_slots"
        ? "This template exists, but it still needs at least one reusable slot before generation can begin."
        : state === "ready_choose_slot"
          ? "Pick the slot that best matches where this program should usually land in the week."
          : state === "ready_choose_date"
            ? "Choose the first week this program should begin, then generation will become available."
            : state === "ready_generate"
              ? "This will place each segment into the next matching week and open those generated blocks in My Plan for live adjustment."
              : "Assign this program to a reusable calendar slot, then choose when to start.";

  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="grid gap-1.5">
        <div className={LABEL}>Program to calendar</div>
        <h2 className={H2}>{panelTitle}</h2>
        <p className={BODY}>{panelNote}</p>
      </div>

      {!templates.length ? (
        <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
          <div className={H3}>My Calendar rhythm not set yet</div>
          <div className={`mt-2 ${BODY}`}>
            Set up your weekly rhythm in My Calendar to begin generating plans.
          </div>
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
          <span className={LABEL}>Template slot</span>
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
        <div className={H3}>{selectedSlot?.label || "No slot selected"}</div>
        <div className={`mt-1 ${META}`}>
          {[
            selectedSlot?.subjectId,
            [selectedSlot?.startTime, selectedSlot?.endTime].filter(Boolean).join(" - "),
          ]
            .filter(Boolean)
            .join(" • ") || "Choose a slot to continue"}
        </div>
        <div className={`mt-3 ${BODY}`}>
          {generationReady
            ? "Generation will place each program segment into the next matching week for this slot, then open those blocks in My Plan for live adjustment."
            : "Generation becomes available as soon as the template, slot, and start date are all in place."}
        </div>
      </div>

      <div className="grid gap-3">
        {!templates.length ? (
          <div className={META}>
            Set your weekly rhythm in My Calendar first, then return here to map the sequence into one reusable slot.
          </div>
        ) : !selectedTemplateId ? (
          <div className={META}>Choose where this program should land.</div>
        ) : !slots.length ? (
          <div className={META}>Create a calendar slot first.</div>
        ) : !selectedSlotId ? (
          <div className={META}>Choose a slot to continue.</div>
        ) : !startDate ? (
          <div className={META}>Choose when this sequence should begin.</div>
        ) : (
          <div className={META}>
            The first segment will land in the first matching week, then the rest will flow forward one week at a time.
          </div>
        )}
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating || !generationReady}
          className="inline-flex w-fit items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {generating ? "Generating..." : "Generate into My Plan"}
        </button>
      </div>
    </section>
  );
}
