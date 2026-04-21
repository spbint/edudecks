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

function surfaceTone(state: HomeSurfaceState) {
  if (state === "empty") return "border-dashed border-slate-200 bg-slate-50/80";
  if (state === "placeholder") {
    return "border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(248,250,252,0.96)_100%)]";
  }
  return "border-slate-200 bg-white";
}

export type ProgressMetricCardProps = {
  label: string;
  value: string;
  note: string;
  state: HomeSurfaceState;
  accent?: "blue" | "violet" | "emerald" | "amber";
};

export function ProgressMetricCard({
  label,
  value,
  note,
  state,
  accent = "blue",
}: ProgressMetricCardProps) {
  const accentTone =
    accent === "violet"
      ? "bg-violet-100 text-violet-700"
      : accent === "emerald"
        ? "bg-emerald-100 text-emerald-700"
        : accent === "amber"
          ? "bg-amber-100 text-amber-700"
          : "bg-blue-100 text-blue-700";

  return (
    <article
      className={cx(
        "rounded-[22px] border px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]",
        surfaceTone(state),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={SECTION_LABEL}>{label}</div>
        <span className={cx("inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[12px] font-semibold", accentTone)}>
          {label.slice(0, 1)}
        </span>
      </div>

      {state === "loading" ? (
        <>
          <div className="mt-4 h-8 w-24 animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-3 h-4 w-32 animate-pulse rounded-full bg-slate-100" />
        </>
      ) : (
        <>
          <div className="mt-4 text-[28px] font-bold tracking-tight text-slate-950">{value}</div>
          <div className={`mt-2 ${BODY_TEXT}`}>{note}</div>
        </>
      )}
    </article>
  );
}

export function InsightListCard({
  eyebrow,
  title,
  items,
  emptyTitle,
  emptyNote,
  state,
  tone = "blue",
}: {
  eyebrow: string;
  title: string;
  items: string[];
  emptyTitle: string;
  emptyNote: string;
  state: HomeSurfaceState;
  tone?: "blue" | "amber";
}) {
  const pillTone =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <article
      className={cx(
        "rounded-[24px] border px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]",
        surfaceTone(state),
      )}
    >
      <div className="grid gap-1.5">
        <div className={SECTION_LABEL}>{eyebrow}</div>
        <h2 className={SECTION_TITLE}>{title}</h2>
      </div>

      {state === "loading" ? (
        <div className="mt-4 grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-full bg-slate-100" />
          ))}
        </div>
      ) : items.length ? (
        <div className="mt-4 flex flex-wrap gap-2.5">
          {items.map((item) => (
            <span
              key={item}
              className={cx(
                "inline-flex items-center rounded-full border px-3 py-2 text-[13px] font-medium",
                pillTone,
              )}
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white/80 px-4 py-5">
          <div className={CARD_TITLE}>{emptyTitle}</div>
          <div className={`mt-2 ${BODY_TEXT}`}>{emptyNote}</div>
        </div>
      )}
    </article>
  );
}

export type TrendPoint = {
  label: string;
  value: number;
};

export function ProgressTrendCard({
  points,
  state,
}: {
  points: TrendPoint[];
  state: HomeSurfaceState;
}) {
  const graphWidth = 100;
  const graphHeight = 44;
  const max = Math.max(...points.map((point) => point.value), 1);
  const polyline = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * graphWidth;
      const y = graphHeight - (point.value / max) * graphHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <article
      className={cx(
        "rounded-[24px] border px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]",
        surfaceTone(state),
      )}
    >
      <div className="grid gap-1.5">
        <div className={SECTION_LABEL}>Progress over time</div>
        <h2 className={SECTION_TITLE}>Progress over time</h2>
        <p className={BODY_TEXT}>
          See how confidence and coverage have changed over recent weeks.
        </p>
      </div>

      {state === "loading" ? (
        <div className="mt-5 h-[210px] animate-pulse rounded-[20px] bg-slate-100" />
      ) : points.length ? (
        <div className="mt-5 rounded-[20px] border border-slate-200 bg-slate-50/70 p-4">
          <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="h-[170px] w-full">
            <defs>
              <linearGradient id="progressArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(59,130,246,0.24)" />
                <stop offset="100%" stopColor="rgba(59,130,246,0.02)" />
              </linearGradient>
            </defs>
            <polyline
              fill="url(#progressArea)"
              stroke="none"
              points={`0,${graphHeight} ${polyline} ${graphWidth},${graphHeight}`}
            />
            <polyline
              fill="none"
              stroke="rgb(59,130,246)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={polyline}
            />
            {points.map((point, index) => {
              const x = (index / Math.max(points.length - 1, 1)) * graphWidth;
              const y = graphHeight - (point.value / max) * graphHeight;
              return <circle key={point.label} cx={x} cy={y} r="2.6" fill="rgb(15,23,42)" />;
            })}
          </svg>

          <div className="mt-4 grid grid-cols-6 gap-2">
            {points.map((point) => (
              <div key={point.label} className="grid gap-1">
                <div className={META_TEXT}>{point.label}</div>
                <div className={CARD_TITLE}>{point.value}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-[18px] border border-dashed border-slate-200 bg-white/80 px-4 py-5">
          <div className={CARD_TITLE}>No progress signals yet</div>
          <div className={`mt-2 ${BODY_TEXT}`}>
            Capture a few learning moments to begin seeing the picture.
          </div>
        </div>
      )}
    </article>
  );
}

export function CoverageReadinessCard({
  eyebrow,
  title,
  value,
  note,
  state,
  progress,
}: {
  eyebrow: string;
  title: string;
  value: string;
  note: string;
  state: HomeSurfaceState;
  progress: number;
}) {
  const clamped = Math.max(0, Math.min(progress, 100));

  return (
    <article
      className={cx(
        "rounded-[24px] border px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]",
        surfaceTone(state),
      )}
    >
      <div className="grid gap-1.5">
        <div className={SECTION_LABEL}>{eyebrow}</div>
        <h2 className={SECTION_TITLE}>{title}</h2>
      </div>

      {state === "loading" ? (
        <>
          <div className="mt-5 h-16 w-16 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-4 h-5 w-24 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-3 h-4 w-40 animate-pulse rounded-full bg-slate-100" />
        </>
      ) : (
        <>
          <div className="mt-5 flex items-center gap-4">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-[6px] border-slate-100" />
              <div
                className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-blue-500 border-r-violet-400"
                style={{ transform: `rotate(${Math.round((clamped / 100) * 360)}deg)` }}
              />
              <div className="absolute inset-0 grid place-items-center text-[12px] font-semibold text-slate-600">
                {clamped}%
              </div>
            </div>
            <div>
              <div className="text-[28px] font-bold tracking-tight text-slate-950">{value}</div>
              <div className={`mt-1 ${META_TEXT}`}>{note}</div>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

export function ProgressNextMoveCard({
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

