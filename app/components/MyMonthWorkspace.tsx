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
  draft: "border-slate-200 bg-slate-50 text-slate-600",
} as const;

function programStatus(program: Program) {
  if (!program.segments.length) return { label: "Needs segment", tone: STATUS_TONES.needsSegment };
  if (!program.scheduleMapping?.calendarTemplateSlotId) return { label: "Needs slot", tone: STATUS_TONES.needsSlot };
  return { label: "Ready", tone: STATUS_TONES.ready };
}

function buildWeeks(programs: Program[]) {
  const maxSegments = Math.max(4, Math.min(6, ...programs.map((program) => program.segments.length || 1)));

  return Array.from({ length: maxSegments }, (_, index) => {
    const entries = programs
      .map((program) => ({
        program,
        segment: [...program.segments].sort((a, b) => a.order - b.order)[index],
      }))
      .filter(
        (entry): entry is { program: Program; segment: Program["segments"][number] } =>
          Boolean(entry.segment),
      );
    const focus =
      entries
        .map((entry) => entry.segment.title)
        .filter(Boolean)
        .slice(0, 2)
        .join(" / ") || "Draft week";
    const needsSegment = programs.some((program) => !program.segments.length);
    const needsSlot = entries.some((entry) => !entry.program.scheduleMapping?.calendarTemplateSlotId);
    const status = needsSegment
      ? { label: "Needs segment", tone: STATUS_TONES.needsSegment }
      : needsSlot
        ? { label: "Needs slot", tone: STATUS_TONES.needsSlot }
        : entries.length
          ? { label: "Ready", tone: STATUS_TONES.ready }
          : { label: "Draft", tone: STATUS_TONES.draft };

    return {
      id: `week-${index + 1}`,
      label: `Week ${index + 1}`,
      focus,
      entries: entries.slice(0, 4),
      emptyNote: programs.length
        ? "No active program segment lands in this draft week yet."
        : "Add active programs to shape this week overview.",
      status,
    };
  });
}

function distinct(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
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
  const focusSubjects = distinct(programs.map((program) => program.subjectId));
  const focusArea = focusSubjects.length ? focusSubjects.slice(0, 3).join(", ") : "No focus selected";
  const readyCount = programs.filter((program) => programStatus(program).label === "Ready").length;
  const nextMove = !programs.length
    ? {
        title: "Add active programs",
        detail: "Create or select programs so My Month can summarize the month ahead.",
        href: "/my-programs",
      }
    : programs.some((program) => !program.segments.length)
      ? {
          title: "Add program segments",
          detail: "Give each active program a sequence before reading it across the month.",
          href: "/my-programs",
        }
      : programs.some((program) => !program.scheduleMapping?.calendarTemplateSlotId)
        ? {
            title: "Place programs in My Calendar",
            detail: "Choose calendar slots so the month overview reflects the weekly rhythm.",
            href: "/my-calendar",
          }
        : {
            title: "Review My Calendar",
            detail: "Active programs have segments and slots. Check the live calendar next.",
            href: "/my-calendar",
          };

  return (
    <FamilyTopNavShell
      subtitle="My Month"
      heroTitle="My Month"
      heroText="See the month ahead, active programs, and the next planning moves."
      heroAsideTitle="Planning layer"
      heroAsideText="Master Calendar sets reusable structure. My Month reads active programs above My Calendar."
    >
      <div className="grid gap-5 pb-14">
        {loadIssue ? (
          <section className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-700">
            {loadIssue}
          </section>
        ) : null}

        {loading ? (
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <div className={BODY}>Loading month overview...</div>
          </section>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <main className="grid gap-5">
              <section className="grid gap-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="grid gap-1.5">
                    <div className={LABEL}>Month timeline</div>
                    <h2 className="text-[24px] font-black tracking-tight text-slate-950">
                      Draft month overview
                    </h2>
                    <p className={BODY}>
                      This is a planning overview, not saved month content. It rolls up active programs and calendar readiness.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/my-calendar"
                      className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-slate-800"
                    >
                      Open My Calendar
                    </Link>
                    <Link
                      href="/my-programs"
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Open My Programs
                    </Link>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {weeks.slice(0, 4).map((week) => (
                    <article
                      key={`timeline-${week.id}`}
                      className="grid min-h-[128px] gap-3 rounded-[20px] border border-slate-200 bg-slate-50/80 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className={LABEL}>{week.label}</div>
                          <div className={`mt-2 ${H3}`}>{week.focus}</div>
                        </div>
                        <span
                          className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${week.status.tone}`}
                        >
                          {week.status.label}
                        </span>
                      </div>
                      <div className={META}>
                        {week.entries.length
                          ? `${week.entries.length} program segment${week.entries.length === 1 ? "" : "s"} in view`
                          : week.emptyNote}
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="grid gap-4">
                <div className="grid gap-1.5">
                  <div className={LABEL}>Week cards</div>
                  <h2 className={H2}>Program-derived planning weeks</h2>
                </div>

                {weeks.map((week) => (
                  <article
                    key={week.id}
                    className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] md:grid-cols-[140px_minmax(0,1fr)_150px] md:items-center"
                  >
                    <div>
                      <div className={LABEL}>{week.label}</div>
                      <div className={`mt-2 ${H2}`}>Focus</div>
                    </div>
                    <div className="grid gap-2">
                      <div className={H3}>{week.focus}</div>
                      {week.entries.length ? (
                        <div className="flex flex-wrap gap-2">
                          {week.entries.map(({ program, segment }) => (
                            <span
                              key={`${week.id}-${program.id}-${segment.id}`}
                              className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-700"
                            >
                              {program.title}: {segment.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className={META}>{week.emptyNote}</div>
                      )}
                    </div>
                    <span
                      className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] ${week.status.tone}`}
                    >
                      {week.status.label}
                    </span>
                  </article>
                ))}
              </section>
            </main>

            <aside className="grid gap-4 xl:sticky xl:top-4 xl:self-start">
              <section className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <div className={LABEL}>Active programs</div>
                {programs.length ? (
                  programs.slice(0, 5).map((program) => {
                    const status = programStatus(program);
                    return (
                      <div key={program.id} className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className={H3}>{program.title}</div>
                        <div className={`mt-1 ${META}`}>
                          {program.segments.length} segment{program.segments.length === 1 ? "" : "s"} - {program.subjectId}
                        </div>
                        <span
                          className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${status.tone}`}
                        >
                          {status.label}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
                    <div className={H3}>No active programs yet</div>
                    <p className={`mt-1 ${META}`}>
                      My Month will stay as a draft overview until programs exist.
                    </p>
                    <Link
                      href="/my-programs"
                      className="mt-3 inline-flex w-fit items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Open My Programs
                    </Link>
                  </div>
                )}
              </section>

              <section className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <div className={LABEL}>This month's focus</div>
                <div className={H2}>{focusArea}</div>
                <p className={META}>
                  This focus is inferred from active programs, not saved as a month setting.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-600">
                    {programs.length} active
                  </span>
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-600">
                    {readyCount} ready
                  </span>
                </div>
              </section>

              <section className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <div className={LABEL}>Next planning move</div>
                <div className={H2}>{nextMove.title}</div>
                <p className={META}>{nextMove.detail}</p>
                <Link
                  href={nextMove.href}
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
