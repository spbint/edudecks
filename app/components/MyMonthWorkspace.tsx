"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  loadFamilyPrograms,
  type Program,
} from "@/lib/familyPlanningTemplates";

const LABEL = "text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500";
const H2 = "text-[18px] font-bold tracking-tight text-slate-950";
const H3 = "text-[15px] font-semibold text-slate-950";
const BODY = "text-[14px] leading-5 text-slate-600";
const META = "text-[13px] leading-5 text-slate-500";

const STATUS_TONES = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  needsSlot: "border-blue-200 bg-blue-50 text-blue-700",
  needsSegment: "border-amber-200 bg-amber-50 text-amber-700",
} as const;

function programStatus(program: Program) {
  if (!program.segments.length) return { label: "Needs segment", tone: STATUS_TONES.needsSegment };
  if (!program.scheduleMapping?.calendarTemplateSlotId) return { label: "Needs slot", tone: STATUS_TONES.needsSlot };
  return { label: "Ready", tone: STATUS_TONES.ready };
}

function buildWeeks(programs: Program[]) {
  const maxSegments = Math.max(4, Math.min(6, ...programs.map((program) => program.segments.length || 1)));

  return Array.from({ length: maxSegments }, (_, index) => {
    const weekPrograms = programs.filter((program) => program.segments[index]);
    const fallbackPrograms = weekPrograms.length ? weekPrograms : programs.slice(0, 3);
    const focus =
      weekPrograms
        .map((program) => program.segments[index]?.title)
        .filter(Boolean)
        .slice(0, 2)
        .join(" / ") || "Settle rhythm";
    const needsSegment = fallbackPrograms.some((program) => !program.segments.length);
    const needsSlot = fallbackPrograms.some((program) => !program.scheduleMapping?.calendarTemplateSlotId);
    const status = needsSegment
      ? { label: "Needs segment", tone: STATUS_TONES.needsSegment }
      : needsSlot
        ? { label: "Needs slot", tone: STATUS_TONES.needsSlot }
        : { label: "Ready", tone: STATUS_TONES.ready };

    return {
      id: `week-${index + 1}`,
      label: `Week ${index + 1}`,
      focus,
      programs: fallbackPrograms.slice(0, 4),
      status,
    };
  });
}

export default function MyMonthWorkspace() {
  const { workspace, activeLearner } = useFamilyWorkspace();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadIssue, setLoadIssue] = useState("");

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!workspace.profile.id) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadIssue("");
        const nextPrograms = await loadFamilyPrograms({ familyId: workspace.profile.id });
        if (!mounted) return;
        setPrograms(
          nextPrograms.filter((program) => !program.learnerId || program.learnerId === activeLearner?.id),
        );
      } catch {
        if (!mounted) return;
        setPrograms([]);
        setLoadIssue("Month view is using a draft workspace.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [activeLearner?.id, workspace.profile.id]);

  const weeks = useMemo(() => buildWeeks(programs), [programs]);
  const focusArea = programs[0]?.subjectId || "No focus selected";
  const nextMove = !programs.length
    ? "Open My Programs"
    : programs.some((program) => !program.scheduleMapping?.calendarTemplateSlotId)
      ? "Choose a calendar slot"
      : "Review My Plan";

  return (
    <FamilyTopNavShell
      subtitle="My Month"
      heroTitle="My Month"
      heroText="See the month ahead, active programs, and the next planning moves."
      heroAsideTitle="Planning layer"
      heroAsideText="Use this overview between reusable weekly rhythm and daily execution."
    >
      <div className="grid gap-5 pb-14">
        {loadIssue ? (
          <section className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-700">
            {loadIssue}
          </section>
        ) : null}

        {loading ? (
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <div className={BODY}>Loading month...</div>
          </section>
        ) : !programs.length ? (
          <section className="grid gap-4 rounded-[28px] border border-dashed border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            <div className="grid gap-1.5">
              <div className={LABEL}>Month overview</div>
              <h2 className="text-[24px] font-black tracking-tight text-slate-950">No month plan yet</h2>
              <p className={BODY}>Start with your weekly rhythm, then place programs into the month.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/my-calendar"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-slate-800"
              >
                Open My Calendar
              </Link>
              <Link
                href="/my-programs"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Open My Programs
              </Link>
            </div>
          </section>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <main className="grid gap-4">
              {weeks.map((week) => (
                <article
                  key={week.id}
                  className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] md:grid-cols-[140px_minmax(0,1fr)_160px] md:items-center"
                >
                  <div>
                    <div className={LABEL}>{week.label}</div>
                    <div className={`mt-2 ${H2}`}>Focus</div>
                  </div>
                  <div className="grid gap-2">
                    <div className={H3}>{week.focus}</div>
                    <div className="flex flex-wrap gap-2">
                      {week.programs.map((program) => (
                        <span
                          key={`${week.id}-${program.id}`}
                          className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-700"
                        >
                          {program.title}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] ${week.status.tone}`}
                  >
                    {week.status.label}
                  </span>
                </article>
              ))}
            </main>

            <aside className="grid gap-4 xl:sticky xl:top-4 xl:self-start">
              <section className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <div className={LABEL}>Active programs</div>
                {programs.slice(0, 5).map((program) => {
                  const status = programStatus(program);
                  return (
                    <div key={program.id} className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className={H3}>{program.title}</div>
                      <div className={`mt-1 ${META}`}>
                        {program.segments.length} segment{program.segments.length === 1 ? "" : "s"}
                      </div>
                      <span
                        className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${status.tone}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  );
                })}
              </section>

              <section className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <div className={LABEL}>Focus area</div>
                <div className={H2}>{focusArea}</div>
              </section>

              <section className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <div className={LABEL}>Next planning move</div>
                <div className={H2}>{nextMove}</div>
                <Link
                  href={nextMove === "Open My Programs" ? "/my-programs" : nextMove === "Review My Plan" ? "/my-plan" : "/my-calendar"}
                  className="inline-flex w-fit items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-slate-800"
                >
                  Open
                </Link>
              </section>
            </aside>
          </div>
        )}
      </div>
    </FamilyTopNavShell>
  );
}
