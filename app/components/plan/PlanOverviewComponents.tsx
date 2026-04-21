"use client";

import Link from "next/link";
import React from "react";
import type { HomeSurfaceState } from "@/app/components/home/HomeOverviewComponents";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const SECTION_EYEBROW = "text-[11px] font-black uppercase tracking-[0.22em] text-slate-500";
const CARD_EYEBROW = "text-[11px] font-black uppercase tracking-[0.18em] text-slate-500";
const SECTION_TITLE = "text-[23px] font-black leading-tight tracking-tight text-slate-950";
const CARD_TITLE = "text-[18px] font-black tracking-tight text-slate-950";
const SUPPORT_TEXT = "text-sm leading-6 text-slate-600";
const META_TEXT = "text-xs leading-5 text-slate-500";
const CTA_TEXT = "text-sm font-bold";

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
        <span className={`rounded-full border border-slate-200 bg-white px-3 py-1 ${CARD_EYEBROW}`}>
          {cta}
        </span>
      </div>

      <div className="mt-4">
        <div className={CARD_TITLE}>{label}</div>
        <div className={`mt-2 ${SUPPORT_TEXT}`}>{note}</div>
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
        <div className={CARD_EYEBROW}>
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
          <div className={`mt-2 ${SUPPORT_TEXT}`}>{note}</div>
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
          <div className={SECTION_EYEBROW}>
            {eyebrow}
          </div>
          <h2 className={`mt-2 ${SECTION_TITLE}`}>{title}</h2>
          <p className={`mt-2 ${SUPPORT_TEXT}`}>{note}</p>
        </div>

        <Link
          href={ctaHref}
          className={`inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 ${CTA_TEXT} text-slate-900 transition hover:bg-slate-50`}
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
                  <div className="text-[15px] font-black text-slate-950">{item.title}</div>
                  {item.meta ? <div className={`mt-1 font-semibold ${META_TEXT}`}>{item.meta}</div> : null}
                </div>
                {item.status ? (
                  <span className={`shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 ${CARD_EYEBROW}`}>
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
          <div className={SECTION_EYEBROW}>
            Weekly rhythm
          </div>
          <h2 className={`mt-2 ${SECTION_TITLE}`}>This week</h2>
          <p className={`mt-2 ${SUPPORT_TEXT}`}>
            Keep the week visible without overcrowding it.
          </p>
        </div>

        <Link
          href={ctaHref}
          className={`inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 ${CTA_TEXT} text-slate-900 transition hover:bg-slate-50`}
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
                  <div className="text-[15px] font-black text-slate-950">{day.label}</div>
                  <div className={`font-semibold ${META_TEXT}`}>{day.dateLabel}</div>
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
                      <div className="text-[13px] font-black text-slate-900">{block.title}</div>
                      <div className={`mt-1 font-semibold ${META_TEXT}`}>
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
      <div className={SECTION_EYEBROW}>
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
          <h2 className="mt-3 text-[27px] font-black leading-tight tracking-tight text-slate-950">{title}</h2>
          <p className="mt-2 max-w-[760px] text-sm leading-6 text-slate-600">{note}</p>
          <Link
            href={ctaHref}
            className={`mt-5 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 ${CTA_TEXT} text-white transition hover:bg-slate-800`}
          >
            {ctaLabel}
          </Link>
        </>
      )}
    </section>
  );
}

export type PlannerSubject =
  | "Literacy"
  | "Numeracy"
  | "Bible"
  | "Inquiry"
  | "Creative";

export const PLANNER_SUBJECTS: PlannerSubject[] = [
  "Literacy",
  "Numeracy",
  "Bible",
  "Inquiry",
  "Creative",
];

export type PlannerBlock = {
  id: string;
  title: string;
  subject: PlannerSubject;
  note: string;
  time: string;
};

export function PlannerControlStrip({
  weekLabel,
  selectedDayLabel,
  onToday,
  onPreviousWeek,
  onNextWeek,
  onAddBlock,
}: {
  weekLabel: string;
  selectedDayLabel: string;
  onToday: () => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onAddBlock: () => void;
}) {
  const buttonBase =
    `inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 ${CTA_TEXT} text-slate-700 transition hover:bg-slate-50`;

  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={buttonBase} onClick={onToday}>
          Today
        </button>
        <button type="button" className={buttonBase} onClick={onPreviousWeek} aria-label="Previous week">
          ←
        </button>
        <button type="button" className={buttonBase} onClick={onNextWeek} aria-label="Next week">
          →
        </button>
        <div className="ml-1 grid gap-1">
          <div className={SECTION_EYEBROW}>
            This week
          </div>
          <div className={CARD_TITLE}>{weekLabel}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
          Selected day <strong className="ml-1 text-slate-800">{selectedDayLabel}</strong>
        </span>
        <button
          type="button"
          className={`inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2 ${CTA_TEXT} text-white transition hover:bg-slate-800`}
          onClick={onAddBlock}
        >
          Add learning block
        </button>
      </div>
    </div>
  );
}

export function PlannerQuickAddRow({
  title,
  subject,
  note,
  optionalTime,
  selectedDayLabel,
  onTitleChange,
  onSubjectChange,
  onNoteChange,
  onOptionalTimeChange,
  onAdd,
  disabled,
}: {
  title: string;
  subject: PlannerSubject;
  note: string;
  optionalTime: string;
  selectedDayLabel: string;
  onTitleChange: (value: string) => void;
  onSubjectChange: (value: PlannerSubject) => void;
  onNoteChange: (value: string) => void;
  onOptionalTimeChange: (value: string) => void;
  onAdd: () => void;
  disabled?: boolean;
}) {
  const inputClass =
    "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300";

  return (
    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className={SECTION_EYEBROW}>
            Quick add
          </div>
          <div className={`mt-2 font-semibold ${SUPPORT_TEXT}`}>
            Add a small learning block for <span className="font-black text-slate-900">{selectedDayLabel}</span>.
          </div>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr_0.7fr_auto]">
        <input
          className={inputClass}
          placeholder="Start with one small learning moment…"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
        <select
          className={inputClass}
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value as PlannerSubject)}
        >
          {PLANNER_SUBJECTS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <input
          className={inputClass}
          placeholder="Optional time"
          value={optionalTime}
          onChange={(event) => onOptionalTimeChange(event.target.value)}
        />
        <button
          type="button"
          className={`inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 ${CTA_TEXT} text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300`}
          onClick={onAdd}
          disabled={disabled}
        >
          Add block
        </button>
      </div>

      <textarea
        className="min-h-[84px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300"
        placeholder="Optional note for this learning block…"
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
      />
    </section>
  );
}

export function PlannerStickyNote({
  value,
  onChange,
  onBlur,
  statusLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  statusLabel?: string;
}) {
  return (
    <div className="grid gap-2 rounded-[18px] border border-amber-200 bg-[linear-gradient(180deg,rgba(254,249,195,0.92)_0%,rgba(254,243,199,0.88)_100%)] px-3 py-3 shadow-[0_8px_18px_rgba(146,64,14,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <div className={CARD_EYEBROW.replace("text-slate-500", "text-amber-800/80")}>
          Today’s note
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700/70">
          {statusLabel || (value.trim() ? "Saved" : "Open")}
        </div>
      </div>
      <textarea
        className="min-h-[96px] w-full resize-none rounded-[14px] border border-amber-200/70 bg-white/45 px-3 py-3 text-xs leading-5 text-slate-700 outline-none transition placeholder:text-amber-700/60 focus:border-amber-300 focus:bg-white/70"
        placeholder="A gentle note for today..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}

export function PlannerBlockCard({
  block,
}: {
  block: PlannerBlock;
}) {
  return (
    <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="text-[14px] font-black text-slate-900">{block.title}</div>
      <div className={`mt-1 font-semibold ${META_TEXT}`}>
        {[block.subject, block.time].filter(Boolean).join(" • ") || "Planned"}
      </div>
      {block.note ? <div className="mt-2 text-xs leading-5 text-slate-600">{block.note}</div> : null}
    </div>
  );
}

export function PlannerDayCard({
  label,
  dateLabel,
  today,
  focused,
  note,
  blocks,
  noteStatusLabel,
  onNoteChange,
  onNoteBlur,
  onAddBlock,
  onOpenDay,
  quickAddOptions,
  captureHref,
}: {
  label: string;
  dateLabel: string;
  today?: boolean;
  focused?: boolean;
  note: string;
  blocks: PlannerBlock[];
  noteStatusLabel?: string;
  onNoteChange: (value: string) => void;
  onNoteBlur: () => void;
  onAddBlock: () => void;
  onOpenDay: () => void;
  quickAddOptions: Array<{ label: string; subject: PlannerSubject; onClick: () => void }>;
  captureHref: string;
}) {
  const buttonBase =
    "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-bold text-slate-700 transition hover:bg-slate-50";

  return (
    <article
      className={cx(
        "grid gap-3.5 rounded-[22px] border p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]",
        focused
          ? "border-blue-200 bg-blue-50/40 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
          : "border-slate-200 bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={CARD_TITLE}>{label}</div>
          <div className={`mt-0.5 font-semibold ${META_TEXT}`}>{dateLabel}</div>
        </div>
        {today ? (
          <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
            Today
          </span>
        ) : null}
      </div>

      <PlannerStickyNote
        value={note}
        onChange={onNoteChange}
        onBlur={onNoteBlur}
        statusLabel={noteStatusLabel}
      />

      <div className="grid gap-2">
        {blocks.length ? (
          blocks.map((block) => <PlannerBlockCard key={block.id} block={block} />)
        ) : (
          <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-3 py-5 text-center text-xs font-semibold text-slate-500">
            Start with one small learning moment
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonBase} onClick={onAddBlock}>
          + Add block
        </button>
        <button type="button" className={buttonBase} onClick={onOpenDay}>
          Open day
        </button>
        <Link
          href={captureHref}
          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
        >
          Capture
        </Link>
      </div>

      <div className="grid gap-2">
        <div className={CARD_EYEBROW}>
          Quick add
        </div>
        <div className="flex flex-wrap gap-2">
          {quickAddOptions.map((chip) => (
            <button key={`${label}-${chip.label}`} type="button" className={buttonBase} onClick={chip.onClick}>
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

export function VisualWeeklyPlanner({
  state,
  weekLabel,
  selectedDayLabel,
  onToday,
  onPreviousWeek,
  onNextWeek,
  onAddFromControl,
  quickAddRow,
  savingLabel,
  errorMessage,
  statusMessage,
  children,
}: {
  state: HomeSurfaceState;
  weekLabel: string;
  selectedDayLabel: string;
  onToday: () => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onAddFromControl: () => void;
  quickAddRow: React.ReactNode;
  savingLabel?: string;
  errorMessage?: string;
  statusMessage?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cx(
        "grid gap-4 rounded-[26px] border px-6 py-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]",
        surfaceTone(state),
      )}
    >
      <div>
        <div className={SECTION_EYEBROW}>
          Weekly planner
        </div>
        <h2 className={`mt-2 ${SECTION_TITLE}`}>This week</h2>
        <p className={`mt-2 ${SUPPORT_TEXT}`}>
          Keep the week visible and shape it gently, one day at a time.
        </p>
      </div>

      <PlannerControlStrip
        weekLabel={weekLabel}
        selectedDayLabel={selectedDayLabel}
        onToday={onToday}
        onPreviousWeek={onPreviousWeek}
        onNextWeek={onNextWeek}
        onAddBlock={onAddFromControl}
      />

      {quickAddRow}

      {errorMessage ? (
        <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {statusMessage || savingLabel ? (
        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          {[statusMessage, savingLabel].filter(Boolean).join(" • ")}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">{children}</div>
    </section>
  );
}
