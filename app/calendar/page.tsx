"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthModal from "@/app/components/AuthModal";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";
import useIsMobile from "@/app/components/useIsMobile";

type ViewMode = "day" | "week" | "month";
type BlockStatus = "planned" | "done";

type PlannerBlock = {
  id: string;
  user_id: string | null;
  student_id: string | null;
  title: string;
  learning_area: string;
  planned_for: string;
  planned_time: string | null;
  note: string | null;
  status: BlockStatus;
  created_at?: string | null;
  updated_at?: string | null;
};

type PlannerDayNote = {
  id: string;
  user_id: string | null;
  student_id: string | null;
  note_date: string;
  note: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type Learner = {
  id: string;
  label: string;
};

type PendingPlannerBlock = {
  title: string;
  learningArea: string;
  plannedFor: string;
  plannedTime: string;
  note: string;
  studentId: string;
};

const STORAGE_BLOCKS_KEY = "edudecks_calendar_blocks_v1";
const STORAGE_NOTES_KEY = "edudecks_calendar_notes_v1";
const STORAGE_LEARNER_KEY = "edudecks_active_student_id";
const PENDING_BLOCK_KEY = "edudecks_pending_calendar_block_v1";

const LEARNING_AREAS = [
  "Literacy",
  "Numeracy",
  "Bible",
  "Inquiry",
  "Creative",
  "Science",
  "Humanities",
  "Wellbeing",
];

function safeString(value: unknown): string {
  return String(value ?? "").trim();
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(value: string | null | undefined): Date {
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeekMonday(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function endOfWeekSunday(date: Date): Date {
  const d = startOfWeekMonday(date);
  d.setDate(d.getDate() + 6);
  return d;
}

function startOfMonthGrid(date: Date): Date {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfWeekMonday(first);
}

function endOfMonthGrid(date: Date): Date {
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const end = endOfWeekSunday(last);
  return end;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return isoDate(a) === isoDate(b);
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDay(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
  });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function formatWeekLabel(date: Date): string {
  const start = startOfWeekMonday(date);
  const end = endOfWeekSunday(date);

  const startMonth = start.toLocaleDateString(undefined, { month: "short" });
  const endMonth = end.toLocaleDateString(undefined, { month: "short" });

  return `Week of ${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth} ${end.getFullYear()}`;
}

function rangeDates(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  let current = startOfDay(start);
  const final = startOfDay(end);

  while (current <= final) {
    out.push(new Date(current));
    current = addDays(current, 1);
  }

  return out;
}

function getLocalBlocks(): PlannerBlock[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_BLOCKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setLocalBlocks(blocks: PlannerBlock[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_BLOCKS_KEY, JSON.stringify(blocks));
}

function getLocalNotes(): Record<string, PlannerDayNote> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_NOTES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function setLocalNotes(notes: Record<string, PlannerDayNote>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(notes));
}

function buildNoteKey(userId: string | null, studentId: string | null, date: string) {
  return `${userId || "anon"}::${studentId || "none"}::${date}`;
}

function learnerLabel(row: any): string {
  const first =
    safeString(row?.preferred_name || row?.first_name || row?.name || row?.label || row?.title);
  const last = safeString(row?.surname || row?.family_name || row?.last_name);
  return [first, last].filter(Boolean).join(" ").trim() || "Learner";
}

function titleForSuggestedArea(area: string) {
  if (area === "Literacy") return "Literacy learning moment";
  if (area === "Numeracy") return "Numeracy learning moment";
  if (area === "Science") return "Science learning moment";
  if (area === "Humanities") return "Humanities learning moment";
  if (area === "Inquiry") return "Inquiry learning moment";
  if (area === "Creative") return "Creative learning moment";
  if (area === "Bible") return "Bible learning moment";
  return `${area} learning moment`;
}

export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <CalendarPageContent />
    </Suspense>
  );
}

function CalendarPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const [view, setView] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [userId, setUserId] = useState<string | null>(null);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [activeLearnerId, setActiveLearnerId] = useState<string>("");

  const [title, setTitle] = useState("");
  const [learningArea, setLearningArea] = useState("Literacy");
  const [plannedTime, setPlannedTime] = useState("");
  const [toolbarDate, setToolbarDate] = useState(isoDate(new Date()));
  const [toolbarNote, setToolbarNote] = useState("");

  const [blocks, setBlocks] = useState<PlannerBlock[]>([]);
  const [noteText, setNoteText] = useState("");
  const [dayNotesMap, setDayNotesMap] = useState<Record<string, PlannerDayNote>>({});

  const [loading, setLoading] = useState(true);
  const [savingBlock, setSavingBlock] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [storageMode, setStorageMode] = useState<"database" | "local">("local");
  const [message, setMessage] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const qView = safeString(searchParams.get("view")).toLowerCase();
    const qDate = searchParams.get("date");

    if (qView === "day" || qView === "week" || qView === "month") {
      setView(qView);
    }
    if (qDate) {
      const d = parseDate(qDate);
      setSelectedDate(d);
      setToolbarDate(isoDate(d));
    }
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);

      try {
        const auth = await supabase.auth.getUser();
        const uid = auth?.data?.user?.id ?? null;
        if (!mounted) return;
        setUserId(uid);

        const learnerOptions = await loadLearners();
        if (!mounted) return;
        setLearners(learnerOptions);

        const storedLearner =
          typeof window !== "undefined"
            ? safeString(window.localStorage.getItem(STORAGE_LEARNER_KEY))
            : "";

        const chosenLearner =
          learnerOptions.find((l) => l.id === storedLearner)?.id ||
          learnerOptions[0]?.id ||
          "";

        setActiveLearnerId(chosenLearner);

        await loadCalendarData(uid, chosenLearner);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const selectedIso = isoDate(selectedDate);
    setToolbarDate(selectedIso);

    const key = buildNoteKey(userId, activeLearnerId || null, selectedIso);
    setNoteText(dayNotesMap[key]?.note || "");
  }, [selectedDate, activeLearnerId, userId, dayNotesMap]);

  useEffect(() => {
    if (!hasSupabaseEnv || !userId || typeof window === "undefined") return;

    const pendingRaw = window.sessionStorage.getItem(PENDING_BLOCK_KEY);
    if (!pendingRaw) return;

    const pending = parseJson<PendingPlannerBlock | null>(pendingRaw, null);
    if (!pending?.title) return;

    window.sessionStorage.removeItem(PENDING_BLOCK_KEY);
    setAuthModalOpen(false);
    void executeAddBlock(pending, userId);
  }, [userId]);

  async function loadLearners(): Promise<Learner[]> {
    try {
      const childrenRes = await supabase
        .from("children")
        .select("id, preferred_name, first_name, surname, family_name, last_name, name, label, title")
        .limit(50);

      if (!childrenRes.error && Array.isArray(childrenRes.data) && childrenRes.data.length > 0) {
        return childrenRes.data.map((row: any) => ({
          id: safeString(row?.id),
          label: learnerLabel(row),
        }));
      }
    } catch {}

    try {
      const studentsRes = await supabase
        .from("students")
        .select("id, preferred_name, first_name, surname, family_name, last_name, name, label, title")
        .limit(50);

      if (!studentsRes.error && Array.isArray(studentsRes.data) && studentsRes.data.length > 0) {
        return studentsRes.data.map((row: any) => ({
          id: safeString(row?.id),
          label: learnerLabel(row),
        }));
      }
    } catch {}

    return [];
  }

  async function loadCalendarData(uid: string | null, learnerId: string) {
    const localBlocks = getLocalBlocks();
    const localNotes = getLocalNotes();

    try {
      let blockQuery = supabase
        .from("planner_blocks")
        .select("*")
        .order("planned_for", { ascending: true })
        .order("created_at", { ascending: true });

      if (uid) {
        blockQuery = blockQuery.eq("user_id", uid);
      }

      if (learnerId) {
        blockQuery = blockQuery.eq("student_id", learnerId);
      }

      const blockRes = await blockQuery;

      let notesQuery = supabase.from("planner_day_notes").select("*");

      if (uid) {
        notesQuery = notesQuery.eq("user_id", uid);
      }

      if (learnerId) {
        notesQuery = notesQuery.eq("student_id", learnerId);
      }

      const notesRes = await notesQuery;

      if (!blockRes.error && !notesRes.error) {
        setStorageMode("database");
        setBlocks((blockRes.data || []) as PlannerBlock[]);

        const notesMap: Record<string, PlannerDayNote> = {};
        ((notesRes.data || []) as PlannerDayNote[]).forEach((note) => {
          const key = buildNoteKey(note.user_id, note.student_id, note.note_date);
          notesMap[key] = note;
        });

        setDayNotesMap(notesMap);
        return;
      }
    } catch {}

    setStorageMode("local");
    setBlocks(
      localBlocks.filter((b) => {
        const userOk = !uid || b.user_id === uid || !b.user_id;
        const learnerOk = !learnerId || b.student_id === learnerId || !b.student_id;
        return userOk && learnerOk;
      })
    );
    setDayNotesMap(localNotes);
  }

  const visibleDates = useMemo(() => {
    if (view === "day") return [startOfDay(selectedDate)];
    if (view === "week") {
      return rangeDates(startOfWeekMonday(selectedDate), endOfWeekSunday(selectedDate));
    }
    return rangeDates(startOfMonthGrid(selectedDate), endOfMonthGrid(selectedDate));
  }, [view, selectedDate]);

  const blocksByDate = useMemo(() => {
    const map: Record<string, PlannerBlock[]> = {};
    blocks.forEach((block) => {
      const key = safeString(block.planned_for);
      if (!map[key]) map[key] = [];
      map[key].push(block);
    });
    return map;
  }, [blocks]);

  const selectedIso = isoDate(selectedDate);
  const authReturnPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/calendar?${query}` : `/calendar`;
  }, [searchParams]);
  const selectedWeekStart = useMemo(() => startOfWeekMonday(selectedDate), [selectedDate]);
  const selectedWeekEnd = useMemo(() => endOfWeekSunday(selectedDate), [selectedDate]);
  const selectedWeekDates = useMemo(
    () => rangeDates(selectedWeekStart, selectedWeekEnd),
    [selectedWeekStart, selectedWeekEnd]
  );
  const selectedWeekStartIso = isoDate(selectedWeekStart);
  const selectedWeekEndIso = isoDate(selectedWeekEnd);

  const weeklyBlocks = useMemo(
    () =>
      blocks.filter((block) => {
        const plannedFor = safeString(block.planned_for);
        return plannedFor >= selectedWeekStartIso && plannedFor <= selectedWeekEndIso;
      }),
    [blocks, selectedWeekEndIso, selectedWeekStartIso]
  );

  const weeklyAreaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    weeklyBlocks.forEach((block) => {
      const area = safeString(block.learning_area) || "General";
      counts[area] = (counts[area] || 0) + 1;
    });
    return counts;
  }, [weeklyBlocks]);

  const coveredAreas = useMemo(
    () => LEARNING_AREAS.filter((area) => (weeklyAreaCounts[area] || 0) > 0),
    [weeklyAreaCounts]
  );

  const missingAreas = useMemo(
    () => LEARNING_AREAS.filter((area) => !coveredAreas.includes(area)),
    [coveredAreas]
  );

  const strongestArea = useMemo(() => {
    let best = "";
    let bestCount = 0;
    Object.entries(weeklyAreaCounts).forEach(([area, count]) => {
      if (count > bestCount) {
        best = area;
        bestCount = count;
      }
    });
    return best;
  }, [weeklyAreaCounts]);

  const isBalancedWeek =
    weeklyBlocks.length > 0 && coveredAreas.length >= 4 && missingAreas.length <= 4;

  const suggestedNextArea = useMemo(() => {
    if (weeklyBlocks.length === 0) return "Literacy";

    const coreMissing = ["Literacy", "Numeracy", "Science", "Humanities"].find((area) =>
      missingAreas.includes(area)
    );
    if (coreMissing) return coreMissing;

    const anyMissing = LEARNING_AREAS.find((area) => missingAreas.includes(area));
    if (anyMissing) return anyMissing;

    if ((weeklyAreaCounts.Inquiry || 0) === 0) return "Inquiry";
    if ((weeklyAreaCounts.Creative || 0) === 0) return "Creative";
    if ((weeklyAreaCounts.Bible || 0) === 0) return "Bible";
    return "Inquiry";
  }, [missingAreas, weeklyAreaCounts, weeklyBlocks.length]);

  const suggestedNextCopy = useMemo(() => {
    if (weeklyBlocks.length === 0) {
      return "Start with one small Literacy or Numeracy block this week.";
    }

    if (missingAreas.length > 0) {
      if (suggestedNextArea === "Science" || suggestedNextArea === "Humanities") {
        return `A simple ${suggestedNextArea} block would help round out the week.`;
      }
      return `Suggested next block: Add one ${suggestedNextArea} moment this week.`;
    }

    return "This week looks balanced - consider adding one creative or inquiry moment.";
  }, [missingAreas.length, suggestedNextArea, weeklyBlocks.length]);

  const weeklySummaryText = useMemo(() => {
    if (weeklyBlocks.length === 0) {
      return "This week is still open. Start with one small learning moment and let the week take shape gently.";
    }
    if (isBalancedWeek) {
      return "This week is looking balanced. You've already planned a healthy spread of learning.";
    }
    return "This week is beginning to take shape.";
  }, [isBalancedWeek, weeklyBlocks.length]);

  const weeklyCoverageText = useMemo(() => {
    if (weeklyBlocks.length === 0) {
      return "A simple Literacy or Numeracy block is enough to begin.";
    }
    if (missingAreas.length === 0) {
      return "You already have something planned across each learning area in this weekly view.";
    }
    return `Missing this week: ${missingAreas.slice(0, 4).join(", ")}${missingAreas.length > 4 ? "..." : ""}`;
  }, [missingAreas, weeklyBlocks.length]);

  const strongestAreaText =
    weeklyBlocks.length > 0 && strongestArea
      ? `Strongest planned area: ${strongestArea}`
      : "No area is leading yet.";

  const suggestedDateIso = useMemo(() => {
    const firstOpenDay = selectedWeekDates.find((date) => {
      const dateKey = isoDate(date);
      return (blocksByDate[dateKey] || []).length === 0;
    });
    return isoDate(firstOpenDay || selectedDate);
  }, [blocksByDate, selectedDate, selectedWeekDates]);

  function shiftPeriod(direction: -1 | 1) {
    if (view === "day") {
      setSelectedDate(addDays(selectedDate, direction));
      return;
    }

    if (view === "week") {
      setSelectedDate(addDays(selectedDate, direction * 7));
      return;
    }

    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + direction);
    setSelectedDate(d);
  }

  function goToday() {
    const now = new Date();
    setSelectedDate(now);
    setToolbarDate(isoDate(now));
  }

  async function persistBlock(block: PlannerBlock) {
    try {
      const res = await supabase.from("planner_blocks").insert(block).select("*").single();
      if (!res.error && res.data) {
        setStorageMode("database");
        setBlocks((prev) => {
          const next = [...prev, res.data as PlannerBlock].sort((a, b) => {
            if (a.planned_for !== b.planned_for) return a.planned_for.localeCompare(b.planned_for);
            return safeString(a.created_at).localeCompare(safeString(b.created_at));
          });
          return next;
        });
        return true;
      }
    } catch {}

    const local = getLocalBlocks();
    local.push(block);
    setLocalBlocks(local);
    setStorageMode("local");
    setBlocks((prev) => [...prev, block]);
    return false;
  }

  async function executeAddBlock(
    pending: PendingPlannerBlock,
    authenticatedUserId: string | null
  ) {
    setSavingBlock(true);
    setMessage("");

    const block: PlannerBlock = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `local-${Date.now()}`,
      user_id: authenticatedUserId,
      student_id: pending.studentId || null,
      title: pending.title,
      learning_area: pending.learningArea,
      planned_for: pending.plannedFor,
      planned_time: safeString(pending.plannedTime) || null,
      note: safeString(pending.note) || null,
      status: "planned",
    };

    const savedToDatabase = await persistBlock(block);

    setTitle("");
    setToolbarNote("");
    setMessage(savedToDatabase ? "Learning block added." : "Learning block added locally.");
    setSavingBlock(false);
  }

  async function handleAddBlock(custom?: { date?: string; area?: string; title?: string }) {
    const pending: PendingPlannerBlock = {
      title: safeString(custom?.title ?? title),
      learningArea: safeString(custom?.area ?? learningArea) || "Literacy",
      plannedFor: safeString(custom?.date ?? toolbarDate) || selectedIso,
      plannedTime: safeString(plannedTime),
      note: safeString(toolbarNote),
      studentId: activeLearnerId || "",
    };

    if (!pending.title) {
      setMessage("Add a simple learning moment first.");
      return;
    }

    if (hasSupabaseEnv) {
      const authResp = await supabase.auth.getUser();
      const nextUserId = authResp.data.user?.id || null;

      if (!nextUserId) {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(PENDING_BLOCK_KEY, JSON.stringify(pending));
        }
        setAuthModalOpen(true);
        setMessage("Save your progress to keep this plan.");
        return;
      }

      await executeAddBlock(pending, nextUserId);
      return;
    }

    await executeAddBlock(pending, userId);
  }

  async function handleSaveDayNote() {
    const note = safeString(noteText);
    const noteDate = selectedIso;

    setSavingNote(true);
    setMessage("");

    const payload: PlannerDayNote = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `note-${Date.now()}`,
      user_id: userId,
      student_id: activeLearnerId || null,
      note_date: noteDate,
      note,
    };

    try {
      const existingKey = buildNoteKey(userId, activeLearnerId || null, noteDate);
      const existing = dayNotesMap[existingKey];

      if (existing?.id) {
        const res = await supabase
          .from("planner_day_notes")
          .update({
            note,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select("*")
          .single();

        if (!res.error && res.data) {
          const next = { ...dayNotesMap };
          next[existingKey] = res.data as PlannerDayNote;
          setDayNotesMap(next);
          setStorageMode("database");
          setMessage("Day note saved.");
          setSavingNote(false);
          return;
        }
      } else {
        const res = await supabase.from("planner_day_notes").insert(payload).select("*").single();

        if (!res.error && res.data) {
          const key = buildNoteKey(userId, activeLearnerId || null, noteDate);
          const next = { ...dayNotesMap, [key]: res.data as PlannerDayNote };
          setDayNotesMap(next);
          setStorageMode("database");
          setMessage("Day note saved.");
          setSavingNote(false);
          return;
        }
      }
    } catch {}

    const key = buildNoteKey(userId, activeLearnerId || null, noteDate);
    const existing = getLocalNotes();
    existing[key] = payload;
    setLocalNotes(existing);
    setDayNotesMap(existing);
    setStorageMode("local");
    setMessage("Day note saved locally.");
    setSavingNote(false);
  }

  async function markDone(block: PlannerBlock) {
    const nextStatus: BlockStatus = block.status === "done" ? "planned" : "done";

    try {
      const res = await supabase
        .from("planner_blocks")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", block.id)
        .select("*")
        .single();

      if (!res.error && res.data) {
        setBlocks((prev) =>
          prev.map((b) => (b.id === block.id ? ((res.data as PlannerBlock) || b) : b))
        );
        setStorageMode("database");
        return;
      }
    } catch {}

    const next = blocks.map((b) => (b.id === block.id ? { ...b, status: nextStatus } : b));
    setBlocks(next);
    setLocalBlocks(next);
    setStorageMode("local");
  }

  function openDay(date: Date) {
    setSelectedDate(date);
    setView("day");
  }

  function goToCapture(block?: PlannerBlock, date?: Date, area?: string) {
    const params = new URLSearchParams();

    const plannedDate = block?.planned_for || (date ? isoDate(date) : selectedIso);
    const plannedArea = block?.learning_area || safeString(area) || learningArea;
    const plannedTitle = block?.title || title;

    if (plannedDate) params.set("date", plannedDate);
    if (plannedArea) params.set("learning_area", plannedArea);
    if (plannedTitle) params.set("title", plannedTitle);
    if (block?.id) params.set("planner_block_id", block.id);

    router.push(`/capture?${params.toString()}`);
  }

  async function handleLearnerChange(nextId: string) {
    setActiveLearnerId(nextId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_LEARNER_KEY, nextId);
    }
    await loadCalendarData(userId, nextId);
  }

  function blocksFor(date: Date) {
    return blocksByDate[isoDate(date)] || [];
  }

  const heading =
    view === "day"
      ? formatLongDate(selectedDate)
      : view === "week"
      ? formatWeekLabel(selectedDate)
      : formatMonthYear(selectedDate);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <section
          style={{
            ...styles.hero,
            flexDirection: isMobile ? "column" : "row",
            padding: isMobile ? 18 : styles.hero.padding,
          }}
        >
          <div>
            <div style={styles.kicker}>FAMILY CALENDAR</div>
            <h1 style={styles.h1}>Plan visually for your learner</h1>
            <p style={styles.sub}>
              {isMobile
                ? "Add one simple learning block, then keep the week moving gently."
                : "Keep your rhythm visible across the day, week, and month. This calendar is designed to support learning gently, not pressure it."}
            </p>

            <div style={styles.heroChips}>
              <div style={styles.heroChip}>Current view {view.toUpperCase()}</div>
              <div style={styles.heroChip}>
                This week’s focus&nbsp;
                <strong>
                  Use the calendar to place gentle learning blocks across the week without turning
                  home into school.
                </strong>
              </div>
            </div>
          </div>

          <div
            style={{
              ...styles.heroActions,
              width: isMobile ? "100%" : undefined,
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <button
              style={{ ...styles.primaryBtn, width: isMobile ? "100%" : undefined }}
              onClick={() =>
                handleAddBlock({
                  date: toolbarDate,
                  area: learningArea,
                  title: title || "Learning block",
                })
              }
            >
              Add block
            </button>
            <button style={{ ...styles.secondaryBtn, width: isMobile ? "100%" : undefined }} onClick={() => goToCapture()}>
              Capture
            </button>
            {!isMobile ? (
              <Link href="/planner" style={{ ...styles.secondaryBtn, justifyContent: "center" }}>
                Back to Planner
              </Link>
            ) : null}
          </div>
        </section>

        <section style={{ ...styles.toolbarCard, padding: isMobile ? 14 : 16 }}>
          <div
            style={{
              ...styles.topRow,
              alignItems: isMobile ? "stretch" : "center",
            }}
          >
            <div
              style={{
                ...styles.navLeft,
                width: isMobile ? "100%" : undefined,
              }}
            >
              <button style={styles.smallBtn} onClick={goToday}>
                Today
              </button>
              <button style={styles.iconBtn} onClick={() => shiftPeriod(-1)}>
                ←
              </button>
              <button style={styles.iconBtn} onClick={() => shiftPeriod(1)}>
                →
              </button>
              <div style={styles.heading}>{heading}</div>
            </div>

            <div
              style={{
                ...styles.navRight,
                width: isMobile ? "100%" : undefined,
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center",
              }}
            >
              <select
                value={activeLearnerId}
                onChange={(e) => handleLearnerChange(e.target.value)}
                style={{ ...styles.select, width: isMobile ? "100%" : undefined }}
              >
                <option value="">Your learner</option>
                {learners.map((learner) => (
                  <option key={learner.id} value={learner.id}>
                    {learner.label}
                  </option>
                ))}
              </select>

              <div style={{ ...styles.viewToggle, width: isMobile ? "100%" : undefined }}>
                <button
                  style={{
                    ...styles.toggleBtn,
                    ...(view === "day" ? styles.toggleBtnActive : {}),
                    flex: isMobile ? 1 : undefined,
                  }}
                  onClick={() => setView("day")}
                >
                  DAY
                </button>
                <button
                  style={{
                    ...styles.toggleBtn,
                    ...(view === "week" ? styles.toggleBtnActive : {}),
                    flex: isMobile ? 1 : undefined,
                  }}
                  onClick={() => setView("week")}
                >
                  WEEK
                </button>
                <button
                  style={{
                    ...styles.toggleBtn,
                    ...(view === "month" ? styles.toggleBtnActive : {}),
                    flex: isMobile ? 1 : undefined,
                  }}
                  onClick={() => setView("month")}
                >
                  MONTH
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              ...styles.inputRow,
              gridTemplateColumns: isMobile ? "1fr" : styles.inputRow.gridTemplateColumns,
            }}
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a simple learning moment..."
              style={styles.textInput}
            />

            <select
              value={learningArea}
              onChange={(e) => setLearningArea(e.target.value)}
              style={styles.select}
            >
              {LEARNING_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>

            <input
              value={plannedTime}
              onChange={(e) => setPlannedTime(e.target.value)}
              placeholder="Optional time"
              style={styles.timeInput}
            />

            <input
              type="date"
              value={toolbarDate}
              onChange={(e) => {
                setToolbarDate(e.target.value);
                setSelectedDate(parseDate(e.target.value));
              }}
              style={styles.dateInput}
            />

            <button
              style={{ ...styles.addBtn, width: isMobile ? "100%" : undefined }}
              onClick={() => handleAddBlock()}
              disabled={savingBlock}
            >
              {savingBlock ? "..." : "Add"}
            </button>
          </div>

          <textarea
            value={toolbarNote}
            onChange={(e) => setToolbarNote(e.target.value)}
            placeholder="Optional notes for this learning block..."
            style={styles.noteInput}
          />

          {message ? <div style={styles.message}>{message}</div> : null}
          <div style={styles.storageHint}>Storage mode: {storageMode}</div>
        </section>

        <section style={styles.intelligenceCard}>
          <div style={styles.intelligenceTop}>
            <div>
              <div style={styles.intelligenceEyebrow}>Weekly guidance</div>
              <div style={styles.intelligenceTitle}>{weeklySummaryText}</div>
              <div style={styles.intelligenceText}>{weeklyCoverageText}</div>
            </div>

            <div style={styles.intelligencePills}>
              <span style={styles.intelligencePill}>
                {weeklyBlocks.length === 0
                  ? "No blocks planned yet"
                  : `${weeklyBlocks.length} planned ${weeklyBlocks.length === 1 ? "block" : "blocks"}`}
              </span>
              <span style={styles.intelligencePill}>{strongestAreaText}</span>
            </div>
          </div>

          <div
            style={{
              ...styles.intelligenceGrid,
              gridTemplateColumns: isMobile ? "1fr" : styles.intelligenceGrid.gridTemplateColumns,
            }}
          >
            <div style={styles.intelligencePanel}>
              <div style={styles.intelligencePanelTitle}>Covered this week</div>
              <div style={styles.chipRow}>
                {coveredAreas.length ? (
                  coveredAreas.map((area) => (
                    <span key={area} style={styles.coveredChip}>
                      {area}
                    </span>
                  ))
                ) : (
                  <span style={styles.helperText}>Nothing is planned yet.</span>
                )}
              </div>
            </div>

            <div style={styles.intelligencePanel}>
              <div style={styles.intelligencePanelTitle}>Suggested next block</div>
              <div style={styles.intelligenceText}>{suggestedNextCopy}</div>
              <div style={{ ...styles.cardActions, flexDirection: isMobile ? "column" : "row" }}>
                <button
                  style={{ ...styles.darkSmBtn, width: isMobile ? "100%" : undefined }}
                  onClick={() =>
                    handleAddBlock({
                      date: suggestedDateIso,
                      area: suggestedNextArea,
                      title: titleForSuggestedArea(suggestedNextArea),
                    })
                  }
                >
                  Add suggested block
                </button>
              </div>
            </div>
          </div>

          {weeklyBlocks.length === 0 ? (
            <div style={styles.emptyWeekCard}>
              <div style={styles.intelligencePanelTitle}>Start with one small learning moment</div>
              <div style={styles.intelligenceText}>
                A simple Literacy or Numeracy block is enough to begin. You can round out the week once the first piece is in place.
              </div>
              <div style={{ ...styles.cardActions, flexDirection: isMobile ? "column" : "row" }}>
                <button
                  style={{ ...styles.outlineSmBtn, width: isMobile ? "100%" : undefined }}
                  onClick={() =>
                    handleAddBlock({
                      date: suggestedDateIso,
                      area: "Literacy",
                      title: titleForSuggestedArea("Literacy"),
                    })
                  }
                >
                  Add Literacy block
                </button>
                <button
                  style={{ ...styles.outlineSmBtn, width: isMobile ? "100%" : undefined }}
                  onClick={() =>
                    handleAddBlock({
                      date: suggestedDateIso,
                      area: "Numeracy",
                      title: titleForSuggestedArea("Numeracy"),
                    })
                  }
                >
                  Add Numeracy block
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {!loading && view === "week" ? (
          <section style={styles.weekSignals}>
            <div style={styles.weekSignalsTitle}>Missing area signals</div>
            <div style={styles.chipRow}>
              {missingAreas.length ? (
                missingAreas.map((area) => (
                  <span key={area} style={styles.missingChip}>
                    {area}
                  </span>
                ))
              ) : (
                <span style={styles.helperText}>
                  This week is already carrying a healthy spread.
                </span>
              )}
            </div>
          </section>
        ) : null}

        {loading ? (
          <section style={styles.loadingCard}>Loading calendar…</section>
        ) : view === "week" ? (
          <section
            style={{
              ...styles.weekGrid,
              gridTemplateColumns: isMobile ? "1fr" : styles.weekGrid.gridTemplateColumns,
            }}
          >
            {visibleDates.map((date) => {
              const dayBlocks = blocksFor(date);
              const isToday = sameDay(date, new Date());

              return (
                <div key={isoDate(date)} style={styles.weekCol}>
                  <div style={styles.weekHeader}>
                    <div style={styles.weekDayTitle}>
                      {date.toLocaleDateString(undefined, { weekday: "short" })} {date.getDate()}
                    </div>
                    {isToday ? <div style={styles.todayPill}>Today</div> : null}
                  </div>

                  <div style={styles.openState}>Open</div>

                  <textarea
                    style={styles.dayScratch}
                    placeholder="A gentle note for today..."
                    value={
                      dayNotesMap[buildNoteKey(userId, activeLearnerId || null, isoDate(date))]
                        ?.note || ""
                    }
                    onChange={(e) => {
                      const key = buildNoteKey(userId, activeLearnerId || null, isoDate(date));
                      setDayNotesMap((prev) => ({
                        ...prev,
                        [key]: {
                          id: prev[key]?.id || `scratch-${Date.now()}`,
                          user_id: userId,
                          student_id: activeLearnerId || null,
                          note_date: isoDate(date),
                          note: e.target.value,
                        },
                      }));
                    }}
                    onBlur={async () => {
                      if (sameDay(date, selectedDate)) return;
                      const key = buildNoteKey(userId, activeLearnerId || null, isoDate(date));
                      const val = dayNotesMap[key]?.note || "";
                      if (!val) return;

                      try {
                        const existing = dayNotesMap[key];
                        if (existing?.id && !existing.id.startsWith("scratch-")) {
                          await supabase
                            .from("planner_day_notes")
                            .update({ note: val, updated_at: new Date().toISOString() })
                            .eq("id", existing.id);
                        } else {
                          const res = await supabase
                            .from("planner_day_notes")
                            .insert({
                              user_id: userId,
                              student_id: activeLearnerId || null,
                              note_date: isoDate(date),
                              note: val,
                            })
                            .select("*")
                            .single();

                          if (!res.error && res.data) {
                            setDayNotesMap((prev) => ({
                              ...prev,
                              [key]: res.data as PlannerDayNote,
                            }));
                          }
                        }
                      } catch {
                        const local = getLocalNotes();
                        local[key] = {
                          id: dayNotesMap[key]?.id || `local-note-${Date.now()}`,
                          user_id: userId,
                          student_id: activeLearnerId || null,
                          note_date: isoDate(date),
                          note: val,
                        };
                        setLocalNotes(local);
                      }
                    }}
                  />

                  {dayBlocks.length === 0 ? (
                    <div style={styles.emptyCard}>
                      <div style={styles.emptyTitle}>Start with one small learning moment</div>
                      <div style={styles.emptyText}>
                        Keep it light. Add one block, capture one moment, or place one focus for
                        the day.
                      </div>

                      <div style={{ ...styles.cardActions, flexDirection: isMobile ? "column" : "row" }}>
                        <button
                          style={{ ...styles.outlineSmBtn, width: isMobile ? "100%" : undefined }}
                          onClick={() =>
                            handleAddBlock({
                              date: isoDate(date),
                              title: `Learning focus for ${formatShortDay(date)}`,
                              area: "Literacy",
                            })
                          }
                        >
                          + Add block
                        </button>
                        <button
                          style={{ ...styles.outlineSmBtn, width: isMobile ? "100%" : undefined }}
                          onClick={() => openDay(date)}
                        >
                          Open day
                        </button>
                        <button
                          style={{ ...styles.darkSmBtn, width: isMobile ? "100%" : undefined }}
                          onClick={() => goToCapture(undefined, date)}
                        >
                          Capture
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={styles.dayBlockList}>
                      {dayBlocks.map((block) => (
                        <div
                          key={block.id}
                          style={{
                            ...styles.blockCard,
                            ...(block.status === "done" ? styles.blockCardDone : {}),
                          }}
                        >
                          <div style={styles.blockTop}>
                            <div>
                              <div style={styles.blockArea}>{block.learning_area}</div>
                              <div style={styles.blockTitle}>{block.title}</div>
                            </div>
                            <button style={styles.markDoneBtn} onClick={() => markDone(block)}>
                              {block.status === "done" ? "Planned" : "Done"}
                            </button>
                          </div>

                          {block.planned_time ? (
                            <div style={styles.blockMeta}>Time: {block.planned_time}</div>
                          ) : null}
                          {block.note ? <div style={styles.blockMeta}>{block.note}</div> : null}

                          <div style={{ ...styles.cardActions, flexDirection: isMobile ? "column" : "row" }}>
                            <button
                              style={{ ...styles.outlineSmBtn, width: isMobile ? "100%" : undefined }}
                              onClick={() => openDay(date)}
                            >
                              Open day
                            </button>
                            <button
                              style={{ ...styles.darkSmBtn, width: isMobile ? "100%" : undefined }}
                              onClick={() => goToCapture(block)}
                            >
                              Capture
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={styles.quickAddLabel}>QUICK ADD</div>
                  <div style={styles.quickAddStack}>
                    {["Literacy", "Numeracy", "Bible", "Inquiry", "Creative"].map((area) => (
                      <button
                        key={area}
                        style={styles.quickChip}
                        onClick={() =>
                          handleAddBlock({
                            date: isoDate(date),
                            area,
                            title: `${area} learning block`,
                          })
                        }
                      >
                        {area === "Inquiry" || area === "Creative" ? `+ ${area}` : area}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        ) : view === "day" ? (
          <section
            style={{
              ...styles.dayLayout,
              gridTemplateColumns: isMobile ? "1fr" : styles.dayLayout.gridTemplateColumns,
            }}
          >
            <div style={styles.dayMain}>
              <div style={styles.dayCard}>
                <div style={styles.kicker}>DAY VIEW</div>
                <h2 style={styles.dayTitle}>{formatLongDate(selectedDate)}</h2>
                <p style={styles.dayText}>
                  Use today’s blocks to shape a gentle flow of learning. Keep structure visible, but
                  leave room for flexibility.
                </p>
              </div>

              <div style={styles.dayContentCard}>
                {blocksFor(selectedDate).length === 0 ? (
                  <div style={styles.dayEmpty}>
                    <div style={styles.dayEmptyTitle}>Nothing planned yet for today</div>
                    <div style={styles.dayEmptyText}>
                      Add one or two meaningful learning blocks to get started.
                    </div>
                  </div>
                ) : (
                  <div style={styles.dayBlockList}>
                    {blocksFor(selectedDate).map((block) => (
                      <div
                        key={block.id}
                        style={{
                          ...styles.blockCardWide,
                          ...(block.status === "done" ? styles.blockCardDone : {}),
                        }}
                      >
                        <div style={styles.blockTop}>
                          <div>
                            <div style={styles.blockArea}>{block.learning_area}</div>
                            <div style={styles.blockTitle}>{block.title}</div>
                          </div>
                          <button style={styles.markDoneBtn} onClick={() => markDone(block)}>
                            {block.status === "done" ? "Planned" : "Done"}
                          </button>
                        </div>

                        <div style={styles.dayBlockMetaRow}>
                          <div style={styles.blockMeta}>Date: {block.planned_for}</div>
                          {block.planned_time ? (
                            <div style={styles.blockMeta}>Time: {block.planned_time}</div>
                          ) : null}
                        </div>

                        {block.note ? <div style={styles.blockNoteWide}>{block.note}</div> : null}

                        <div style={{ ...styles.cardActions, flexDirection: isMobile ? "column" : "row" }}>
                          <button
                            style={{ ...styles.outlineSmBtn, width: isMobile ? "100%" : undefined }}
                            onClick={() => goToCapture(block)}
                          >
                            Capture from this block
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.daySide}>
              <div style={styles.sideCard}>
                <div style={styles.sideTitle}>Notes for today</div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type a note..."
                  style={styles.notesArea}
                />
                <button
                  style={{ ...styles.darkSmBtn, width: isMobile ? "100%" : undefined }}
                  onClick={handleSaveDayNote}
                  disabled={savingNote}
                >
                  {savingNote ? "Saving..." : "Save note"}
                </button>
              </div>

              <div style={styles.sideCard}>
                <div style={styles.sideTitle}>Mini calendar</div>
                <MiniMonth
                  selectedDate={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setToolbarDate(isoDate(date));
                  }}
                />
              </div>
            </div>
          </section>
        ) : (
          <section>
            <div
              style={{
                ...styles.monthWeekdays,
                gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : styles.monthWeekdays.gridTemplateColumns,
              }}
            >
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
                <div key={w} style={styles.monthWeekday}>
                  {w}
                </div>
              ))}
            </div>

            <div
              style={{
                ...styles.monthGrid,
                gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : styles.monthGrid.gridTemplateColumns,
              }}
            >
              {visibleDates.map((date) => {
                const currentMonth = date.getMonth() === selectedDate.getMonth();
                const selected = sameDay(date, selectedDate);
                const count = blocksFor(date).length;

                return (
                  <button
                    key={isoDate(date)}
                    style={{
                      ...styles.monthCell,
                      ...(selected ? styles.monthCellSelected : {}),
                      ...(currentMonth ? {} : styles.monthCellMuted),
                    }}
                    onClick={() => {
                      setSelectedDate(date);
                      setView("day");
                    }}
                  >
                    <div style={styles.monthCellTop}>
                      <span>{date.getDate()}</span>
                      {sameDay(date, new Date()) ? (
                        <span style={styles.todayTiny}>Today</span>
                      ) : null}
                    </div>

                    {count > 0 ? (
                      <div style={styles.monthCount}>
                        {count} planned {count === 1 ? "block" : "blocks"}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section
          style={{
            ...styles.footerStrip,
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
          }}
        >
          <div>
            <div style={styles.footerTitle}>Continue your flow</div>
            <div style={styles.footerText}>
              Move between planning, capture, portfolio, and reporting without losing the thread.
            </div>
          </div>

          <div style={styles.footerLinks}>
            <Link href="/planner" style={styles.footerChip}>
              Planner
            </Link>
            <Link href="/calendar" style={{ ...styles.footerChip, ...styles.footerChipActive }}>
              Calendar
            </Link>
            <Link href="/capture" style={styles.footerChip}>
              Capture
            </Link>
            <Link href="/portfolio" style={styles.footerChip}>
              Portfolio
            </Link>
            <Link href="/reports" style={styles.footerChip}>
              Reports
            </Link>
          </div>
        </section>

        <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          returnPath={authReturnPath}
        />
      </div>
    </div>
  );
}

function MiniMonth({
  selectedDate,
  onSelect,
}: {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}) {
  const dates = rangeDates(startOfMonthGrid(selectedDate), endOfMonthGrid(selectedDate));

  return (
    <div>
      <div style={styles.miniMonthLabel}>{formatMonthYear(selectedDate)}</div>
      <div style={styles.miniWeekdays}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d) => (
          <div key={d} style={styles.miniWeekday}>
            {d}
          </div>
        ))}
      </div>
      <div style={styles.miniGrid}>
        {dates.map((date) => {
          const selected = sameDay(date, selectedDate);
          const currentMonth = date.getMonth() === selectedDate.getMonth();

          return (
            <button
              key={isoDate(date)}
              style={{
                ...styles.miniCell,
                ...(selected ? styles.miniCellSelected : {}),
                ...(currentMonth ? {} : styles.miniCellMuted),
              }}
              onClick={() => onSelect(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    background: "#f5f7fb",
    minHeight: "100vh",
    padding: "32px 20px 60px",
  },
  container: {
    maxWidth: 1380,
    margin: "0 auto",
    display: "grid",
    gap: 16,
  },
  hero: {
    background: "#ffffff",
    border: "1px solid #e6e9f0",
    borderRadius: 24,
    padding: 24,
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "flex-start",
  },
  kicker: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: "#6b7280",
    marginBottom: 8,
  },
  h1: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1.05,
    color: "#0f172a",
  },
  sub: {
    marginTop: 10,
    marginBottom: 0,
    fontSize: 15,
    lineHeight: 1.7,
    color: "#556070",
    maxWidth: 760,
  },
  heroChips: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 16,
  },
  heroChip: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid #dce3ef",
    background: "#f8fafc",
    color: "#475569",
    fontSize: 12,
    fontWeight: 700,
  },
  heroActions: {
    display: "flex",
    gap: 10,
    flexShrink: 0,
  },
  primaryBtn: {
    minHeight: 42,
    padding: "0 16px",
    borderRadius: 12,
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryBtn: {
    minHeight: 42,
    padding: "0 16px",
    borderRadius: 12,
    border: "1px solid #d8deea",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
  },
  toolbarCard: {
    background: "#ffffff",
    border: "1px solid #e6e9f0",
    borderRadius: 20,
    padding: 16,
  },
  intelligenceCard: {
    background: "#ffffff",
    border: "1px solid #e6e9f0",
    borderRadius: 20,
    padding: 18,
    display: "grid",
    gap: 14,
  },
  intelligenceTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  intelligenceEyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 6,
  },
  intelligenceTitle: {
    fontSize: 22,
    lineHeight: 1.2,
    fontWeight: 800,
    color: "#0f172a",
  },
  intelligenceText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 1.65,
    color: "#556070",
    maxWidth: 760,
  },
  intelligencePills: {
    display: "grid",
    gap: 8,
    alignItems: "start",
  },
  intelligencePill: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 32,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid #dce3ef",
    background: "#f8fafc",
    color: "#475569",
    fontSize: 12,
    fontWeight: 700,
  },
  intelligenceGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    gap: 14,
  },
  intelligencePanel: {
    border: "1px solid #eef2f7",
    borderRadius: 16,
    background: "#fbfdff",
    padding: 14,
  },
  intelligencePanelTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
  },
  chipRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 10,
  },
  coveredChip: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 30,
    padding: "0 10px",
    borderRadius: 999,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: 800,
  },
  missingChip: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 30,
    padding: "0 10px",
    borderRadius: 999,
    border: "1px solid #fde68a",
    background: "#fffbeb",
    color: "#92400e",
    fontSize: 12,
    fontWeight: 800,
  },
  helperText: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.55,
    fontWeight: 700,
  },
  emptyWeekCard: {
    border: "1px solid #dbeafe",
    borderRadius: 16,
    background: "linear-gradient(135deg, #f8fbff 0%, #ffffff 100%)",
    padding: 14,
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  navLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  smallBtn: {
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid #d8deea",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 700,
    cursor: "pointer",
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "1px solid #d8deea",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 800,
    cursor: "pointer",
  },
  heading: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
    marginLeft: 4,
  },
  viewToggle: {
    display: "inline-flex",
    border: "1px solid #d8deea",
    borderRadius: 12,
    overflow: "hidden",
  },
  toggleBtn: {
    minHeight: 36,
    padding: "0 12px",
    border: "none",
    background: "#ffffff",
    color: "#475569",
    fontWeight: 800,
    fontSize: 12,
    cursor: "pointer",
  },
  toggleBtnActive: {
    background: "#0f172a",
    color: "#ffffff",
  },
  inputRow: {
    display: "grid",
    gridTemplateColumns: "1.6fr 180px 140px 140px 80px",
    gap: 10,
    marginTop: 14,
  },
  textInput: {
    minHeight: 46,
    borderRadius: 12,
    border: "1px solid #d8deea",
    background: "#ffffff",
    padding: "0 14px",
    fontSize: 14,
    color: "#111827",
    outline: "none",
  },
  select: {
    minHeight: 46,
    borderRadius: 12,
    border: "1px solid #d8deea",
    background: "#ffffff",
    padding: "0 12px",
    fontSize: 14,
    color: "#111827",
    outline: "none",
  },
  timeInput: {
    minHeight: 46,
    borderRadius: 12,
    border: "1px solid #d8deea",
    background: "#ffffff",
    padding: "0 12px",
    fontSize: 14,
    color: "#111827",
    outline: "none",
  },
  dateInput: {
    minHeight: 46,
    borderRadius: 12,
    border: "1px solid #d8deea",
    background: "#ffffff",
    padding: "0 12px",
    fontSize: 14,
    color: "#111827",
    outline: "none",
  },
  addBtn: {
    minHeight: 46,
    borderRadius: 12,
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },
  noteInput: {
    width: "100%",
    minHeight: 62,
    marginTop: 10,
    borderRadius: 12,
    border: "1px solid #d8deea",
    background: "#ffffff",
    padding: 12,
    fontSize: 14,
    color: "#111827",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
  },
  message: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: 700,
    color: "#1d4ed8",
  },
  storageHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
  },
  loadingCard: {
    background: "#ffffff",
    border: "1px solid #e6e9f0",
    borderRadius: 18,
    padding: 32,
    fontSize: 15,
    color: "#475569",
  },
  weekSignals: {
    background: "#ffffff",
    border: "1px solid #e6e9f0",
    borderRadius: 18,
    padding: 14,
  },
  weekSignalsTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#475569",
  },
  weekGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 10,
  },
  weekCol: {
    background: "#ffffff",
    border: "1px solid #e6e9f0",
    borderRadius: 18,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 470,
  },
  weekHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  weekDayTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
  },
  todayPill: {
    minHeight: 24,
    padding: "0 8px",
    borderRadius: 999,
    background: "#dbeafe",
    color: "#2563eb",
    fontSize: 11,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
  },
  openState: {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
  },
  dayScratch: {
    width: "100%",
    minHeight: 68,
    borderRadius: 14,
    border: "1px solid #e5d58f",
    background: "#fef8d6",
    padding: 10,
    fontSize: 13,
    color: "#665c1d",
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
  },
  emptyCard: {
    border: "1px dashed #d8deea",
    borderRadius: 16,
    padding: 14,
    background: "#fbfcfe",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "#64748b",
    marginBottom: 12,
  },
  cardActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  outlineSmBtn: {
    minHeight: 34,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid #d8deea",
    background: "#ffffff",
    color: "#111827",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  darkSmBtn: {
    minHeight: 34,
    padding: "0 10px",
    borderRadius: 10,
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  dayBlockList: {
    display: "grid",
    gap: 10,
  },
  blockCard: {
    border: "1px solid #d8deea",
    borderRadius: 14,
    padding: 12,
    background: "#ffffff",
  },
  blockCardWide: {
    border: "1px solid #d8deea",
    borderRadius: 16,
    padding: 16,
    background: "#ffffff",
  },
  blockCardDone: {
    background: "#f8fafc",
    opacity: 0.82,
  },
  blockTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  blockArea: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "#64748b",
    marginBottom: 4,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.35,
  },
  markDoneBtn: {
    minHeight: 30,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid #d8deea",
    background: "#ffffff",
    color: "#111827",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    flexShrink: 0,
  },
  blockMeta: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.6,
    marginTop: 8,
  },
  quickAddLabel: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "#6b7280",
    marginTop: 4,
  },
  quickAddStack: {
    display: "grid",
    gap: 8,
  },
  quickChip: {
    minHeight: 34,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid #d8deea",
    background: "#ffffff",
    color: "#111827",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  dayLayout: {
    display: "grid",
    gridTemplateColumns: "1.55fr 0.85fr",
    gap: 14,
    alignItems: "start",
  },
  dayMain: {
    display: "grid",
    gap: 12,
  },
  dayCard: {
    background: "#ffffff",
    border: "1px solid #e6e9f0",
    borderRadius: 20,
    padding: 18,
  },
  dayTitle: {
    margin: "4px 0 8px",
    fontSize: 22,
    fontWeight: 800,
    color: "#0f172a",
  },
  dayText: {
    margin: 0,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.7,
  },
  dayContentCard: {
    background: "#ffffff",
    border: "1px solid #e6e9f0",
    borderRadius: 20,
    padding: 18,
  },
  dayEmpty: {
    minHeight: 160,
    border: "1px dashed #d8deea",
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    padding: 20,
  },
  dayEmptyTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 8,
  },
  dayEmptyText: {
    fontSize: 14,
    color: "#64748b",
  },
  daySide: {
    display: "grid",
    gap: 12,
  },
  sideCard: {
    background: "#ffffff",
    border: "1px solid #e6e9f0",
    borderRadius: 20,
    padding: 16,
  },
  sideTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 12,
  },
  notesArea: {
    width: "100%",
    minHeight: 118,
    borderRadius: 14,
    border: "1px solid #e5d58f",
    background: "#fef8d6",
    padding: 12,
    fontSize: 14,
    color: "#665c1d",
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
    marginBottom: 10,
  },
  miniMonthLabel: {
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 10,
  },
  miniWeekdays: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4,
    marginBottom: 6,
  },
  miniWeekday: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
  },
  miniGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 4,
  },
  miniCell: {
    minHeight: 32,
    borderRadius: 10,
    border: "1px solid transparent",
    background: "#ffffff",
    color: "#111827",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  miniCellSelected: {
    background: "#eaf2ff",
    color: "#1d4ed8",
    border: "1px solid #9ab8ff",
  },
  miniCellMuted: {
    color: "#94a3b8",
  },
  monthWeekdays: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 8,
  },
  monthWeekday: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: 800,
    color: "#475569",
  },
  monthGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 10,
  },
  monthCell: {
    background: "#ffffff",
    border: "1px solid #e6e9f0",
    borderRadius: 18,
    minHeight: 118,
    padding: 12,
    textAlign: "left",
    cursor: "pointer",
  },
  monthCellSelected: {
    border: "1px solid #9ab8ff",
    boxShadow: "0 0 0 1px rgba(59,130,246,0.08) inset",
  },
  monthCellMuted: {
    opacity: 0.62,
  },
  monthCellTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
  },
  todayTiny: {
    minHeight: 22,
    padding: "0 8px",
    borderRadius: 999,
    background: "#dbeafe",
    color: "#2563eb",
    fontSize: 10,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
  },
  monthCount: {
    marginTop: 12,
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.6,
  },
  footerStrip: {
    background: "#ffffff",
    border: "1px solid #e6e9f0",
    borderRadius: 20,
    padding: 18,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    flexWrap: "wrap",
  },
  footerTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0f172a",
  },
  footerText: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748b",
  },
  footerLinks: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  footerChip: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    padding: "0 14px",
    borderRadius: 999,
    background: "#ffffff",
    border: "1px solid #d8deea",
    color: "#1f2940",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 800,
  },
  footerChipActive: {
    background: "#eef4ff",
    border: "1px solid #7aa2ff",
    color: "#1d4ed8",
  },
  dayBlockMetaRow: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    marginTop: 8,
  },
  blockNoteWide: {
    marginTop: 12,
    fontSize: 14,
    color: "#475569",
    lineHeight: 1.7,
  },
};
