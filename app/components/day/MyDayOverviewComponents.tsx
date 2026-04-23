"use client";

import Link from "next/link";
import React from "react";
import type { HomeSurfaceState } from "@/app/components/home/HomeOverviewComponents";
import { CurriculumTagPills } from "@/app/components/curriculum/CurriculumTaggingComponents";
import type { FrameworkPreset } from "@/lib/curriculumFrameworks";
import type {
  MyDayBlockItem,
  MyDayNextStep,
  MyDayProgress,
  MyDayRecentCapture,
  MyDaySummary,
} from "@/lib/myDay";

const LABEL = "text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500";
const H2 = "text-[18px] font-bold tracking-tight text-slate-950";
const H3 = "text-[15px] font-semibold text-slate-950";
const META = "text-[13px] leading-5 text-slate-500";
const CARD =
  "rounded-[26px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.9)_100%)] shadow-[0_14px_34px_rgba(15,23,42,0.045)]";

function badgeTone(state: HomeSurfaceState) {
  if (state === "live") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (state === "derived") return "border-blue-200 bg-blue-50 text-blue-700";
  if (state === "loading") return "border-violet-200 bg-violet-50 text-violet-700";
  if (state === "placeholder") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function statusLabel(status: MyDayBlockItem["status"]) {
  if (status === "captured") return "Completed";
  return "Upcoming";
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
    <section className={`grid gap-5 p-6 ${CARD}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-2">
          <div className={LABEL}>My Day</div>
          <h2 className="text-[21px] font-bold tracking-[-0.02em] text-slate-950">{dateLabel}</h2>
          <p className="max-w-[54ch] text-[14px] leading-6 text-slate-600">
            See what is planned for today, what comes next, and what is ready to capture.
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${badgeTone(state)}`}
        >
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
      <div className="mt-2 text-[16px] font-semibold tracking-[-0.01em] text-slate-950">
        Capture from today's flow
      </div>
      <div className="mt-1 text-[13px] leading-5 text-slate-500">{note}</div>
      <div className="mt-5 inline-flex w-fit items-center justify-center rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-[13px] font-semibold text-slate-700">
        Capture from today
      </div>
    </>
  );

  if (disabled) {
    return <section className={`p-5 ${CARD}`}>{content}</section>;
  }

  return (
    <Link href={href} className={`p-5 transition hover:border-slate-300 hover:bg-white ${CARD}`}>
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
    <article className={`grid gap-4 p-5 ${CARD}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={LABEL}>{block.time || block.sourceLabel}</span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone(block.status)}`}
            >
              {statusLabel(block.status)}
            </span>
          </div>
          <div className="text-[17px] font-semibold tracking-[-0.01em] text-slate-950">
            {block.title}
          </div>
          <div className={META}>
            {[block.subject, block.time].filter(Boolean).join(" · ") || block.sourceLabel}
          </div>
        </div>
      </div>

      <div className="grid gap-2.5">
        <div className="text-[14px] leading-6 text-slate-600">
          {block.note ||
            "Plan detail has not been expanded yet. You can still continue in My Plan or capture evidence from the scheduled block."}
        </div>
        {block.programTitle || block.programSegmentTitle ? (
          <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[12px] font-medium text-slate-600">
            {[block.programTitle, block.programSegmentTitle].filter(Boolean).join(" · ")}
          </div>
        ) : null}
        {preset && block.curriculumOutcomeIds.length ? (
          <CurriculumTagPills preset={preset} outcomeIds={block.curriculumOutcomeIds} />
        ) : null}
        <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50/90 px-3 py-1 text-[12px] font-medium text-slate-600">
          {block.evidenceCount > 0
            ? `${block.evidenceCount} evidence item${block.evidenceCount === 1 ? "" : "s"} linked${block.latestEvidenceLabel ? ` · last captured ${block.latestEvidenceLabel}` : ""}`
            : "No evidence linked yet"}
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 pt-1">
        <Link
          href={planHref}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4.5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
        >
          Focus this block
        </Link>
        {canCapture ? (
          <Link
            href={captureHref}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4.5 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Capture now
          </Link>
        ) : (
          <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-4.5 py-2.5 text-[13px] font-semibold text-slate-500">
            Capture now
          </span>
        )}
      </div>
    </article>
  );
}

export function MyDayNextUpCard({
  block,
  learnerName,
  planHref,
  captureHref,
  canCapture,
}: {
  block: MyDayBlockItem | null;
  learnerName: string;
  planHref: string;
  captureHref: string;
  canCapture: boolean;
}) {
  if (!block) {
    return (
      <section className={`border-dashed p-6 ${CARD}`}>
        <div className={LABEL}>Next up</div>
        <div className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-slate-950">
          Nothing is lined up just yet
        </div>
        <div className="mt-1 text-[13px] leading-5 text-slate-500">
          Shape one live block in My Plan so today has a clear next step.
        </div>
        <Link
          href="/my-plan"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-950 px-4.5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
        >
          Shape today in My Plan
        </Link>
      </section>
    );
  }

  return (
    <section className={`p-6 ${CARD}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <div className={LABEL}>Next up</div>
          <div className="text-[19px] font-semibold tracking-[-0.02em] text-slate-950">
            {block.title}
          </div>
          <div className={META}>
            {[block.time || "Next block", learnerName].filter(Boolean).join(" · ")}
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone(block.status)}`}
        >
          {statusLabel(block.status)}
        </span>
      </div>

      {block.programTitle ? (
        <div className="mt-4 inline-flex w-fit items-center rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[12px] font-medium text-slate-600">
          {block.programTitle}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2.5">
        <Link
          href={planHref}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
        >
          Focus this block
        </Link>
        {canCapture ? (
          <Link
            href={captureHref}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Capture now
          </Link>
        ) : (
          <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-5 py-2.5 text-[13px] font-semibold text-slate-500">
            Capture now
          </span>
        )}
      </div>
    </section>
  );
}

export function MyDayProgressSignal({
  progress,
}: {
  progress: MyDayProgress;
}) {
  const ratio = progress.totalCount > 0 ? Math.round((progress.capturedCount / progress.totalCount) * 100) : 0;

  return (
    <section className={`p-5 ${CARD}`}>
      <div className={LABEL}>Today progress</div>
      <div className="mt-2 text-[17px] font-semibold tracking-[-0.01em] text-slate-950">
        {progress.capturedCount} of {progress.totalCount} blocks captured
      </div>
      <div className="mt-1 text-[13px] leading-5 text-slate-500">{progress.note}</div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(15,23,42,1)_0%,rgba(71,85,105,0.92)_100%)] transition-[width]"
          style={{ width: `${ratio}%` }}
        />
      </div>
    </section>
  );
}

export function MyDayRecentlyCapturedStrip({
  items,
  portfolioHref,
}: {
  items: MyDayRecentCapture[];
  portfolioHref: string;
}) {
  if (!items.length) return null;

  return (
    <section className={`grid gap-4 p-5 ${CARD}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <div className={LABEL}>Recently captured</div>
          <div className="text-[17px] font-semibold tracking-[-0.01em] text-slate-950">
            Fresh learning from today's flow
          </div>
        </div>
        <Link
          href={portfolioHref}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Open My Portfolio
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="grid gap-1.5 rounded-[20px] border border-slate-200 bg-white/80 px-4 py-3.5"
          >
            <div className="text-[14px] font-semibold tracking-[-0.01em] text-slate-950">
              {item.title}
            </div>
            <div className={META}>{item.timeLabel}</div>
          </article>
        ))}
      </div>
    </section>
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
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-slate-950">
          What is planned for today
        </h2>
      </div>
      {empty ?? <div className="grid gap-4">{blocks}</div>}
    </section>
  );
}

export function MyDayEmptyState() {
  return (
    <section className={`grid gap-4 border-dashed p-6 ${CARD}`}>
      <div className="grid gap-1.5">
        <div className={LABEL}>Today</div>
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-slate-950">
          Nothing is planned for today yet
        </h2>
        <p className="max-w-[56ch] text-[14px] leading-6 text-slate-600">
          Start by shaping one live block in My Plan. Use My Calendar when you need to adjust the
          reusable weekly rhythm behind it.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/my-plan"
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-slate-800"
        >
          Shape today in My Plan
        </Link>
        <Link
          href="/my-calendar"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
        >
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
    {
      label: "Blocks with evidence",
      value: String(summary.capturedCount),
      note: "Blocks already linked to captured evidence",
    },
    { label: "Evidence today", value: String(summary.evidenceTodayCount), note: "Learning moments captured today" },
    { label: "Daily status", value: summary.dailyStatus, note: summary.dailyNote },
  ];

  return (
    <section className="grid gap-4">
      <div className="grid gap-1.5">
        <div className={LABEL}>Today summary</div>
        <h2 className="text-[18px] font-bold tracking-[-0.02em] text-slate-950">A light read on today</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.label}
            className="grid gap-1.5 rounded-[20px] border border-slate-200 bg-white/85 px-4 py-4 shadow-[0_8px_22px_rgba(15,23,42,0.03)]"
          >
            <div className={LABEL}>{item.label}</div>
            <div className="text-[17px] font-semibold tracking-[-0.01em] text-slate-950">
              {item.value}
            </div>
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
    <section className={`p-6 ${CARD}`}>
      <div className={LABEL}>Suggested next step</div>
      <h2 className="mt-2 text-[19px] font-semibold tracking-[-0.02em] text-slate-950">
        {nextStep.title}
      </h2>
      <p className="mt-2 max-w-[56ch] text-[14px] leading-6 text-slate-600">{nextStep.note}</p>
      <Link
        href={nextStep.href}
        className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-slate-800"
      >
        {nextStep.cta}
      </Link>
    </section>
  );
}

export function MyDayQuickLinks() {
  const items = [
    {
      href: "/my-calendar",
      label: "My Calendar",
      note: "Adjust the reusable weekly rhythm that programs and live planning build on.",
    },
    {
      href: "/my-plan",
      label: "My Plan",
      note: "Shape the live week, add blocks, and keep the next few days clear.",
    },
    {
      href: "/my-programs",
      label: "My Programs",
      note: "Refine longer sequences before they generate back into the live week.",
    },
  ];

  return (
    <section className="grid gap-4">
      <div className="grid gap-1.5">
        <div className={LABEL}>Quick links</div>
        <h2 className="text-[18px] font-bold tracking-[-0.02em] text-slate-950">
          Keep the wider planning flow close
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[20px] border border-slate-200 bg-white/85 px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)] transition hover:bg-white"
          >
            <div className={H3}>{item.label}</div>
            <div className={`mt-2 ${META}`}>{item.note}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
