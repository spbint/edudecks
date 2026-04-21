"use client";

import Link from "next/link";
import React from "react";
import type { HomeSurfaceState } from "@/app/components/home/HomeOverviewComponents";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function surfaceTone(state: HomeSurfaceState) {
  if (state === "empty") return "border-dashed border-slate-200 bg-slate-50/80";
  if (state === "placeholder") return "border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(248,250,252,0.96)_100%)]";
  return "border-slate-200 bg-white";
}

export type PlanActionCardProps = {
  href: string;
  icon: string;
  label: string;
  note: string;
  cta: string;
  state?: HomeSurfaceState;
};

export function PlanActionCard({
  href,
  icon,
  label,
  note,
  cta,
  state = "derived",
}: PlanActionCardProps) {
  return (
    <Link
      href={href}
      className={cx(
        "group rounded-[24px] border px-5 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]",
        surfaceTone(state),
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-950 text-sm font-black tracking-[0.16em] text-white">
          {icon}
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
          {cta}
        </span>
      </div>

      <div className="mt-5">
        <div className="text-[17px] font-black text-slate-950">{label}</div>
        <div className="mt-2 text-sm leading-6 text-slate-600">{note}</div>
      </div>
    </Link>
  );
}

export type PlanMetricCardProps = {
  label: string;
  value: string;
  note: string;
  state: HomeSurfaceState;
  accent?: "blue" | "violet" | "emerald" | "amber";
};

export function PlanMetricCard({
  label,
  value,
  note,
  state,
  accent = "blue",
}: PlanMetricCardProps) {
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
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
          {label}
        </div>
        <span className={cx("inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[11px] font-black", accentTone)}>
          {label.slice(0, 1)}
        </span>
      </div>

      {state === "loading" ? (
        <>
          <div className="mt-4 h-9 w-20 animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-3 h-4 w-32 animate-pulse rounded-full bg-slate-100" />
        </>
      ) : (
        <>
          <div className="mt-4 text-[30px] font-black tracking-tight text-slate-950">{value}</div>
          <div className="mt-2 text-sm leading-6 text-slate-600">{note}</div>
        </>
      )}
    </article>
  );
}

export type PlanListItem = {
  title: string;
  meta?: string;
  status?: string;
};

export type PlanListCardProps = {
  eyebrow: string;
  title: string;
  note: string;
  items: PlanListItem[];
  state: HomeSurfaceState;
  emptyTitle: string;
  emptyNote: string;
  ctaLabel: string;
  ctaHref: string;
};

export function PlanListCard({
  eyebrow,
  title,
  note,
  items,
  state,
  emptyTitle,
  emptyNote,
  ctaLabel,
  ctaHref,
}: PlanListCardProps) {
  return (
    <article
      className={cx(
        "rounded-[26px] border px-6 py-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]",
        surfaceTone(state),
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
            {eyebrow}
          </div>
          <h2 className="mt-3 text-[24px] font-black leading-tight text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
        </div>

        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
        >
          {ctaLabel}
        </Link>
      </div>

      {state === "loading" ? (
        <div className="mt-5 grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-[20px] border border-slate-200 bg-white p-4">
              <div className="h-4 w-40 animate-pulse rounded-full bg-slate-100" />
              <div className="mt-3 h-3 w-24 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      ) : items.length ? (
        <div className="mt-5 grid gap-3">
          {items.map((item) => (
            <div key={`${item.title}-${item.meta}`} className="rounded-[20px] border border-slate-200 bg-white/90 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-950">{item.title}</div>
                  {item.meta ? <div className="mt-1 text-xs font-semibold text-slate-500">{item.meta}</div> : null}
                </div>
                {item.status ? (
                  <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                    {item.status}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[22px] border border-dashed border-slate-200 bg-white/80 px-5 py-6">
          <div className="text-base font-black text-slate-950">{emptyTitle}</div>
          <div className="mt-2 text-sm leading-6 text-slate-600">{emptyNote}</div>
        </div>
      )}
    </article>
  );
}

export type WeeklyRhythmDay = {
  id: string;
  label: string;
  dateLabel: string;
  blocks: Array<{ title: string; subject?: string; time?: string }>;
  note?: string;
  today?: boolean;
};

export type WeeklyRhythmCardProps = {
  state: HomeSurfaceState;
  days: WeeklyRhythmDay[];
  ctaHref: string;
};

export function WeeklyRhythmCard({
  state,
  days,
  ctaHref,
}: WeeklyRhythmCardProps) {
  return (
    <section
      className={cx(
        "rounded-[26px] border px-6 py-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]",
        surfaceTone(state),
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
            Weekly rhythm
          </div>
          <h2 className="mt-3 text-[24px] font-black leading-tight text-slate-950">This week</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Keep the week visible without overcrowding it.
          </p>
        </div>

        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
        >
          Open My Calendar
        </Link>
      </div>

      {state === "loading" ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-[20px] border border-slate-200 bg-white p-4">
              <div className="h-4 w-16 animate-pulse rounded-full bg-slate-100" />
              <div className="mt-4 h-20 animate-pulse rounded-[18px] bg-slate-100" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-3 lg:grid-cols-5">
          {days.map((day) => (
            <article
              key={day.id}
              className={cx(
                "rounded-[20px] border bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)]",
                day.today ? "border-blue-200 bg-blue-50/50" : "border-slate-200",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-black text-slate-950">{day.label}</div>
                  <div className="text-xs font-semibold text-slate-500">{day.dateLabel}</div>
                </div>
                {day.today ? (
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                    Today
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid gap-2">
                {day.blocks.length ? (
                  day.blocks.slice(0, 3).map((block) => (
                    <div key={`${day.id}-${block.title}-${block.time}`} className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="text-xs font-black text-slate-900">{block.title}</div>
                      <div className="mt-1 text-[11px] font-semibold text-slate-500">
                        {[block.subject, block.time].filter(Boolean).join(" • ") || "Planned"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-3 py-5 text-center text-xs font-semibold text-slate-500">
                    Open and ready to shape
                  </div>
                )}
              </div>

              {day.note ? <div className="mt-3 text-xs leading-5 text-slate-500">{day.note}</div> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export type PlanNextMoveCardProps = {
  title: string;
  note: string;
  ctaHref: string;
  ctaLabel: string;
  state: HomeSurfaceState;
};

export function PlanNextMoveCard({
  title,
  note,
  ctaHref,
  ctaLabel,
  state,
}: PlanNextMoveCardProps) {
  return (
    <section
      className={cx(
        "rounded-[26px] border px-6 py-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]",
        surfaceTone(state),
      )}
    >
      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
        Next best move
      </div>
      {state === "loading" ? (
        <>
          <div className="mt-4 h-8 w-64 animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-3 h-4 w-80 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-5 h-11 w-40 animate-pulse rounded-full bg-slate-100" />
        </>
      ) : (
        <>
          <h2 className="mt-4 text-[28px] font-black leading-tight text-slate-950">{title}</h2>
          <p className="mt-3 max-w-[760px] text-sm leading-7 text-slate-600">{note}</p>
          <Link
            href={ctaHref}
            className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            {ctaLabel}
          </Link>
        </>
      )}
    </section>
  );
}
