"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";

type ViewMode = "week" | "day" | "month";

type ChildRecord = {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  age?: number | string;
  year_level?: string;
};

type CalendarCategory =
  | "Literacy"
  | "Numeracy"
  | "Bible"
  | "Inquiry"
  | "Creative"
  | "Life Skills"
  | "Outdoor";

type CalendarItem = {
  id: string;
  studentId: string;
  date: string;
  title: string;
  content: string;
  category: CalendarCategory;
  timeLabel: string;
  createdAt: string;
};

type DayNoteMap = Record<string, string>;
type CalendarItemMap = Record<string, CalendarItem[]>;

type PlannerAction = {
  id: string;
  title: string;
  description: string;
  category: "observe" | "do" | "capture" | "reflect";
  completed: boolean;
};

type PlannerCalendarSyncPayload = {
  studentId: string;
  weekKey: string;
  focusTitle: string;
  focusSummary: string;
  encouragement: string;
  actions: PlannerAction[];
  updatedAt: string;
};

type PlannerCalendarSyncMap = Record<string, PlannerCalendarSyncPayload>;

type CalendarCaptureContext = {
  studentId: string;
  date: string;
  title: string;
  category: CalendarCategory;
  notes: string;
  createdAt: string;
};

const STORAGE_KEYS = {
  ACTIVE_STUDENT: "edudecks_active_student_id",
  CHILDREN: "edudecks_children_seed_v1",
  CALENDAR_ITEMS: "edudecks_calendar_items_v1",
  CALENDAR_NOTES: "edudecks_calendar_notes_v1",
  PLANNER_CALENDAR_SYNC: "edudecks_planner_calendar_sync_v1",
  CALENDAR_CAPTURE_CONTEXT: "edudecks_calendar_capture_context_v1",
};

const CATEGORY_STYLES: Record<
  CalendarCategory,
  {
    bg: string;
    border: string;
    text: string;
    chipBg: string;
    chipText: string;
    monthBar: string;
  }
> = {
  Literacy: {
    bg: "#eaf2ff",
    border: "#87b2ff",
    text: "#1d4ed8",
    chipBg: "#dbeafe",
    chipText: "#1e40af",
    monthBar: "#60a5fa",
  },
  Numeracy: {
    bg: "#ecfdf3",
    border: "#86efac",
    text: "#15803d",
    chipBg: "#dcfce7",
    chipText: "#166534",
    monthBar: "#4ade80",
  },
  Bible: {
    bg: "#fff7e8",
    border: "#fcd34d",
    text: "#b45309",
    chipBg: "#fef3c7",
    chipText: "#92400e",
    monthBar: "#fbbf24",
  },
  Inquiry: {
    bg: "#f4ebff",
    border: "#c4b5fd",
    text: "#7c3aed",
    chipBg: "#ede9fe",
    chipText: "#6d28d9",
    monthBar: "#8b5cf6",
  },
  Creative: {
    bg: "#fff0f7",
    border: "#f9a8d4",
    text: "#be185d",
    chipBg: "#fce7f3",
    chipText: "#9d174d",
    monthBar: "#ec4899",
  },
  "Life Skills": {
    bg: "#eefbf8",
    border: "#99f6e4",
    text: "#0f766e",
    chipBg: "#ccfbf1",
    chipText: "#115e59",
    monthBar: "#14b8a6",
  },
  Outdoor: {
    bg: "#f6ffe8",
    border: "#bef264",
    text: "#4d7c0f",
    chipBg: "#ecfccb",
    chipText: "#3f6212",
    monthBar: "#84cc16",
  },
};

const CATEGORY_OPTIONS: CalendarCategory[] = [
  "Literacy",
  "Numeracy",
  "Bible",
  "Inquiry",
  "Creative",
  "Life Skills",
  "Outdoor",
];

function safe(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function makeId(prefix = "item"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silent for resilience
  }
}

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeekMonday(date: Date): Date {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return isoDate(a) === isoDate(b);
}

function getWeekKey(date = new Date()): string {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((diffDays + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function normaliseChildren(input: unknown): ChildRecord[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      const row = item as Record<string, unknown>;
      const id = safe(row.id) || makeId("child");
      const first_name =
        safe(row.first_name) ||
        safe(row.firstName) ||
        safe(row.given_name) ||
        safe(row.givenName);
      const last_name =
        safe(row.last_name) ||
        safe(row.lastName) ||
        safe(row.surname) ||
        safe(row.family_name) ||
        safe(row.familyName);
      const name = safe(row.name);
      const age =
        typeof row.age === "number" || typeof row.age === "string"
          ? row.age
          : undefined;
      const year_level =
        safe(row.year_level) ||
        safe(row.yearLevel) ||
        safe(row.grade) ||
        safe(row.class_level);

      return {
        id,
        first_name,
        last_name,
        name,
        age,
        year_level,
      };
    })
    .filter((c) => safe(c.id));
}

function getChildDisplayName(child: ChildRecord | null): string {
  if (!child) return "your learner";
  const full =
    safe(child.name) ||
    [safe(child.first_name), safe(child.last_name)].filter(Boolean).join(" ");
  return full || "your learner";
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
  });
}

function formatWeekHeader(start: Date): string {
  const end = addDays(start, 6);
  const startMonth = start.toLocaleDateString("en-AU", { month: "short" });
  const endMonth = end.toLocaleDateString("en-AU", { month: "short" });
  return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth} ${end.getFullYear()}`;
}

function formatShortWeekDay(date: Date): string {
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
  });
}

function getMonthGrid(anchor: Date): Date[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = startOfWeekMonday(firstOfMonth);
  return Array.from({ length: 42 }).map((_, index) => addDays(gridStart, index));
}

function getDayLoadLabel(count: number): string {
  if (count === 0) return "Open";
  if (count <= 2) return "Light day";
  if (count <= 4) return "Balanced";
  return "Busy";
}

function mapPlannerActionToCalendarCategory(action: PlannerAction): CalendarCategory {
  const text = `${safe(action.title)} ${safe(action.description)}`.toLowerCase();

  if (text.includes("read") || text.includes("writing") || text.includes("spell") || text.includes("literacy")) {
    return "Literacy";
  }
  if (text.includes("math") || text.includes("numeracy") || text.includes("number")) {
    return "Numeracy";
  }
  if (text.includes("bible") || text.includes("prayer") || text.includes("devotion")) {
    return "Bible";
  }
  if (text.includes("science") || text.includes("inquiry") || text.includes("question") || text.includes("investigation")) {
    return "Inquiry";
  }
  if (text.includes("draw") || text.includes("art") || text.includes("creative") || text.includes("music")) {
    return "Creative";
  }
  if (text.includes("routine") || text.includes("calm") || text.includes("confidence") || text.includes("wellbeing")) {
    return "Life Skills";
  }
  if (text.includes("outdoor") || text.includes("nature") || text.includes("walk")) {
    return "Outdoor";
  }

  switch (action.category) {
    case "observe":
      return "Inquiry";
    case "capture":
      return "Creative";
    case "reflect":
      return "Bible";
    case "do":
    default:
      return "Literacy";
  }
}

function buildCaptureHref(args: {
  date: string;
  title?: string;
  category?: CalendarCategory;
  studentId?: string;
}) {
  const params = new URLSearchParams();
  if (safe(args.date)) params.set("date", safe(args.date));
  if (safe(args.title)) params.set("title", safe(args.title));
  if (safe(args.category)) params.set("category", safe(args.category));
  if (safe(args.studentId)) params.set("studentId", safe(args.studentId));
  const query = params.toString();
  return query ? `/capture?${query}` : "/capture";
}

export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<ViewMode>("week");
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [activeStudentId, setActiveStudentId] = useState("");
  const [anchorDate, setAnchorDate] = useState<Date>(today);

  const [itemsByStudent, setItemsByStudent] = useState<Record<string, CalendarItem[]>>({});
  const [notesByStudent, setNotesByStudent] = useState<Record<string, Record<string, string>>>({});
  const [plannerSyncMap, setPlannerSyncMap] = useState<PlannerCalendarSyncMap>({});

  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftCategory, setDraftCategory] = useState<CalendarCategory>("Literacy");
  const [draftTimeLabel, setDraftTimeLabel] = useState("");
  const [draftDate, setDraftDate] = useState<string>(isoDate(today));
  const [bridgeMessage, setBridgeMessage] = useState("");

  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const activeChild = useMemo(
    () => children.find((child) => child.id === activeStudentId) || null,
    [children, activeStudentId]
  );

  useEffect(() => {
    const loadedChildren = normaliseChildren(
      readJson<unknown[]>(STORAGE_KEYS.CHILDREN, [])
    );

    const storedActiveStudent = safe(
      window.localStorage.getItem(STORAGE_KEYS.ACTIVE_STUDENT)
    );

    const initialStudentId =
      storedActiveStudent || loadedChildren[0]?.id || "default-family-child";

    setChildren(
      loadedChildren.length > 0
        ? loadedChildren
        : [{ id: "default-family-child", name: "Your learner" }]
    );
    setActiveStudentId(initialStudentId);

    setItemsByStudent(readJson<Record<string, CalendarItem[]>>(STORAGE_KEYS.CALENDAR_ITEMS, {}));
    setNotesByStudent(
      readJson<Record<string, Record<string, string>>>(STORAGE_KEYS.CALENDAR_NOTES, {})
    );
    setPlannerSyncMap(
      readJson<PlannerCalendarSyncMap>(STORAGE_KEYS.PLANNER_CALENDAR_SYNC, {})
    );
  }, []);

  useEffect(() => {
    if (!activeStudentId) return;
    window.localStorage.setItem(STORAGE_KEYS.ACTIVE_STUDENT, activeStudentId);
  }, [activeStudentId]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.CALENDAR_ITEMS, itemsByStudent);
  }, [itemsByStudent]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.CALENDAR_NOTES, notesByStudent);
  }, [notesByStudent]);

  const studentItems = useMemo(() => {
    return itemsByStudent[activeStudentId] || [];
  }, [itemsByStudent, activeStudentId]);

  const studentNotes = useMemo(() => {
    return notesByStudent[activeStudentId] || {};
  }, [notesByStudent, activeStudentId]);

  const weekDates = useMemo(() => {
    const start = startOfWeekMonday(anchorDate);
    return Array.from({ length: 7 }).map((_, idx) => addDays(start, idx));
  }, [anchorDate]);

  const monthGridDates = useMemo(() => getMonthGrid(anchorDate), [anchorDate]);

  const currentWeekKey = useMemo(() => getWeekKey(anchorDate), [anchorDate]);

  const plannerBridge = useMemo(() => {
    if (!activeStudentId) return null;
    return plannerSyncMap[`${activeStudentId}:${currentWeekKey}`] || null;
  }, [plannerSyncMap, activeStudentId, currentWeekKey]);

  const pendingPlannerActions = useMemo(() => {
    return (plannerBridge?.actions || []).filter((action) => !action.completed);
  }, [plannerBridge]);

  function itemsForDate(dateIso: string) {
    return studentItems
      .filter((item) => item.date === dateIso)
      .sort((a, b) => (a.timeLabel || "").localeCompare(b.timeLabel || ""));
  }

  function focusToolbarInput() {
    window.setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 30);
  }

  function handleAddItem() {
    if (!activeStudentId) return;
    if (!safe(draftTitle)) return;

    const nextItem: CalendarItem = {
      id: makeId("calendar"),
      studentId: activeStudentId,
      date: draftDate,
      title: safe(draftTitle),
      content: safe(draftContent),
      category: draftCategory,
      timeLabel: safe(draftTimeLabel),
      createdAt: new Date().toISOString(),
    };

    setItemsByStudent((current) => {
      const existing = current[activeStudentId] || [];
      return {
        ...current,
        [activeStudentId]: [...existing, nextItem],
      };
    });

    setDraftTitle("");
    setDraftContent("");
    setDraftTimeLabel("");
  }

  function handleDeleteItem(itemId: string) {
    if (!activeStudentId) return;
    setItemsByStudent((current) => {
      const existing = current[activeStudentId] || [];
      return {
        ...current,
        [activeStudentId]: existing.filter((item) => item.id !== itemId),
      };
    });
  }

  function updateDayNote(dateIso: string, value: string) {
    if (!activeStudentId) return;
    setNotesByStudent((current) => ({
      ...current,
      [activeStudentId]: {
        ...(current[activeStudentId] || {}),
        [dateIso]: value,
      },
    }));
  }

  function moveAnchor(direction: number) {
    if (view === "month") {
      const next = new Date(anchorDate);
      next.setMonth(next.getMonth() + direction);
      setAnchorDate(next);
      return;
    }

    if (view === "week") {
      setAnchorDate(addDays(anchorDate, direction * 7));
      return;
    }

    setAnchorDate(addDays(anchorDate, direction));
  }

  function jumpToday() {
    setAnchorDate(today);
    setDraftDate(isoDate(today));
  }

  function openDay(date: Date) {
    setAnchorDate(date);
    setDraftDate(isoDate(date));
    setView("day");
  }

  function prepareDraftForDate(
    dateIso: string,
    seedTitle = "",
    seedCategory: CalendarCategory = "Literacy"
  ) {
    setDraftDate(dateIso);
    setDraftCategory(seedCategory);
    setDraftTitle(seedTitle);
    setDraftContent("");
    setDraftTimeLabel("");
    focusToolbarInput();
  }

  function quickAddToDate(dateIso: string, category: CalendarCategory, title: string) {
    if (!activeStudentId) return;

    const nextItem: CalendarItem = {
      id: makeId("calendar"),
      studentId: activeStudentId,
      date: dateIso,
      title,
      content: "",
      category,
      timeLabel: "",
      createdAt: new Date().toISOString(),
    };

    setItemsByStudent((current) => {
      const existing = current[activeStudentId] || [];
      return {
        ...current,
        [activeStudentId]: [...existing, nextItem],
      };
    });
  }

  function addPlannerActionToDate(action: PlannerAction, dateIso: string) {
    if (!activeStudentId) return;

    const nextItem: CalendarItem = {
      id: makeId("planner"),
      studentId: activeStudentId,
      date: dateIso,
      title: safe(action.title) || "Planner action",
      content: safe(action.description),
      category: mapPlannerActionToCalendarCategory(action),
      timeLabel: "",
      createdAt: new Date().toISOString(),
    };

    setItemsByStudent((current) => {
      const existing = current[activeStudentId] || [];
      return {
        ...current,
        [activeStudentId]: [...existing, nextItem],
      };
    });

    setBridgeMessage(`Added "${action.title}" to ${dateIso}.`);
    window.setTimeout(() => setBridgeMessage(""), 1800);
  }

  function addPlannerActionToFirstOpenDay(action: PlannerAction) {
    const firstOpen = weekDates.find((date) => itemsForDate(isoDate(date)).length === 0);
    const fallback = weekDates[0];
    const target = firstOpen || fallback;
    addPlannerActionToDate(action, isoDate(target));
  }

  function importAllPlannerActionsAcrossWeek() {
    pendingPlannerActions.forEach((action, index) => {
      const target = weekDates[index % weekDates.length];
      addPlannerActionToDate(action, isoDate(target));
    });
    setBridgeMessage("Imported planner actions into this week.");
    window.setTimeout(() => setBridgeMessage(""), 2000);
  }

  function rememberCaptureContext(args: {
    date: string;
    title?: string;
    category?: CalendarCategory;
    notes?: string;
  }) {
    if (typeof window === "undefined" || !activeStudentId) return;

    const payload: CalendarCaptureContext = {
      studentId: activeStudentId,
      date: safe(args.date),
      title: safe(args.title),
      category: args.category || "Literacy",
      notes: safe(args.notes),
      createdAt: new Date().toISOString(),
    };

    writeJson(STORAGE_KEYS.CALENDAR_CAPTURE_CONTEXT, payload);
  }

  const pageHeading =
    view === "week"
      ? `Week of ${formatWeekHeader(startOfWeekMonday(anchorDate))}`
      : view === "month"
      ? formatMonthYear(anchorDate)
      : formatLongDate(anchorDate);

  const weekFocusText =
    "Use the calendar to place gentle learning blocks across the week without turning home into school.";

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.heroCard}>
          <div style={styles.heroTop}>
            <div>
              <div style={styles.eyebrow}>Family Calendar</div>
              <h1 style={styles.heroTitle}>Plan visually for {getChildDisplayName(activeChild)}</h1>
              <p style={styles.heroText}>
                Keep your rhythm visible across the day, week, and month. This
                calendar is designed to support learning gently, not pressure it.
              </p>
            </div>

            <div style={styles.heroActions}>
              <Link href="/planner" style={styles.subtleLinkButton}>
                Back to Planner
              </Link>
              <Link
                href={buildCaptureHref({
                  date: draftDate,
                  title: draftTitle,
                  category: draftCategory,
                  studentId: activeStudentId,
                })}
                style={styles.primaryLinkButton}
                onClick={() =>
                  rememberCaptureContext({
                    date: draftDate,
                    title: draftTitle,
                    category: draftCategory,
                    notes: draftContent,
                  })
                }
              >
                Capture
              </Link>
            </div>
          </div>

          <div style={styles.heroMetaRow}>
            <div style={styles.metaPill}>
              <span style={styles.metaLabel}>Current view</span>
              <span style={styles.metaValue}>{view.toUpperCase()}</span>
            </div>
            <div style={styles.metaPill}>
              <span style={styles.metaLabel}>This week’s focus</span>
              <span style={styles.metaValue}>{weekFocusText}</span>
            </div>
          </div>
        </section>

        {view === "week" && plannerBridge ? (
          <section style={styles.bridgeCard}>
            <div style={styles.bridgeTop}>
              <div>
                <div style={styles.bridgeEyebrow}>Planner sync</div>
                <div style={styles.bridgeTitle}>
                  {safe(plannerBridge.focusTitle) || "This week’s planner focus"}
                </div>
                <div style={styles.bridgeText}>
                  {safe(plannerBridge.focusSummary) ||
                    "Planner actions are ready to place into your week."}
                </div>
              </div>

              <div style={styles.bridgeTopActions}>
                <button
                  type="button"
                  style={styles.bridgePrimaryButton}
                  onClick={importAllPlannerActionsAcrossWeek}
                >
                  Import all to week
                </button>
                <Link href="/planner" style={styles.bridgeSecondaryLink}>
                  Open planner
                </Link>
              </div>
            </div>

            {safe(plannerBridge.encouragement) ? (
              <div style={styles.bridgeEncouragement}>{plannerBridge.encouragement}</div>
            ) : null}

            {pendingPlannerActions.length > 0 ? (
              <div style={styles.bridgeGrid}>
                {pendingPlannerActions.map((action) => (
                  <div key={action.id} style={styles.bridgeActionCard}>
                    <div style={styles.bridgeActionTitle}>{action.title}</div>
                    {safe(action.description) ? (
                      <div style={styles.bridgeActionText}>{action.description}</div>
                    ) : null}

                    <div style={styles.bridgeActionButtons}>
                      <button
                        type="button"
                        style={styles.bridgeSmallButton}
                        onClick={() => addPlannerActionToFirstOpenDay(action)}
                      >
                        Add to first open day
                      </button>

                      <div style={styles.bridgeDayButtons}>
                        {weekDates.map((date) => (
                          <button
                            key={isoDate(date)}
                            type="button"
                            style={styles.bridgeDayButton}
                            onClick={() => addPlannerActionToDate(action, isoDate(date))}
                          >
                            {date.toLocaleDateString("en-AU", { weekday: "short" })}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.bridgeEmpty}>
                No incomplete planner actions are waiting to be placed into the calendar this week.
              </div>
            )}

            <div style={styles.bridgeMessage}>{bridgeMessage}</div>
          </section>
        ) : null}

        <section style={styles.toolbarCard}>
          <div style={styles.toolbarTop}>
            <div style={styles.navCluster}>
              <button onClick={jumpToday} style={styles.lightButton} type="button">
                Today
              </button>
              <button onClick={() => moveAnchor(-1)} style={styles.iconButton} type="button">
                ←
              </button>
              <button onClick={() => moveAnchor(1)} style={styles.iconButton} type="button">
                →
              </button>
              <div style={styles.dateTitle}>{pageHeading}</div>
            </div>

            <div style={styles.rightToolbar}>
              <select
                value={activeStudentId}
                onChange={(e) => setActiveStudentId(e.target.value)}
                style={styles.select}
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {getChildDisplayName(child)}
                    {safe(child.year_level) ? ` • ${safe(child.year_level)}` : ""}
                  </option>
                ))}
              </select>

              <div style={styles.viewToggle}>
                {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setView(mode)}
                    type="button"
                    style={{
                      ...styles.toggleButton,
                      ...(view === mode ? styles.toggleButtonActive : {}),
                    }}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.addBar}>
            <input
              ref={titleInputRef}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Add a simple learning moment..."
              style={styles.input}
            />
            <select
              value={draftCategory}
              onChange={(e) => setDraftCategory(e.target.value as CalendarCategory)}
              style={styles.select}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              value={draftTimeLabel}
              onChange={(e) => setDraftTimeLabel(e.target.value)}
              placeholder="Optional time"
              style={styles.timeInput}
            />
            <input
              type="date"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              style={styles.dateInput}
            />
            <button onClick={handleAddItem} style={styles.addButton} type="button">
              Add
            </button>
          </div>

          <textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            placeholder="Optional notes for this learning block..."
            rows={2}
            style={styles.quickTextarea}
          />
        </section>

        {view === "week" && (
          <section style={styles.weekSection}>
            {weekDates.map((date) => {
              const dateIso = isoDate(date);
              const isToday = isSameDay(date, today);
              const dayItems = itemsForDate(dateIso);
              const dayLoad = getDayLoadLabel(dayItems.length);

              return (
                <div
                  key={dateIso}
                  style={{
                    ...styles.weekColumn,
                    ...(isToday ? styles.todayColumn : {}),
                  }}
                >
                  <div style={styles.weekHeader}>
                    <div>
                      <div style={styles.weekDayName}>{formatShortWeekDay(date)}</div>
                      <div style={styles.dayLoadText}>{dayLoad}</div>
                    </div>
                    {isToday && <div style={styles.todayBadge}>Today</div>}
                  </div>

                  <textarea
                    value={studentNotes[dateIso] || ""}
                    onChange={(e) => updateDayNote(dateIso, e.target.value)}
                    placeholder="A gentle note for today..."
                    rows={4}
                    style={styles.dayNote}
                  />

                  <div style={styles.columnItems}>
                    {dayItems.length === 0 ? (
                      <div style={styles.weekEmptyState}>
                        <div style={styles.weekEmptyTitle}>
                          Start with one small learning moment
                        </div>
                        <div style={styles.weekEmptyText}>
                          Keep it light. Add one block, capture one moment, or place one focus for the day.
                        </div>
                        <div style={styles.weekEmptyActions}>
                          <button
                            type="button"
                            style={styles.inlineActionButton}
                            onClick={() =>
                              prepareDraftForDate(dateIso, "Learning block", "Literacy")
                            }
                          >
                            + Add block
                          </button>
                          <button
                            type="button"
                            style={styles.inlineGhostButton}
                            onClick={() => openDay(date)}
                          >
                            Open day
                          </button>
                          <Link
                            href={buildCaptureHref({
                              date: dateIso,
                              title: "Learning block",
                              category: "Literacy",
                              studentId: activeStudentId,
                            })}
                            style={styles.inlineLinkButton}
                            onClick={() =>
                              rememberCaptureContext({
                                date: dateIso,
                                title: "Learning block",
                                category: "Literacy",
                              })
                            }
                          >
                            Capture
                          </Link>
                        </div>
                      </div>
                    ) : (
                      dayItems.map((item) => {
                        const color = CATEGORY_STYLES[item.category];
                        return (
                          <div
                            key={item.id}
                            style={{
                              ...styles.blockCard,
                              background: color.bg,
                              borderColor: color.border,
                            }}
                          >
                            <div style={styles.blockTop}>
                              <span
                                style={{
                                  ...styles.categoryChip,
                                  background: color.chipBg,
                                  color: color.chipText,
                                }}
                              >
                                {item.category}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                style={styles.deleteInlineButton}
                              >
                                Remove
                              </button>
                            </div>

                            <div style={styles.blockTitle}>{item.title}</div>

                            {safe(item.timeLabel) ? (
                              <div style={styles.blockTime}>{item.timeLabel}</div>
                            ) : (
                              <div style={styles.blockTimeMuted}>Flexible timing</div>
                            )}

                            {safe(item.content) ? (
                              <div style={styles.blockContent}>{item.content}</div>
                            ) : (
                              <div style={styles.blockContentMuted}>
                                Add a short note or leave this block simple.
                              </div>
                            )}

                            <div style={styles.blockFooter}>
                              <button
                                type="button"
                                onClick={() => openDay(date)}
                                style={styles.smallGhostButton}
                              >
                                Open day
                              </button>
                              <Link
                                href={buildCaptureHref({
                                  date: dateIso,
                                  title: item.title,
                                  category: item.category,
                                  studentId: activeStudentId,
                                })}
                                style={styles.smallLinkButton}
                                onClick={() =>
                                  rememberCaptureContext({
                                    date: dateIso,
                                    title: item.title,
                                    category: item.category,
                                    notes: item.content,
                                  })
                                }
                              >
                                Capture this
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}

                    <div style={styles.inlineAddCard}>
                      <div style={styles.inlineAddTitle}>Quick add</div>
                      <div style={styles.inlineAddActions}>
                        <button
                          type="button"
                          style={styles.inlineActionButton}
                          onClick={() =>
                            prepareDraftForDate(dateIso, "Reading together", "Literacy")
                          }
                        >
                          Literacy
                        </button>
                        <button
                          type="button"
                          style={styles.inlineActionButton}
                          onClick={() =>
                            prepareDraftForDate(dateIso, "Maths practice", "Numeracy")
                          }
                        >
                          Numeracy
                        </button>
                        <button
                          type="button"
                          style={styles.inlineActionButton}
                          onClick={() =>
                            prepareDraftForDate(dateIso, "Bible reflection", "Bible")
                          }
                        >
                          Bible
                        </button>
                      </div>

                      <div style={styles.inlineMiniActions}>
                        <button
                          type="button"
                          style={styles.inlineGhostButton}
                          onClick={() =>
                            quickAddToDate(dateIso, "Inquiry", "Inquiry moment")
                          }
                        >
                          + Inquiry
                        </button>
                        <button
                          type="button"
                          style={styles.inlineGhostButton}
                          onClick={() =>
                            quickAddToDate(dateIso, "Creative", "Creative task")
                          }
                        >
                          + Creative
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {view === "day" && (
          <section style={styles.dayLayout}>
            <div style={styles.dayMain}>
              <section style={styles.dayHeroCard}>
                <div>
                  <div style={styles.eyebrow}>Day View</div>
                  <h2 style={styles.dayTitle}>{formatLongDate(anchorDate)}</h2>
                  <p style={styles.dayText}>
                    Use today’s blocks to shape a gentle flow of learning. Keep
                    structure visible, but leave room for flexibility.
                  </p>
                </div>
              </section>

              <section style={styles.dayBlocksWrap}>
                {itemsForDate(isoDate(anchorDate)).length === 0 ? (
                  <div style={styles.dayEmptyCard}>
                    <div style={styles.dayEmptyTitle}>Nothing planned yet for today</div>
                    <p style={styles.dayEmptyText}>
                      Add one or two meaningful learning blocks to get started.
                    </p>
                  </div>
                ) : (
                  itemsForDate(isoDate(anchorDate)).map((item) => {
                    const color = CATEGORY_STYLES[item.category];
                    return (
                      <article
                        key={item.id}
                        style={{
                          ...styles.dayBlockCard,
                          borderColor: color.border,
                        }}
                      >
                        <div
                          style={{
                            ...styles.dayBlockBanner,
                            background: color.monthBar,
                          }}
                        >
                          <div>
                            <div style={styles.dayBlockBannerTitle}>{item.title}</div>
                            <div style={styles.dayBlockBannerTime}>
                              {safe(item.timeLabel) || "Flexible timing"}
                            </div>
                          </div>
                        </div>

                        <div style={styles.dayBlockBody}>
                          <div style={styles.dayBlockMetaRow}>
                            <span
                              style={{
                                ...styles.categoryChip,
                                background: color.chipBg,
                                color: color.chipText,
                              }}
                            >
                              {item.category}
                            </span>

                            <div style={styles.dayBlockActionRow}>
                              <Link
                                href={buildCaptureHref({
                                  date: isoDate(anchorDate),
                                  title: item.title,
                                  category: item.category,
                                  studentId: activeStudentId,
                                })}
                                style={styles.smallLinkButton}
                                onClick={() =>
                                  rememberCaptureContext({
                                    date: isoDate(anchorDate),
                                    title: item.title,
                                    category: item.category,
                                    notes: item.content,
                                  })
                                }
                              >
                                Capture
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                style={styles.smallGhostButton}
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          <div style={styles.dayBlockContent}>
                            {safe(item.content) ||
                              "Add a short note, reminder, or outline for this block."}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </section>
            </div>

            <aside style={styles.daySidebar}>
              <section style={styles.sidebarCard}>
                <div style={styles.sidebarTitle}>Notes for today</div>
                <textarea
                  value={studentNotes[isoDate(anchorDate)] || ""}
                  onChange={(e) => updateDayNote(isoDate(anchorDate), e.target.value)}
                  placeholder="Type a note..."
                  rows={8}
                  style={styles.sidebarNote}
                />
              </section>

              <section style={styles.sidebarCard}>
                <div style={styles.sidebarTitle}>Mini calendar</div>
                <div style={styles.miniMonthLabel}>{formatMonthYear(anchorDate)}</div>
                <div style={styles.miniCalendarGrid}>
                  {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
                    <div key={`${label}-${index}`} style={styles.miniWeekday}>
                      {label}
                    </div>
                  ))}
                  {monthGridDates.map((date) => {
                    const dateIso = isoDate(date);
                    const inMonth = date.getMonth() === anchorDate.getMonth();
                    const selected = isSameDay(date, anchorDate);
                    const itemCount = itemsForDate(dateIso).length;

                    return (
                      <button
                        key={dateIso}
                        type="button"
                        onClick={() => openDay(date)}
                        style={{
                          ...styles.miniDateButton,
                          ...(selected ? styles.miniDateSelected : {}),
                          ...(inMonth ? {} : styles.miniDateMuted),
                        }}
                      >
                        <span>{date.getDate()}</span>
                        {itemCount > 0 ? <span style={styles.miniDot} /> : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            </aside>
          </section>
        )}

        {view === "month" && (
          <section style={styles.monthSection}>
            <div style={styles.monthWeekdays}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
                <div key={label} style={styles.monthWeekday}>
                  {label}
                </div>
              ))}
            </div>

            <div style={styles.monthGrid}>
              {monthGridDates.map((date) => {
                const dateIso = isoDate(date);
                const monthItems = itemsForDate(dateIso);
                const inMonth = date.getMonth() === anchorDate.getMonth();
                const isTodayCell = isSameDay(date, today);

                return (
                  <button
                    key={dateIso}
                    type="button"
                    onClick={() => openDay(date)}
                    style={{
                      ...styles.monthCell,
                      ...(inMonth ? {} : styles.monthCellMuted),
                      ...(isTodayCell ? styles.monthCellToday : {}),
                    }}
                  >
                    <div style={styles.monthCellTop}>
                      <span style={styles.monthDateNumber}>{date.getDate()}</span>
                      {isTodayCell ? <span style={styles.todayMiniBadge}>Today</span> : null}
                    </div>

                    <div style={styles.monthSignals}>
                      {monthItems.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          style={{
                            ...styles.monthSignal,
                            background: CATEGORY_STYLES[item.category].monthBar,
                          }}
                        />
                      ))}
                      {monthItems.length > 3 ? (
                        <div style={styles.moreText}>+{monthItems.length - 3} more</div>
                      ) : null}
                    </div>

                    {safe(studentNotes[dateIso]) ? (
                      <div style={styles.monthNoteHint}>Note saved</div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section style={styles.flowCard}>
          <div>
            <div style={styles.flowTitle}>Continue your flow</div>
            <div style={styles.flowText}>
              Move between planning, capture, portfolio, and reporting without losing the thread.
            </div>
          </div>

          <div style={styles.flowButtons}>
            <Link href="/planner" style={styles.flowButton}>
              Planner
            </Link>
            <Link
              href={buildCaptureHref({
                date: isoDate(anchorDate),
                title: draftTitle,
                category: draftCategory,
                studentId: activeStudentId,
              })}
              style={styles.flowButton}
              onClick={() =>
                rememberCaptureContext({
                  date: isoDate(anchorDate),
                  title: draftTitle,
                  category: draftCategory,
                  notes: draftContent,
                })
              }
            >
              Capture
            </Link>
            <Link href="/portfolio" style={styles.flowButton}>
              Portfolio
            </Link>
            <Link href="/reports" style={styles.flowButton}>
              Reports
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fbff 0%, #f6f7fb 48%, #ffffff 100%)",
    padding: "30px 18px 48px",
  },
  shell: {
    width: "100%",
    maxWidth: 1480,
    margin: "0 auto",
  },
  heroCard: {
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 16px 48px rgba(15,23,42,0.06)",
    marginBottom: 18,
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#64748b",
    marginBottom: 10,
  },
  heroTitle: {
    margin: 0,
    fontSize: "clamp(2rem, 3vw, 3rem)",
    lineHeight: 1.05,
    fontWeight: 800,
    color: "#0f172a",
  },
  heroText: {
    margin: "12px 0 0",
    maxWidth: 760,
    fontSize: 16,
    lineHeight: 1.65,
    color: "#475569",
  },
  heroActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  subtleLinkButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    padding: "0 16px",
    borderRadius: 14,
    border: "1px solid #dbe3ee",
    background: "#fff",
    color: "#0f172a",
    textDecoration: "none",
    fontWeight: 800,
  },
  primaryLinkButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    padding: "0 16px",
    borderRadius: 14,
    border: "none",
    background: "#0f172a",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 800,
  },
  heroMetaRow: {
    marginTop: 16,
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  metaPill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: "10px 14px",
    maxWidth: "100%",
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#64748b",
  },
  metaValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
  },
  bridgeCard: {
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 12px 36px rgba(15,23,42,0.05)",
    marginBottom: 18,
  },
  bridgeTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  bridgeEyebrow: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#64748b",
    marginBottom: 8,
  },
  bridgeTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0f172a",
  },
  bridgeText: {
    marginTop: 8,
    color: "#475569",
    lineHeight: 1.6,
    fontSize: 14,
    maxWidth: 760,
  },
  bridgeTopActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  bridgePrimaryButton: {
    appearance: "none",
    border: "none",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 14,
    padding: "12px 16px",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
  },
  bridgeSecondaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 14,
    padding: "12px 16px",
    fontWeight: 800,
    fontSize: 13,
    textDecoration: "none",
  },
  bridgeEncouragement: {
    marginBottom: 14,
    background: "#f8fbff",
    border: "1px solid #e2ecf7",
    borderRadius: 18,
    padding: 14,
    color: "#334155",
    lineHeight: 1.6,
    fontSize: 14,
    fontWeight: 600,
  },
  bridgeGrid: {
    display: "grid",
    gap: 12,
  },
  bridgeActionCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    background: "#f8fafc",
    padding: 14,
  },
  bridgeActionTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
  },
  bridgeActionText: {
    marginTop: 6,
    color: "#64748b",
    lineHeight: 1.55,
    fontSize: 14,
  },
  bridgeActionButtons: {
    marginTop: 12,
    display: "grid",
    gap: 10,
  },
  bridgeSmallButton: {
    appearance: "none",
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    justifySelf: "start",
  },
  bridgeDayButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  bridgeDayButton: {
    appearance: "none",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#334155",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  bridgeEmpty: {
    color: "#64748b",
    lineHeight: 1.6,
    fontSize: 14,
  },
  bridgeMessage: {
    marginTop: 12,
    minHeight: 20,
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: 700,
  },
  toolbarCard: {
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 12px 36px rgba(15,23,42,0.05)",
    marginBottom: 18,
  },
  toolbarTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  navCluster: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  lightButton: {
    appearance: "none",
    border: "1px solid #dbe3ee",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  iconButton: {
    appearance: "none",
    border: "1px solid #dbe3ee",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 12,
    width: 42,
    height: 42,
    fontSize: 18,
    fontWeight: 800,
    cursor: "pointer",
  },
  dateTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
  },
  rightToolbar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  viewToggle: {
    display: "flex",
    gap: 6,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 4,
  },
  toggleButton: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#475569",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 13,
  },
  toggleButtonActive: {
    background: "#0f172a",
    color: "#fff",
  },
  addBar: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.4fr) auto auto auto auto",
    gap: 10,
    alignItems: "center",
  },
  input: {
    width: "100%",
    minHeight: 48,
    borderRadius: 14,
    border: "1px solid #dbe3ee",
    padding: "12px 14px",
    fontSize: 15,
    outline: "none",
    background: "#fff",
    color: "#0f172a",
  },
  quickTextarea: {
    width: "100%",
    marginTop: 10,
    borderRadius: 16,
    border: "1px solid #dbe3ee",
    padding: "12px 14px",
    fontSize: 14,
    lineHeight: 1.6,
    resize: "vertical",
    outline: "none",
    background: "#fff",
    color: "#334155",
  },
  select: {
    minHeight: 48,
    borderRadius: 14,
    border: "1px solid #dbe3ee",
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
    background: "#fff",
    color: "#0f172a",
  },
  timeInput: {
    minHeight: 48,
    width: 140,
    borderRadius: 14,
    border: "1px solid #dbe3ee",
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
    background: "#fff",
    color: "#0f172a",
  },
  dateInput: {
    minHeight: 48,
    borderRadius: 14,
    border: "1px solid #dbe3ee",
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
    background: "#fff",
    color: "#0f172a",
  },
  addButton: {
    appearance: "none",
    border: "none",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 14,
    padding: "12px 16px",
    fontWeight: 800,
    cursor: "pointer",
    minHeight: 48,
  },
  weekSection: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 14,
    alignItems: "start",
    marginBottom: 20,
  },
  weekColumn: {
    background: "#ffffff",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 24,
    padding: 14,
    boxShadow: "0 12px 30px rgba(15,23,42,0.04)",
    minHeight: 680,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  todayColumn: {
    boxShadow: "0 0 0 2px rgba(59,130,246,0.2), 0 12px 30px rgba(15,23,42,0.06)",
    background: "#fbfdff",
  },
  weekHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  weekDayName: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
  },
  dayLoadText: {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    marginTop: 4,
  },
  todayBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 800,
  },
  dayNote: {
    width: "100%",
    borderRadius: 18,
    border: "1px solid #f5e48d",
    background: "#fffad1",
    padding: "12px 14px",
    resize: "vertical",
    outline: "none",
    minHeight: 110,
    lineHeight: 1.55,
    color: "#334155",
    fontSize: 14,
  },
  columnItems: {
    display: "grid",
    gap: 10,
    alignContent: "start",
  },
  weekEmptyState: {
    border: "1px dashed #cbd5e1",
    background: "#f8fafc",
    borderRadius: 18,
    padding: 14,
  },
  weekEmptyTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 6,
  },
  weekEmptyText: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#64748b",
    marginBottom: 12,
  },
  weekEmptyActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  inlineActionButton: {
    appearance: "none",
    border: "1px solid #dbe3ee",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 12,
    padding: "9px 10px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  inlineGhostButton: {
    appearance: "none",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#334155",
    borderRadius: 12,
    padding: "9px 10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
  },
  inlineLinkButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 12,
    padding: "9px 10px",
    fontSize: 12,
    fontWeight: 800,
    textDecoration: "none",
  },
  blockCard: {
    border: "1px solid",
    borderRadius: 18,
    padding: 12,
  },
  blockTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  categoryChip: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 800,
  },
  deleteInlineButton: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#7f1d1d",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 4,
  },
  blockTime: {
    fontSize: 13,
    fontWeight: 700,
    color: "#475569",
    marginBottom: 8,
  },
  blockTimeMuted: {
    fontSize: 13,
    fontWeight: 700,
    color: "#94a3b8",
    marginBottom: 8,
  },
  blockContent: {
    fontSize: 14,
    lineHeight: 1.55,
    color: "#334155",
    whiteSpace: "pre-wrap",
  },
  blockContentMuted: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#64748b",
  },
  blockFooter: {
    marginTop: 12,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  inlineAddCard: {
    border: "1px dashed #cbd5e1",
    background: "#ffffff",
    borderRadius: 18,
    padding: 12,
  },
  inlineAddTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#475569",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  inlineAddActions: {
    display: "grid",
    gap: 8,
    marginBottom: 8,
  },
  inlineMiniActions: {
    display: "grid",
    gap: 8,
  },
  smallGhostButton: {
    appearance: "none",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#334155",
    borderRadius: 10,
    padding: "8px 10px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    textDecoration: "none",
  },
  smallLinkButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 10,
    padding: "8px 10px",
    fontWeight: 700,
    fontSize: 12,
    textDecoration: "none",
  },
  dayLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.65fr) minmax(300px, 0.55fr)",
    gap: 18,
    alignItems: "start",
    marginBottom: 20,
  },
  dayMain: {
    display: "grid",
    gap: 16,
  },
  dayHeroCard: {
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 12px 36px rgba(15,23,42,0.05)",
  },
  dayTitle: {
    margin: 0,
    fontSize: 32,
    fontWeight: 800,
    color: "#0f172a",
  },
  dayText: {
    margin: "10px 0 0",
    color: "#475569",
    lineHeight: 1.65,
    fontSize: 15,
  },
  dayBlocksWrap: {
    display: "grid",
    gap: 16,
  },
  dayEmptyCard: {
    background: "#fff",
    border: "1px dashed #cbd5e1",
    borderRadius: 22,
    padding: 28,
    textAlign: "center",
  },
  dayEmptyTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 8,
  },
  dayEmptyText: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.6,
  },
  dayBlockCard: {
    background: "#fff",
    border: "1px solid",
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 12px 36px rgba(15,23,42,0.05)",
  },
  dayBlockBanner: {
    padding: "20px 22px",
    color: "#fff",
  },
  dayBlockBannerTitle: {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  dayBlockBannerTime: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 700,
    opacity: 0.92,
  },
  dayBlockBody: {
    padding: 22,
  },
  dayBlockMetaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  dayBlockActionRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  dayBlockContent: {
    color: "#334155",
    fontSize: 15,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
  },
  daySidebar: {
    display: "grid",
    gap: 16,
    position: "sticky",
    top: 24,
    alignSelf: "start",
  },
  sidebarCard: {
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 12px 36px rgba(15,23,42,0.05)",
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 12,
  },
  sidebarNote: {
    width: "100%",
    borderRadius: 18,
    border: "1px solid #f5e48d",
    background: "#fffad1",
    padding: "12px 14px",
    resize: "vertical",
    outline: "none",
    minHeight: 170,
    lineHeight: 1.55,
    color: "#334155",
    fontSize: 14,
  },
  miniMonthLabel: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 10,
  },
  miniCalendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 6,
    alignItems: "center",
  },
  miniWeekday: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: 800,
    color: "#64748b",
    paddingBottom: 4,
  },
  miniDateButton: {
    appearance: "none",
    border: "1px solid transparent",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 12,
    minHeight: 42,
    padding: "6px 4px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    position: "relative",
    display: "grid",
    placeItems: "center",
  },
  miniDateSelected: {
    background: "#dbeafe",
    color: "#1d4ed8",
    borderColor: "#93c5fd",
  },
  miniDateMuted: {
    opacity: 0.35,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    background: "#0f172a",
    position: "absolute",
    bottom: 5,
  },
  monthSection: {
    marginBottom: 20,
  },
  monthWeekdays: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 10,
  },
  monthWeekday: {
    textAlign: "center",
    fontWeight: 800,
    color: "#475569",
    fontSize: 14,
    padding: "8px 0",
  },
  monthGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 10,
  },
  monthCell: {
    appearance: "none",
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 22,
    minHeight: 140,
    padding: 14,
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 10px 28px rgba(15,23,42,0.04)",
  },
  monthCellMuted: {
    opacity: 0.5,
  },
  monthCellToday: {
    boxShadow: "0 0 0 2px rgba(59,130,246,0.18), 0 10px 28px rgba(15,23,42,0.05)",
    background: "#fbfdff",
  },
  monthCellTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  monthDateNumber: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
  },
  todayMiniBadge: {
    fontSize: 11,
    fontWeight: 800,
    color: "#1d4ed8",
    background: "#dbeafe",
    borderRadius: 999,
    padding: "4px 8px",
  },
  monthSignals: {
    display: "grid",
    gap: 6,
  },
  monthSignal: {
    height: 8,
    borderRadius: 999,
  },
  moreText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
  },
  monthNoteHint: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 700,
    color: "#475569",
  },
  flowCard: {
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 12px 34px rgba(15,23,42,0.05)",
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    flexWrap: "wrap",
  },
  flowTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
  },
  flowText: {
    marginTop: 6,
    color: "#64748b",
    lineHeight: 1.6,
    fontSize: 14,
  },
  flowButtons: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  flowButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid #dbe3ee",
    background: "#fff",
    color: "#0f172a",
    textDecoration: "none",
    fontWeight: 800,
  },
};
