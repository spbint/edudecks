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
  if (state === "placeholder") return "border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(248,250,252,0.96)_100%)]";
  return "border-slate-200 bg-white";
}

export function ReportMetricCard({
  label,
  value,
  note,
  state,
  accent = "blue",
}: {
  label: string;
  value: string;
  note: string;
  state: HomeSurfaceState;
  accent?: "blue" | "violet" | "emerald" | "amber";
}) {
  const accentTone =
    accent === "violet"
      ? "bg-violet-100 text-violet-700"
      : accent === "emerald"
        ? "bg-emerald-100 text-emerald-700"
        : accent === "amber"
          ? "bg-amber-100 text-amber-700"
          : "bg-blue-100 text-blue-700";

  return (
    <article className={cx("rounded-[22px] border px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]", surfaceTone(state))}>
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

export function ReportInsightCard({
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
  tone?: "blue" | "amber" | "rose";
}) {
  const pillTone =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "rose"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <article className={cx("rounded-[24px] border px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]", surfaceTone(state))}>
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
            <span key={item} className={cx("inline-flex items-center rounded-full border px-3 py-2 text-[13px] font-medium", pillTone)}>
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

export function ReportEvidenceHighlights({
  items,
  state,
}: {
  items: Array<{ title: string; note: string; href: string }>;
  state: HomeSurfaceState;
}) {
  return (
    <section className={cx("rounded-[24px] border px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]", surfaceTone(state))}>
      <div className="grid gap-1.5">
        <div className={SECTION_LABEL}>Evidence highlights</div>
        <h2 className={SECTION_TITLE}>Evidence highlights</h2>
      </div>
      {state === "loading" ? (
        <div className="mt-4 grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-[18px] bg-slate-100" />
          ))}
        </div>
      ) : items.length ? (
        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <Link key={`${item.title}-${item.href}`} href={item.href} className="grid gap-1 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4 transition hover:bg-slate-50">
              <div className={CARD_TITLE}>{item.title}</div>
              <div className={META_TEXT}>{item.note}</div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white/80 px-4 py-5">
          <div className={CARD_TITLE}>No linked evidence highlights yet</div>
          <div className={`mt-2 ${BODY_TEXT}`}>Curriculum-linked captures will appear here once evidence is connected.</div>
        </div>
      )}
    </section>
  );
}

export function ReportReadinessCard({
  title,
  value,
  note,
  progress,
  state,
}: {
  title: string;
  value: string;
  note: string;
  progress: number;
  state: HomeSurfaceState;
}) {
  const clamped = Math.max(0, Math.min(progress, 100));
  return (
    <article className={cx("rounded-[24px] border px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]", surfaceTone(state))}>
      <div className={SECTION_LABEL}>Report readiness</div>
      <h2 className="mt-2 text-[18px] font-bold tracking-tight text-slate-950">{title}</h2>
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

export function ReportNextMoveCard({
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
    <section className={cx("rounded-[26px] border px-6 py-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]", surfaceTone(state))}>
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
          <Link href={href} className={`mt-5 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 ${CTA_TEXT} text-white transition hover:bg-slate-800`}>
            {cta}
          </Link>
        </>
      )}
    </section>
  );
}
