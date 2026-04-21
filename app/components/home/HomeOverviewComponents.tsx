"use client";

import Link from "next/link";
import React from "react";

export type HomeSurfaceState =
  | "live"
  | "derived"
  | "empty"
  | "loading"
  | "placeholder";

export type CompactStat = {
  label: string;
  value: string;
  note?: string;
  state?: HomeSurfaceState;
};

export type LearnerOption = {
  id: string;
  label: string;
  note?: string;
};

type QuickActionCardProps = {
  href: string;
  icon: string;
  label: string;
  note?: string;
  cta?: string;
};

type MetricCardProps = {
  label: string;
  value: string;
  note: string;
  state: HomeSurfaceState;
  progress?: number;
};

type SpaceCardProps = {
  title: string;
  note: string;
  href: string;
  cta: string;
  state: HomeSurfaceState;
  pill: string;
};

type ActivityItem = {
  label: string;
  tag: string;
  time: string;
};

type RecentActivityListProps = {
  items: ActivityItem[];
  state: HomeSurfaceState;
  emptyTitle: string;
  emptyNote: string;
};

type NextBestMoveCardProps = {
  title: string;
  note: string;
  href: string;
  cta: string;
  state: HomeSurfaceState;
};

type FamilySummaryPanelProps = {
  familyName: string;
  learners: LearnerOption[];
  activeLearnerId?: string;
  onSelectLearner?: (learnerId: string) => void;
  stats: CompactStat[];
  state: HomeSurfaceState;
};

type LearnerSelectorProps = {
  familyName: string;
  learners: LearnerOption[];
  activeLearnerId?: string;
  onSelectLearner?: (learnerId: string) => void;
  state: HomeSurfaceState;
};

type LearnerSummaryRowProps = {
  stats: CompactStat[];
  state: HomeSurfaceState;
};

function stateMeta(state: HomeSurfaceState) {
  if (state === "live") {
    return {
      label: "Live",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }
  if (state === "derived") {
    return {
      label: "Derived",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }
  if (state === "empty") {
    return {
      label: "Empty",
      className: "border-slate-200 bg-slate-100 text-slate-600",
    };
  }
  if (state === "loading") {
    return {
      label: "Loading",
      className: "border-violet-200 bg-violet-50 text-violet-700",
    };
  }
  return {
    label: "Preview",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  };
}

function StateBadge({ state }: { state: HomeSurfaceState }) {
  const meta = stateMeta(state);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function LoadingBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-slate-200/80 ${className}`} />;
}

export function HomeSectionHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="grid gap-1">
      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
        {eyebrow}
      </div>
      <h2 className="text-[22px] font-black tracking-tight text-slate-950">{title}</h2>
    </div>
  );
}

export function HomeHeroSummaryCard({
  familyName,
  stats,
  state,
}: {
  familyName: string;
  stats: CompactStat[];
  state: HomeSurfaceState;
}) {
  return (
    <aside className="grid gap-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
            Family summary
          </div>
          <div className="text-base font-black text-slate-950">{familyName}</div>
        </div>
        <StateBadge state={state} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[20px] border border-slate-200 bg-slate-50/70 px-4 py-3"
          >
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              {stat.label}
            </div>
            <div className="mt-2 text-sm font-black text-slate-950">
              {state === "loading" ? (
                <LoadingBlock className="h-4 w-24" />
              ) : (
                stat.value
              )}
            </div>
            <div className="mt-1 text-xs leading-5 text-slate-500">
              {state === "loading" ? <LoadingBlock className="h-3 w-20" /> : stat.note}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function FamilySummaryPanel({
  familyName,
  learners,
  activeLearnerId,
  onSelectLearner,
  stats,
  state,
}: FamilySummaryPanelProps) {
  return (
    <aside className="grid gap-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
            My Family
          </div>
          <div className="text-base font-black text-slate-950">{familyName}</div>
        </div>
        <StateBadge state={state} />
      </div>

      {state === "loading" ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
              <LoadingBlock className="h-4 w-20" />
              <LoadingBlock className="mt-2 h-3 w-14" />
            </div>
          ))}
        </div>
      ) : learners.length ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {learners.map((learner) => {
            const active = learner.id === activeLearnerId;
            return (
              <button
                key={learner.id}
                type="button"
                onClick={() => onSelectLearner?.(learner.id)}
                className={`grid gap-1 rounded-[18px] border px-4 py-3 text-left transition ${
                  active
                    ? "border-blue-200 bg-blue-50 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <span className="text-sm font-black text-slate-950">{learner.label}</span>
                <span className="text-xs leading-5 text-slate-500">{learner.note}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
          <div className="text-sm font-black text-slate-950">Add your first learner to get started</div>
          <div className="mt-1 text-sm leading-6 text-slate-500">
            Your family overview becomes more useful once a learner is linked.
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[20px] border border-slate-200 bg-slate-50/70 px-4 py-3"
          >
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              {stat.label}
            </div>
            <div className="mt-2 text-sm font-black text-slate-950">
              {state === "loading" ? <LoadingBlock className="h-4 w-24" /> : stat.value}
            </div>
            <div className="mt-1 text-xs leading-5 text-slate-500">
              {state === "loading" ? <LoadingBlock className="h-3 w-16" /> : stat.note}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function LearnerSelector({
  familyName,
  learners,
  activeLearnerId,
  onSelectLearner,
  state,
}: LearnerSelectorProps) {
  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
            My Family
          </div>
          <div className="text-base font-black text-slate-950">{familyName}</div>
        </div>
        <StateBadge state={state} />
      </div>

      {state === "loading" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
              <LoadingBlock className="h-4 w-20" />
              <LoadingBlock className="mt-2 h-3 w-14" />
            </div>
          ))}
        </div>
      ) : learners.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {learners.map((learner) => {
            const active = learner.id === activeLearnerId;
            return (
              <button
                key={learner.id}
                type="button"
                onClick={() => onSelectLearner?.(learner.id)}
                className={`grid gap-1 rounded-[18px] border px-4 py-4 text-left transition ${
                  active
                    ? "border-blue-200 bg-blue-50 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <span className="text-sm font-black text-slate-950">{learner.label}</span>
                <span className="text-xs leading-5 text-slate-500">{learner.note}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
          <div className="text-sm font-black text-slate-950">Add your first learner to get started</div>
          <div className="mt-1 text-sm leading-6 text-slate-500">
            Your family overview becomes more useful once a learner is linked.
          </div>
        </div>
      )}
    </section>
  );
}

export function LearnerSummaryRow({
  stats,
  state,
}: LearnerSummaryRowProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="grid gap-3 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              {stat.label}
            </div>
            <StateBadge state={stat.state ?? state} />
          </div>
          <div className="text-lg font-black text-slate-950">
            {state === "loading" ? <LoadingBlock className="h-5 w-28" /> : stat.value}
          </div>
          <div className="text-xs leading-5 text-slate-500">
            {state === "loading" ? <LoadingBlock className="h-3 w-20" /> : stat.note}
          </div>
        </article>
      ))}
    </section>
  );
}

export function QuickActionCard({
  href,
  icon,
  label,
  note,
  cta = "Open",
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition hover:-translate-y-[1px] hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(59,130,246,0.12)_0%,rgba(168,85,247,0.12)_65%,rgba(34,197,94,0.12)_100%)] text-sm font-black text-slate-900">
          {icon}
        </span>
        <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
          {cta}
        </span>
      </div>
      <div className="text-[17px] font-black text-slate-950">{label}</div>
      <div className="text-sm leading-6 text-slate-500">{note}</div>
    </Link>
  );
}

export function MetricCard({
  label,
  value,
  note,
  state,
  progress = 0,
}: MetricCardProps) {
  const meta = stateMeta(state);
  const resolvedProgress = Math.max(0, Math.min(progress, 100));

  return (
    <article className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
          {label}
        </div>
        <StateBadge state={state} />
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="text-[28px] font-black tracking-tight text-slate-950">
          {state === "loading" ? <LoadingBlock className="h-8 w-16" /> : value}
        </div>
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-[6px] border-slate-100" />
          <div
            className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-blue-500 border-r-violet-400"
            style={{
              transform: `rotate(${Math.round((resolvedProgress / 100) * 360)}deg)`,
            }}
          />
          <div className="absolute inset-0 grid place-items-center text-[10px] font-black text-slate-500">
            {state === "loading" ? "..." : `${resolvedProgress}%`}
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="h-2 rounded-full bg-slate-100">
          <div
            className={`${meta.className} h-2 rounded-full border-none`}
            style={{ width: `${resolvedProgress}%` }}
          />
        </div>
        <div className="text-xs leading-5 text-slate-500">
          {state === "loading" ? <LoadingBlock className="h-3 w-24" /> : note}
        </div>
      </div>
    </article>
  );
}

export function SpaceCard({
  title,
  note,
  href,
  cta,
  state,
  pill,
}: SpaceCardProps) {
  return (
    <article className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[18px] font-black text-slate-950">{title}</div>
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          {pill}
        </span>
      </div>
      <div className="text-sm leading-6 text-slate-500">{note}</div>
      <div className="flex items-center justify-between gap-3">
        <StateBadge state={state} />
        <Link
          href={href}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          {cta}
        </Link>
      </div>
    </article>
  );
}

export function RecentActivityList({
  items,
  state,
  emptyTitle,
  emptyNote,
}: RecentActivityListProps) {
  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <HomeSectionHeader eyebrow="Activity" title="Recent activity" />
        <StateBadge state={state} />
      </div>

      {state === "loading" ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="grid gap-2 rounded-[18px] border border-slate-200 bg-slate-50 p-4">
              <LoadingBlock className="h-4 w-40" />
              <LoadingBlock className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <div
              key={`${item.label}-${item.time}`}
              className="grid gap-2 rounded-[18px] border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-bold text-slate-950">{item.label}</div>
                <span className="text-xs font-semibold text-slate-400">{item.time}</span>
              </div>
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                {item.tag}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
          <div className="text-sm font-black text-slate-950">{emptyTitle}</div>
          <div className="mt-1 text-sm leading-6 text-slate-500">{emptyNote}</div>
        </div>
      )}
    </section>
  );
}

export function NextBestMoveCard({
  title,
  note,
  href,
  cta,
  state,
}: NextBestMoveCardProps) {
  return (
    <aside className="grid gap-4 rounded-[24px] border border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.94)_60%,rgba(245,243,255,0.92)_100%)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <HomeSectionHeader eyebrow="Next best move" title={title} />
        <StateBadge state={state} />
      </div>
      <div className="text-sm leading-7 text-slate-600">{note}</div>
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
      >
        {cta}
      </Link>
    </aside>
  );
}
