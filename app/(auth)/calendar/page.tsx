"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FamilyProgressRail from "@/app/components/FamilyProgressRail";

type ViewMode = "day" | "week" | "month";
type Subject =
  | "Literacy"
  | "Numeracy"
  | "Bible"
  | "Inquiry"
  | "Creative";

type CalendarBlock = {
  id: string;
  title: string;
  subject: Subject;
  note: string;
  time: string;
};

const SUBJECTS: Subject[] = [
  "Literacy",
  "Numeracy",
  "Bible",
  "Inquiry",
  "Creative",
];

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseYmd(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getBusinessWeek(anchor: Date) {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 5 }, (_, index) => addDays(monday, index));
}

function getBusinessMonthGrid(anchor: Date) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const days: Date[] = [];

  const cursor = new Date(year, month, 1);
  while (cursor.getMonth() === month) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      days.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function formatWeekRange(days: Date[]) {
  const first = days[0];
  const last = days[days.length - 1];
  const firstMonth = first.toLocaleDateString("en-AU", { month: "short" });
  const lastMonth = last.toLocaleDateString("en-AU", { month: "short" });
  const year = last.getFullYear();

  return `Week of ${first.getDate()} ${firstMonth} – ${last.getDate()} ${lastMonth} ${year}`;
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
  });
}

function formatDayHeading(date: Date) {
  return date.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function shortWeekday(date: Date) {
  return date.toLocaleDateString("en-AU", { weekday: "short" });
}

function prettyDate(date: Date) {
  return `${shortWeekday(date)} ${date.getDate()}`;
}

const surface =
  "rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_34px_rgba(15,23,42,0.05)]";
const card =
  "rounded-[20px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]";
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
  const router = useRouter();

  const [view, setView] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date("2026-04-11"));
  const [learner, setLearner] = useState("Your learner");
  const [subject, setSubject] = useState<Subject>("Literacy");
  const [momentTitle, setMomentTitle] = useState("");
  const [momentNote, setMomentNote] = useState("");
  const [optionalTime, setOptionalTime] = useState("");

  const [dayNotes, setDayNotes] = useState<Record<string, string>>({});
  const [blocks, setBlocks] = useState<Record<string, CalendarBlock[]>>({});

  const weekDays = useMemo(() => getBusinessWeek(selectedDate), [selectedDate]);
  const monthDays = useMemo(() => getBusinessMonthGrid(selectedDate), [selectedDate]);

  function addBlockForDate(date: Date, title?: string, forcedSubject?: Subject) {
    const key = ymd(date);
    const trimmed = (title ?? momentTitle).trim();
    const finalTitle = trimmed || "Start with one small learning moment";

    const newBlock: CalendarBlock = {
      id: `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: finalTitle,
      subject: forcedSubject ?? subject,
      note: momentNote.trim(),
      time: optionalTime.trim(),
    };

    setBlocks((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), newBlock],
    }));

    setMomentTitle("");
    setMomentNote("");
    setOptionalTime("");
  }

  function updateDayNote(date: Date, value: string) {
    const key = ymd(date);
    setDayNotes((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function addSuggestedBlock() {
    const target = weekDays[0];
    addBlockForDate(target, "Suggested literacy block", "Literacy");
  }

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
      ? formatDayHeading(selectedDate)
      : view === "week"
        ? formatWeekRange(weekDays)
        : formatMonthYear(selectedDate);

  const selectedDayKey = ymd(selectedDate);
  const selectedDayBlocks = blocks[selectedDayKey] ?? [];

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 py-6">
      <div className="flex gap-6">
        <FamilyProgressRail current="calendar" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-6">
            <section className={cx(surface, "px-8 py-7")}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-[760px]">
                  <div className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                    Family calendar
                  </div>
                  <h1 className="text-4xl font-black tracking-tight text-slate-950">
                    Plan visually for your learner
                  </h1>
                  <p className="mt-3 max-w-[700px] text-[15px] leading-7 text-slate-600">
                    Keep your rhythm visible across the day, week, and month.
                    This calendar is designed to support learning gently, not
                    pressure it.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className={buttonSecondary}
                    onClick={() => router.push("/planner")}
                  >
                    Back to Planner
                  </button>
                  <button
                    type="button"
                    className={buttonPrimary}
                    onClick={() => router.push("/capture")}
                  >
                    Capture
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Current view&nbsp;
                  <strong className="text-slate-800">{view.toUpperCase()}</strong>
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                  This week’s focus&nbsp;
                  <strong className="text-slate-800">
                    Use the calendar to place gentle learning blocks across the
                    week without turning home into school.
                  </strong>
                </span>
              </div>
            </section>

            <section className={cx(surface, "px-7 py-7")}>
              <div className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                Weekly guidance
              </div>
              <h2 className="text-[20px] font-black leading-tight text-slate-950">
                This week is still open. Start with one small learning moment and
                let the week take shape gently.
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                A simple Literacy or Numeracy block is enough to begin.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {weekDays.every((day) => (blocks[ymd(day)] ?? []).length === 0)
                    ? "No blocks planned yet"
                    : "You’ve started the week"}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Start small and build gently
                </span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className={cx(card, "p-5")}>
                  <div className="text-lg font-bold text-slate-900">
                    Covered this week
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {weekDays.reduce(
                      (count, day) => count + (blocks[ymd(day)]?.length ?? 0),
                      0,
                    ) === 0
                      ? "Nothing is planned yet."
                      : `${weekDays.reduce(
                          (count, day) => count + (blocks[ymd(day)]?.length ?? 0),
                          0,
                        )} block(s) placed across the week.`}
                  </p>
                </div>

                <div className={cx(card, "p-5")}>
                  <div className="text-lg font-bold text-slate-900">
                    Suggested next block
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Start with one small Literacy or Numeracy block this week.
                  </p>
                  <button
                    type="button"
                    className={cx(buttonPrimary, "mt-4")}
                    onClick={addSuggestedBlock}
                  >
                    Add suggested block
                  </button>
                </div>
              </div>

              <div className={cx(card, "mt-4 p-5")}>
                <div className="text-lg font-bold text-slate-900">
                  Start with one small learning moment
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className={buttonSecondary}
                    onClick={() => {
                      setSubject("Literacy");
                      addBlockForDate(weekDays[0], "Literacy block", "Literacy");
                    }}
                  >
                    Add Literacy block
                  </button>
                  <button
                    type="button"
                    className={buttonSecondary}
                    onClick={() => {
                      setSubject("Numeracy");
                      addBlockForDate(weekDays[0], "Numeracy block", "Numeracy");
                    }}
                  >
                    Add Numeracy block
                  </button>
                </div>
              </div>
            </section>

            <section className={cx(surface, "px-5 py-5")}>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className={buttonSecondary}
                      onClick={goToday}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      className={buttonSecondary}
                      onClick={goPrevious}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className={buttonSecondary}
                      onClick={goNext}
                    >
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
                          type="button"
                          onClick={() => setView(mode)}
                          className={cx(
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
                    onChange={(e) => setSubject(e.target.value as Subject)}
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
                    value={ymd(selectedDate)}
                    onChange={(e) => setSelectedDate(parseYmd(e.target.value))}
                  />
                  <button
                    type="button"
                    className={buttonPrimary}
                    onClick={() => addBlockForDate(selectedDate)}
                  >
                    Add
                  </button>
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

            {view === "week" && (
              <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                {weekDays.map((day) => {
                  const key = ymd(day);
                  const items = blocks[key] ?? [];
                  const today = ymd(day) === ymd(new Date("2026-04-11"));

                  return (
                    <div key={key} className={cx(card, "p-4")}>
                      <div className="mb-2 flex items-start justify-between">
                        <div className="text-[18px] font-black text-slate-900">
                          {prettyDate(day)}
                        </div>
                        {today && (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                            Today
                          </span>
                        )}
                      </div>

                      <div className="mb-2 text-xs font-semibold text-slate-500">
                        Open
                      </div>

                      <textarea
                        className="mb-3 min-h-[70px] w-full rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-5 text-slate-700 outline-none"
                        placeholder="A gentle note for today..."
                        value={dayNotes[key] ?? ""}
                        onChange={(e) => updateDayNote(day, e.target.value)}
                      />

                      {items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3">
                          <div className="text-sm font-bold text-slate-900">
                            Start with one small learning moment
                          </div>

                          <div className="mt-3 flex flex-col gap-2">
                            <button
                              type="button"
                              className={buttonSecondary}
                              onClick={() => addBlockForDate(day, "Learning block")}
                            >
                              + Add block
                            </button>
                            <button
                              type="button"
                              className={buttonSecondary}
                              onClick={() => {
                                setSelectedDate(day);
                                setView("day");
                              }}
                            >
                              Open day
                            </button>
                            <button
                              type="button"
                              className={buttonPrimary}
                              onClick={() => router.push("/capture")}
                            >
                              Capture
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                            >
                              <div className="text-sm font-bold text-slate-900">
                                {item.title}
                              </div>
                              <div className="mt-2 text-xs text-slate-500">
                                {item.subject}
                                {item.time ? ` · ${item.time}` : ""}
                              </div>
                              {item.note ? (
                                <div className="mt-2 text-xs text-slate-600">
                                  {item.note}
                                </div>
                              ) : null}
                            </div>
                          ))}

                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              className={buttonSecondary}
                              onClick={() => addBlockForDate(day, "Learning block")}
                            >
                              + Add block
                            </button>
                            <button
                              type="button"
                              className={buttonSecondary}
                              onClick={() => {
                                setSelectedDate(day);
                                setView("day");
                              }}
                            >
                              Open day
                            </button>
                            <button
                              type="button"
                              className={buttonPrimary}
                              onClick={() => router.push("/capture")}
                            >
                              Capture
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mt-3">
                        <div className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                          Quick add
                        </div>
                        <div className="grid gap-2">
                          {[
                            { label: "Literacy", subject: "Literacy" as Subject },
                            { label: "Numeracy", subject: "Numeracy" as Subject },
                            { label: "Bible", subject: "Bible" as Subject },
                            { label: "+ Inquiry", subject: "Inquiry" as Subject },
                            { label: "+ Creative", subject: "Creative" as Subject },
                          ].map((chip) => (
                            <button
                              key={chip.label}
                              type="button"
                              className={buttonSecondary}
                              onClick={() =>
                                addBlockForDate(day, chip.label, chip.subject)
                              }
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            {view === "day" && (
              <section className="grid gap-4 lg:grid-cols-[2fr_360px]">
                <div className={cx(surface, "px-6 py-6")}>
                  <div className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                    Day view
                  </div>
                  <h3 className="text-[20px] font-black text-slate-950">
                    {formatDayHeading(selectedDate)}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600">
                    Use today’s blocks to shape a gentle flow of learning. Keep
                    structure visible, but leave room for flexibility.
                  </p>

                  <div className="mt-4 flex flex-col gap-3">
                    {selectedDayBlocks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                        <div className="text-[18px] font-black text-slate-900">
                          Nothing planned yet for today
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          Add one or two meaningful learning blocks to get started.
                        </p>
                      </div>
                    ) : (
                      selectedDayBlocks.map((item) => (
                        <div key={item.id} className={cx(card, "p-4")}>
                          <div className="text-lg font-bold text-slate-900">
                            {item.title}
                          </div>
                          <div className="mt-2 text-sm text-slate-500">
                            {item.subject}
                            {item.time ? ` · ${item.time}` : ""}
                          </div>
                          {item.note ? (
                            <div className="mt-2 text-sm text-slate-600">
                              {item.note}
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className={cx(surface, "px-5 py-5")}>
                    <div className="text-lg font-bold text-slate-900">
                      Notes for today
                    </div>
                    <textarea
                      className="mt-4 h-40 w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm outline-none"
                      placeholder="Type a note..."
                      value={dayNotes[selectedDayKey] ?? ""}
                      onChange={(e) => updateDayNote(selectedDate, e.target.value)}
                    />
                  </div>

                  <div className={cx(surface, "px-5 py-5")}>
                    <div className="text-lg font-bold text-slate-900">
                      Mini calendar
                    </div>
                    <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs text-slate-500">
                      {["M", "T", "W", "T", "F"].map((d) => (
                        <div key={d} className="font-bold">
                          {d}
                        </div>
                      ))}
                      {getBusinessMonthGrid(selectedDate).map((d) => {
                        const active = ymd(d) === selectedDayKey;
                        return (
                          <button
                            key={ymd(d)}
                            type="button"
                            onClick={() => setSelectedDate(d)}
                            className={cx(
                              "rounded-xl px-2 py-2",
                              active
                                ? "bg-blue-50 font-black text-blue-700"
                                : "hover:bg-slate-50",
                            )}
                          >
                            {d.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {view === "month" && (
              <section>
                <div className="mb-3 grid grid-cols-5 gap-4 px-2 text-center text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-5 gap-4">
                  {monthDays.map((day) => {
                    const key = ymd(day);
                    const items = blocks[key] ?? [];

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedDate(day);
                          setView("day");
                        }}
                        className={cx(
                          card,
                          "min-h-[132px] p-4 text-left transition hover:bg-slate-50",
                        )}
                      >
                        <div className="text-lg font-black text-slate-900">
                          {day.getDate()}
                        </div>
                        {items.length > 0 ? (
                          <div className="mt-3 text-xs font-semibold text-slate-600">
                            {items.length} planned
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <section
              className={cx(
                surface,
                "flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between",
              )}
            >
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
                <button
                  type="button"
                  className={buttonSecondary}
                  onClick={() => router.push("/planner")}
                >
                  Planner
                </button>
                <button
                  type="button"
                  className={buttonSecondary}
                  onClick={() => router.push("/capture")}
                >
                  Capture
                </button>
                <button
                  type="button"
                  className={buttonSecondary}
                  onClick={() => router.push("/portfolio")}
                >
                  Portfolio
                </button>
                <button
                  type="button"
                  className={buttonSecondary}
                  onClick={() => router.push("/reports")}
                >
                  Reports
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}