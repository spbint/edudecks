"use client";

import React, { useMemo, useState } from "react";

type ViewMode = "day" | "week" | "month";

type SubjectOption =
  | "Literacy"
  | "Numeracy"
  | "Bible"
  | "Inquiry"
  | "Creative"
  | "Science"
  | "Humanities"
  | "Wellbeing";

const SUBJECTS: SubjectOption[] = [
  "Literacy",
  "Numeracy",
  "Bible",
  "Inquiry",
  "Creative",
  "Science",
  "Humanities",
  "Wellbeing",
];

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
  });
}

function formatWeekRange(start: Date, end: Date) {
  const startMonth = start.toLocaleDateString("en-AU", { month: "short" });
  const endMonth = end.toLocaleDateString("en-AU", { month: "short" });

  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `Week of ${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
  }

  return `Week of ${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function buildWeekDays(anchor: Date) {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function buildMonthGrid(anchor: Date) {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(firstOfMonth);

  return Array.from({ length: 35 }, (_, i) => addDays(gridStart, i));
}

function cls(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const surface =
  "rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)]";
const card =
  "rounded-[20px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]";
const pill =
  "inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600";
const buttonBase =
  "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition";
const buttonPrimary =
  `${buttonBase} bg-slate-950 text-white hover:bg-slate-800`;
const buttonSecondary =
  `${buttonBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
const inputClass =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300";
const textareaClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300";

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date("2026-04-11"));
  const [learner, setLearner] = useState("Your learner");
  const [subject, setSubject] = useState<SubjectOption>("Literacy");
  const [momentTitle, setMomentTitle] = useState("");
  const [momentNote, setMomentNote] = useState("");
  const [optionalTime, setOptionalTime] = useState("");
  const [dayNote, setDayNote] = useState("");

  const weekDays = useMemo(() => buildWeekDays(selectedDate), [selectedDate]);
  const monthDays = useMemo(() => buildMonthGrid(selectedDate), [selectedDate]);

  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  const guidanceTitle =
    "This week is still open. Start with one small learning moment and let the week take shape gently.";

  const dayHeading = formatLongDate(selectedDate);

  function goPrevious() {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      if (view === "day") next.setDate(next.getDate() - 1);
      if (view === "week") next.setDate(next.getDate() - 7);
      if (view === "month") next.setMonth(next.getMonth() - 1);
      return next;
    });
  }

  function goNext() {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      if (view === "day") next.setDate(next.getDate() + 1);
      if (view === "week") next.setDate(next.getDate() + 7);
      if (view === "month") next.setMonth(next.getMonth() + 1);
      return next;
    });
  }

  function goToday() {
    setSelectedDate(new Date());
  }

  const topTitle =
    view === "day"
      ? formatLongDate(selectedDate)
      : view === "week"
        ? formatWeekRange(weekStart, weekEnd)
        : formatMonthYear(selectedDate);

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-6 py-8">
      {/* Ribbon */}
      <section className={cls(surface, "px-6 py-5")}>
        <div className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
          How it flows
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {[
            { n: 1, label: "Home", active: false },
            { n: 2, label: "Calendar", active: true },
            { n: 3, label: "Capture", active: false },
            { n: 4, label: "Portfolio", active: false },
          ].map((step, index, arr) => (
            <React.Fragment key={step.label}>
              <div
                className={cls(
                  "inline-flex items-center gap-3 rounded-[18px] border px-4 py-3",
                  step.active
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-700",
                )}
              >
                <div
                  className={cls(
                    "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-black",
                    step.active
                      ? "border-blue-200 bg-white text-blue-700"
                      : "border-slate-200 bg-slate-50 text-slate-500",
                  )}
                >
                  {step.n}
                </div>
                <span className="text-[15px] font-semibold">{step.label}</span>
              </div>
              {index < arr.length - 1 && (
                <span className="text-slate-400">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Hero */}
      <section className={cls(surface, "flex flex-col gap-5 px-8 py-7")}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[760px]">
            <div className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
              Family calendar
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950">
              Plan visually for your learner
            </h1>
            <p className="mt-3 max-w-[700px] text-[15px] leading-7 text-slate-600">
              Keep your rhythm visible across the day, week, and month. This
              calendar is designed to support learning gently, not pressure it.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className={buttonSecondary}>Back to Planner</button>
            <button className={buttonPrimary}>Capture</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className={pill}>
            Current view&nbsp;
            <strong className="text-slate-800">{view.toUpperCase()}</strong>
          </span>
          <span className={pill}>
            This week’s focus&nbsp;
            <strong className="text-slate-800">
              Use the calendar to place gentle learning blocks across the week
              without turning home into school.
            </strong>
          </span>
        </div>
      </section>

      {/* Weekly guidance */}
      <section className={cls(surface, "px-7 py-7")}>
        <div className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
          Weekly guidance
        </div>
        <h2 className="text-[20px] font-black leading-tight text-slate-950">
          {guidanceTitle}
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          A simple Literacy or Numeracy block is enough to begin.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <span className={pill}>No blocks planned yet</span>
          <span className={pill}>No area is leading yet</span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className={cls(card, "p-5")}>
            <div className="text-lg font-bold text-slate-900">
              Covered this week
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Nothing is planned yet.
            </p>
          </div>

          <div className={cls(card, "p-5")}>
            <div className="text-lg font-bold text-slate-900">
              Suggested next block
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Start with one small Literacy or Numeracy block this week.
            </p>
            <button className={cls(buttonPrimary, "mt-4")}>
              Add suggested block
            </button>
          </div>
        </div>

        <div className={cls(card, "mt-4 p-5")}>
          <div className="text-lg font-bold text-slate-900">
            Start with one small learning moment
          </div>
          <p className="mt-3 text-sm text-slate-600">
            A simple Literacy or Numeracy block is enough to begin. You can
            round out the week once the first piece is in place.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className={buttonSecondary}>Add Literacy block</button>
            <button className={buttonSecondary}>Add Numeracy block</button>
          </div>
        </div>
      </section>

      {/* Input / controls */}
      <section className={cls(surface, "px-5 py-5")}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button className={buttonSecondary} onClick={goToday}>
                Today
              </button>
              <button className={buttonSecondary} onClick={goPrevious}>
                ←
              </button>
              <button className={buttonSecondary} onClick={goNext}>
                →
              </button>
              <h3 className="ml-2 text-[18px] font-black text-slate-950">
                {topTitle}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                className={inputClass}
                value={learner}
                onChange={(e) => setLearner(e.target.value)}
              >
                <option>Your learner</option>
              </select>

              <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
                {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setView(mode)}
                    className={cls(
                      "rounded-xl px-4 py-2 text-sm font-bold",
                      view === mode
                        ? "bg-slate-950 text-white"
                        : "text-slate-500 hover:bg-slate-50",
                    )}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.8fr_0.7fr_0.6fr_0.6fr_auto]">
            <input
              className={inputClass}
              placeholder="Add a simple learning moment..."
              value={momentTitle}
              onChange={(e) => setMomentTitle(e.target.value)}
            />
            <select
              className={inputClass}
              value={subject}
              onChange={(e) => setSubject(e.target.value as SubjectOption)}
            >
              {SUBJECTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input
              className={inputClass}
              placeholder="Optional time"
              value={optionalTime}
              onChange={(e) => setOptionalTime(e.target.value)}
            />
            <input
              className={inputClass}
              type="date"
              value={toInputDate(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
            />
            <button className={buttonPrimary}>Add</button>
          </div>

          <textarea
            className={textareaClass}
            rows={2}
            placeholder="Optional notes for this learning block..."
            value={momentNote}
            onChange={(e) => setMomentNote(e.target.value)}
          />

          <div className="text-xs text-slate-500">Storage mode: local</div>
        </div>
      </section>

      {/* Calendar body */}
      {view === "week" && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-7">
          {weekDays.map((day) => {
            const label = day.toLocaleDateString("en-AU", {
              weekday: "short",
              day: "numeric",
            });
            const isToday =
              toInputDate(day) === toInputDate(new Date("2026-03-31"));

            return (
              <div key={day.toISOString()} className={cls(card, "p-4")}>
                <div className="mb-2 flex items-start justify-between">
                  <div className="text-[18px] font-black text-slate-900">
                    {label}
                  </div>
                  {isToday && (
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                      Today
                    </span>
                  )}
                </div>

                <div className="mb-2 text-xs font-semibold text-slate-500">
                  Open
                </div>

                <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-slate-600">
                  A gentle note for today...
                </div>

                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3">
                  <div className="text-sm font-bold text-slate-900">
                    Start with one small learning moment
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Keep it light. Add one block, capture one moment, or place
                    one focus for the day.
                  </p>

                  <div className="mt-3 flex flex-col gap-2">
                    <button className={buttonSecondary}>+ Add block</button>
                    <button className={buttonSecondary}>Open day</button>
                    <button className={buttonPrimary}>Capture</button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                    Quick add
                  </div>
                  <div className="grid gap-2">
                    {["Literacy", "Numeracy", "Bible", "+ Inquiry", "+ Creative"].map(
                      (chip) => (
                        <button key={chip} className={buttonSecondary}>
                          {chip}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {view === "day" && (
        <section className="grid gap-4 lg:grid-cols-[2fr_360px]">
          <div className={cls(surface, "px-6 py-6")}>
            <div className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
              Day view
            </div>
            <h3 className="text-[20px] font-black text-slate-950">
              {dayHeading}
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Use today’s blocks to shape a gentle flow of learning. Keep
              structure visible, but leave room for flexibility.
            </p>

            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <div className="text-[18px] font-black text-slate-900">
                Nothing planned yet for today
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Add one or two meaningful learning blocks to get started.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className={cls(surface, "px-5 py-5")}>
              <div className="text-lg font-bold text-slate-900">
                Notes for today
              </div>
              <textarea
                className="mt-4 h-40 w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm outline-none"
                placeholder="Type a note..."
                value={dayNote}
                onChange={(e) => setDayNote(e.target.value)}
              />
            </div>

            <div className={cls(surface, "px-5 py-5")}>
              <div className="text-lg font-bold text-slate-900">
                Mini calendar
              </div>
              <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div key={`${d}-${i}`} className="font-bold">
                    {d}
                  </div>
                ))}
                {buildMonthGrid(selectedDate).slice(0, 35).map((d) => {
                  const active = toInputDate(d) === toInputDate(selectedDate);
                  return (
                    <div
                      key={d.toISOString()}
                      className={cls(
                        "rounded-xl px-2 py-2",
                        active ? "bg-blue-50 font-black text-blue-700" : "",
                      )}
                    >
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {view === "month" && (
        <section>
          <div className="mb-3 grid grid-cols-7 gap-4 px-2 text-center text-xs font-black uppercase tracking-[0.22em] text-slate-500">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-4">
            {monthDays.map((day) => {
              const active = day.getMonth() === selectedDate.getMonth();
              const isToday =
                toInputDate(day) === toInputDate(new Date("2026-03-31"));

              return (
                <div
                  key={day.toISOString()}
                  className={cls(
                    card,
                    "min-h-[120px] p-4",
                    !active && "opacity-45",
                    isToday && "border-blue-200",
                  )}
                >
                  <div className="text-lg font-black text-slate-900">
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Continue your flow */}
      <section className={cls(surface, "flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between")}>
        <div>
          <div className="text-lg font-bold text-slate-950">
            Continue your flow
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Move between planning, capture, portfolio, and reporting without
            losing the thread.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {["Planner", "Capture", "Portfolio", "Reports"].map((item) => (
            <button key={item} className={buttonSecondary}>
              {item}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}