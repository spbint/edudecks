"use client";

import Link from "next/link";
import React from "react";
import type { HomeSurfaceState } from "@/app/components/home/HomeOverviewComponents";
import { CurriculumTagPills } from "@/app/components/curriculum/CurriculumTaggingComponents";
import type { FrameworkPreset } from "@/lib/curriculumFrameworks";
import type { MyDayBlockItem, MyDayNextStep, MyDaySummary } from "@/lib/myDay";

const LABEL = "text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500";
const H2 = "text-[18px] font-bold tracking-tight text-slate-950";
const H3 = "text-[15px] font-semibold text-slate-950";
const BODY = "text-[14px] leading-6 text-slate-600";
const META = "text-[13px] leading-5 text-slate-500";

function badgeTone(state: HomeSurfaceState) {
  if (state === "live") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (state === "derived") return "border-blue-200 bg-blue-50 text-blue-700";
  if (state === "loading") return "border-violet-200 bg-violet-50 text-violet-700";
  if (state === "placeholder") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function statusLabel(status: MyDayBlockItem["status"]) {
  if (status === "captured") return "Captured";
  if (status === "next") return "Next";
  return "Planned";
}

function statusTone(status: MyDayBlockItem["status"]) {
  if (status === "captured") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "next") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

export function MyDayHeader({
  dateLabel,
  learnerName,
  state,
}: {
  dateLabel: string;
  learnerName: string;
  state: HomeSurfaceState;
}) {
  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1.5">
          <div className={LABEL}>My Day</div>
          <h2 className={H2}>{dateLabel}</h2>
          <p className={BODY}>See what is planned for today, what comes next, and what is ready to capture.</p>
        </div>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] ${badgeTone(state)}`}>
          {learnerName}
        </span>
      </div>
    </section>
  );
}

export function MyDayQuickCaptureCard({
  href,
  disabled = false,
  note,
}: {
  href: string;
  disabled?: boolean;
  note: string;
}) {
  const content = (
    <>
      <div className={LABEL}>Quick capture</div>
      <div className={`mt-2 ${H3}`}>Capture from today's flow</div>
      <div className={`mt-1 ${META}`}>{note}</div>
      <div className="mt-4 inline-flex w-fit items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[14px] font-semibold text-slate-700">
        Capture from today
      </div>
    </>
  );

  if (disabled) {
    return (
      <section className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.03)]">
        {content}
      </section>
    );
  }

  return (
    <Link href={href} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.03)] transition hover:bg-slate-50">
      {content}
    </Link>
  );
}

export function TodayLearningBlockCard({
  block,
  planHref,
  captureHref,
  canCapture,
  preset,
}: {
  block: MyDayBlockItem;
  planHref: string;
  captureHref: string;
  canCapture: boolean;
  preset: FrameworkPreset | null;
}) {
  return (
    <article className="grid gap-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={LABEL}>{block.time || block.sourceLabel}</span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] ${statusTone(block.status)}`}>
              {statusLabel(block.status)}
            </span>
          </div>
          <div className={H3}>{block.title}</div>
          <div className={META}>{[block.subject, block.time].filter(Boolean).join(" - ") || block.sourceLabel}</div>
        </div>
      </div>

      <div className="grid gap-2">
        <div className={BODY}>
          {block.note || "Plan detail has not been expanded yet. You can still continue in My Plan or capture evidence from the scheduled block."}
        </div>
        {block.programTitle || block.programSegmentTitle ? (
          <div className={META}>
            {[block.programTitle, block.programSegmentTitle].filter(Boolean).join(" - ")}
          </div>
        ) : null}
        {preset && block.curriculumOutcomeIds.length ? (
          <CurriculumTagPills preset={preset} outcomeIds={block.curriculumOutcomeIds} />
        ) : null}
        {block.evidenceCount > 0 ? (
          <div className={META}>
            {block.evidenceCount} evidence item{block.evidenceCount === 1 ? "" : "s"} linked
            {block.latestEvidenceLabel ? ` - last captured ${block.latestEvidenceLabel}` : ""}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={planHref}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-slate-800"
        >
          {block.note ? "Adjust in My Plan" : "Open in My Plan"}
        </Link>
        {canCapture ? (
          <Link
            href={captureHref}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Capture evidence
          </Link>
        ) : (
          <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-[14px] font-semibold text-slate-500">
            Capture evidence
          </span>
        )}
      </div>
    </article>
  );
}

export function TodayLearningFlow({
  blocks,
  empty,
}: {
  blocks: React.ReactNode;
  empty?: React.ReactNode;
}) {
  return (
    <section className="grid gap-4">
      <div className="grid gap-1.5">
        <div className={LABEL}>Today's learning flow</div>
        <h2 className={H2}>What is planned for today</h2>
      </div>
      {empty ?? <div className="grid gap-4">{blocks}</div>}
    </section>
  );
}

export function MyDayEmptyState() {
  return (
    <section className="grid gap-4 rounded-[24px] border border-dashed border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.03)]">
      <div className="grid gap-1.5">
        <div className={LABEL}>Today</div>
        <h2 className={H2}>Nothing is planned for today yet</h2>
        <p className={BODY}>Start by shaping one live block in My Plan. Use My Calendar when you need to adjust the reusable weekly rhythm behind it.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/my-plan" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-slate-800">
          Shape today in My Plan
        </Link>
        <Link href="/my-calendar" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100">
          Review My Calendar rhythm
        </Link>
      </div>
    </section>
  );
}

export function MyDaySummary({
  summary,
}: {
  summary: MyDaySummary;
}) {
  const items = [
    { label: "Blocks today", value: String(summary.plannedCount), note: "Scheduled learning blocks" },
    { label: "Blocks with evidence", value: String(summary.capturedCount), note: "Blocks already linked to captured evidence" },
    { label: "Evidence today", value: String(summary.evidenceTodayCount), note: "Learning moments captured today" },
    { label: "Daily status", value: summary.dailyStatus, note: summary.dailyNote },
  ];

  return (
    <section className="grid gap-4">
      <div className="grid gap-1.5">
        <div className={LABEL}>Today summary</div>
        <h2 className={H2}>A light read on today</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <article key={item.label} className="grid gap-1 rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <div className={LABEL}>{item.label}</div>
            <div className={H3}>{item.value}</div>
            <div className={META}>{item.note}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function MyDayNextStep({
  nextStep,
}: {
  nextStep: MyDayNextStep;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className={LABEL}>Suggested next step</div>
      <h2 className={`mt-2 ${H2}`}>{nextStep.title}</h2>
      <p className={`mt-2 ${BODY}`}>{nextStep.note}</p>
      <Link
        href={nextStep.href}
        className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-slate-800"
      >
        {nextStep.cta}
      </Link>
    </section>
  );
}

export function MyDayQuickLinks() {
  const items = [
    { href: "/my-calendar", label: "My Calendar", note: "Adjust the reusable weekly rhythm that programs and live planning build on." },
    { href: "/my-plan", label: "My Plan", note: "Shape the live week, add blocks, and keep the next few days clear." },
    { href: "/my-programs", label: "My Programs", note: "Refine longer sequences before they generate back into the live week." },
  ];

  return (
    <section className="grid gap-4">
      <div className="grid gap-1.5">
        <div className={LABEL}>Quick links</div>
        <h2 className={H2}>Keep the wider planning flow close</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)] transition hover:bg-slate-50"
          >
            <div className={H3}>{item.label}</div>
            <div className={`mt-2 ${META}`}>{item.note}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
