"use client";

import Link from "next/link";
import React from "react";
import type { HomeSurfaceState } from "@/app/components/home/HomeOverviewComponents";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const SECTION_LABEL = "text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500";
const SECTION_TITLE = "text-[18px] font-bold tracking-tight text-slate-950";
const CARD_TITLE = "text-[15px] font-semibold leading-[1.35] text-slate-950";
const BODY_TEXT = "text-[14px] leading-6 text-slate-600";
const META_TEXT = "text-[13px] leading-5 text-slate-500";
const CTA_TEXT = "text-[14px] font-semibold";

export type CoverageStatus = "not_started" | "in_progress" | "understood" | "needs_support";

export type CoverageSummaryCardData = {
  label: string;
  value: string;
  note: string;
};

export type SubjectCoverageTabData = {
  id: string;
  title: string;
  counts: Record<CoverageStatus, number>;
};

export type OutcomeCoverageView = {
  id: string;
  code: string;
  label: string;
  status: CoverageStatus;
  evidenceCount: number;
  lastTouchedAt?: string | null;
  viewHref?: string;
  canView: boolean;
  viewUnavailableReason?: string;
};

export type StrandCoverageView = {
  id: string;
  title: string;
  counts: Record<CoverageStatus, number>;
  outcomes: OutcomeCoverageView[];
};

function surfaceTone(state: HomeSurfaceState) {
  if (state === "empty") return "border-dashed border-slate-200 bg-slate-50/80";
  if (state === "placeholder") {
    return "border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(248,250,252,0.96)_100%)]";
  }
  return "border-slate-200 bg-white";
}

function coverageTone(status: CoverageStatus) {
  if (status === "understood") {
    return {
      label: "Understood",
      chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
      fill: "bg-emerald-400",
    };
  }
  if (status === "in_progress") {
    return {
      label: "In progress",
      chip: "border-amber-200 bg-amber-50 text-amber-700",
      fill: "bg-amber-400",
    };
  }
  if (status === "needs_support") {
    return {
      label: "Needs support",
      chip: "border-rose-200 bg-rose-50 text-rose-700",
      fill: "bg-rose-400",
    };
  }
  return {
    label: "Getting started",
    chip: "border-slate-200 bg-slate-50 text-slate-600",
    fill: "bg-slate-200",
  };
}

export function CurriculumFrameworkSummaryBar({
  framework,
  jurisdiction,
  yearBand,
  subjectsLabel,
  state,
}: {
  framework: string;
  jurisdiction: string;
  yearBand: string;
  subjectsLabel: string;
  state: HomeSurfaceState;
}) {
  return (
    <section
      className={cx(
        "grid gap-4 rounded-[24px] border px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] lg:grid-cols-4",
        surfaceTone(state),
      )}
    >
      {[
        { label: "Framework", value: framework },
        { label: "Jurisdiction", value: jurisdiction },
        { label: "Year band", value: yearBand },
        { label: "Subjects in scope", value: subjectsLabel },
      ].map((item) => (
        <div key={item.label} className="grid gap-1">
          <div className={SECTION_LABEL}>{item.label}</div>
          <div className={CARD_TITLE}>{state === "loading" ? "Loading..." : item.value}</div>
        </div>
      ))}
    </section>
  );
}

export function CoverageSummaryCards({
  cards,
  state,
}: {
  cards: CoverageSummaryCardData[];
  state: HomeSurfaceState;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className={cx(
            "rounded-[22px] border px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]",
            surfaceTone(state),
          )}
        >
          <div className={SECTION_LABEL}>{card.label}</div>
          {state === "loading" ? (
            <>
              <div className="mt-4 h-8 w-20 animate-pulse rounded-2xl bg-slate-100" />
              <div className="mt-3 h-4 w-28 animate-pulse rounded-full bg-slate-100" />
            </>
          ) : (
            <>
              <div className="mt-4 text-[28px] font-bold tracking-tight text-slate-950">{card.value}</div>
              <div className={`mt-2 ${BODY_TEXT}`}>{card.note}</div>
            </>
          )}
        </article>
      ))}
    </section>
  );
}

function subjectProgressSummary(subject: SubjectCoverageTabData) {
  if (!subject.counts.understood && !subject.counts.in_progress) {
    return "No outcomes marked yet · Ready to begin";
  }
  const understoodLabel = subject.counts.understood
    ? `${subject.counts.understood} understood`
    : "No outcomes marked yet";
  const inProgressLabel = subject.counts.in_progress
    ? `${subject.counts.in_progress} in progress`
    : "Ready to begin";
  return `${understoodLabel} / ${inProgressLabel}`;
}

export function SubjectCoverageTabs({
  subjects,
  selectedSubjectId,
  onSelect,
  state,
}: {
  subjects: SubjectCoverageTabData[];
  selectedSubjectId: string;
  onSelect: (subjectId: string) => void;
  state: HomeSurfaceState;
}) {
  return (
    <section className="grid gap-3">
      <div className="grid gap-1.5">
        <div className={SECTION_LABEL}>Subjects</div>
        <h2 className={SECTION_TITLE}>Choose a subject</h2>
      </div>

      {state === "loading" ? (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 w-32 animate-pulse rounded-full bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {subjects.map((subject) => {
            const active = subject.id === selectedSubjectId;
            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => onSelect(subject.id)}
                className={cx(
                  "grid gap-1 rounded-[18px] border px-4 py-3 text-left transition",
                  active
                    ? "border-blue-200 bg-blue-50 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
                    : "border-slate-200 bg-white hover:bg-slate-50",
                )}
              >
                <span className={CARD_TITLE}>{subject.title}</span>
                <span className={META_TEXT}>{subjectProgressSummary(subject)}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function CoverageProgressBar({
  counts,
}: {
  counts: Record<CoverageStatus, number>;
}) {
  const total =
    counts.not_started + counts.in_progress + counts.understood + counts.needs_support;

  const segments: CoverageStatus[] = [
    "understood",
    "in_progress",
    "needs_support",
    "not_started",
  ];

  return (
    <div className="grid gap-2">
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        {segments.map((status) => {
          const width = total ? `${(counts[status] / total) * 100}%` : "0%";
          return (
            <div
              key={status}
              className={cx("h-full", coverageTone(status).fill)}
              style={{ width }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {segments.map((status) => (
          <span
            key={status}
            className={cx(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-medium",
              coverageTone(status).chip,
            )}
          >
            {coverageTone(status).label}: {counts[status]}
          </span>
        ))}
      </div>
    </div>
  );
}

export function OutcomeCoverageRow({
  outcome,
}: {
  outcome: OutcomeCoverageView;
}) {
  return (
    <div className="grid gap-3 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4 lg:grid-cols-[120px_minmax(0,1fr)_120px_110px_110px] lg:items-center">
      <div className={CARD_TITLE}>{outcome.code}</div>
      <div className={BODY_TEXT}>{outcome.label}</div>
      <span
        className={cx(
          "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[12px] font-medium",
          coverageTone(outcome.status).chip,
        )}
      >
        {coverageTone(outcome.status).label}
      </span>
      <div className={META_TEXT}>
        {outcome.evidenceCount} evidence
      </div>
      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <div className={META_TEXT}>{outcome.lastTouchedAt || "Getting started"}</div>
        {outcome.canView && outcome.viewHref ? (
          <Link
            href={outcome.viewHref}
            className={`inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 ${CTA_TEXT} text-slate-900 transition hover:bg-slate-50`}
          >
            View
          </Link>
        ) : (
          <span
            className={`inline-flex cursor-not-allowed items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2 ${CTA_TEXT} text-slate-500`}
            title={outcome.viewUnavailableReason || "Add a capture to unlock this view."}
            aria-disabled="true"
          >
            View
          </span>
        )}
      </div>
    </div>
  );
}

export function StrandCoverageCard({
  strand,
  expanded,
  onToggle,
  state,
}: {
  strand: StrandCoverageView;
  expanded: boolean;
  onToggle: () => void;
  state: HomeSurfaceState;
}) {
  return (
    <article
      className={cx(
        "rounded-[24px] border px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]",
        surfaceTone(state),
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-2">
          <div className={CARD_TITLE}>{strand.title}</div>
          {state === "loading" ? (
            <div className="h-4 w-48 animate-pulse rounded-full bg-slate-100" />
          ) : (
            <CoverageProgressBar counts={strand.counts} />
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 ${CTA_TEXT} text-slate-900 transition hover:bg-slate-50`}
        >
          {expanded ? "Hide outcomes" : "Show outcomes"}
        </button>
      </div>

      {expanded ? (
        <div className="mt-4 grid gap-3">
          {state === "loading"
            ? Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-[18px] bg-slate-100" />
              ))
            : strand.outcomes.map((outcome) => (
                <OutcomeCoverageRow key={outcome.id} outcome={outcome} />
              ))}
        </div>
      ) : null}
    </article>
  );
}

export function CoverageLegend() {
  const items: CoverageStatus[] = [
    "not_started",
    "in_progress",
    "understood",
    "needs_support",
  ];

  return (
    <section className="flex flex-wrap gap-2">
      {items.map((status) => (
        <span
          key={status}
          className={cx(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-medium",
            coverageTone(status).chip,
          )}
        >
          {coverageTone(status).label}
        </span>
      ))}
    </section>
  );
}

export function CurriculumMapEmptyState({
  learnerName,
}: {
  learnerName: string;
}) {
  return (
    <section className="grid gap-4 rounded-[26px] border border-dashed border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_50%,rgba(239,246,255,0.92)_100%)] px-6 py-8 text-center shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-blue-50 text-[24px] shadow-[0_10px_22px_rgba(59,130,246,0.08)]">
        *
      </div>
      <div className="grid gap-2">
        <h2 className={SECTION_TITLE}>Start capturing learning moments to build curriculum coverage.</h2>
        <p className={`mx-auto max-w-[520px] ${BODY_TEXT}`}>
          Add the first tagged moment for {learnerName} to start a calm, visible coverage trail.
        </p>
      </div>
      <div className="flex justify-center">
        <Link
          href="/capture"
          className={`inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 ${CTA_TEXT} text-white transition hover:bg-slate-800`}
        >
          Capture your first learning moment
        </Link>
      </div>
    </section>
  );
}

export function CurriculumNextMoveCard({
  title,
  note,
  href,
  cta,
  state,
}: {
  title: string;
  note: string;
  href: string;
  cta: string;
  state: HomeSurfaceState;
}) {
  return (
    <section
      className={cx(
        "rounded-[26px] border px-6 py-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]",
        surfaceTone(state),
      )}
    >
      <div className={SECTION_LABEL}>Next best move</div>
      {state === "loading" ? (
        <>
          <div className="mt-4 h-8 w-64 animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-3 h-4 w-80 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-5 h-11 w-40 animate-pulse rounded-full bg-slate-100" />
        </>
      ) : (
        <>
          <h2 className="mt-3 text-[18px] font-bold leading-[1.2] tracking-tight text-slate-950">{title}</h2>
          <p className={`mt-2 max-w-[760px] ${BODY_TEXT}`}>{note}</p>
          <Link
            href={href}
            className={`mt-5 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 ${CTA_TEXT} text-white transition hover:bg-slate-800`}
          >
            {cta}
          </Link>
        </>
      )}
    </section>
  );
}
