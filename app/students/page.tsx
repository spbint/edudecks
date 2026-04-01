"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

/* ─────────────────────────────
   Types (minimal, safe)
───────────────────────────── */
type StudentRow = {
  id: string;
  first_name: string | null;
  preferred_name: string | null;
  is_ilp: boolean | null;
  class_id: string | null;
};

type ClassRow = {
  id: string;
  name: string | null;
  year_level: number | null;
};

type EvidenceRow = {
  id: string;
  student_id: string;
  note: string | null;
  occurred_on: string | null;
  created_at: string;
};

type InstrumentSummary = {
  code: string;
  count: number;
  latestScore: number | null;
  lastDate: string;
};

type CtxMenuState =
  | null
  | {
      x: number;
      y: number;
      student: StudentRow;
    };

type CompareCell = {
  latestScore: number | null;
  lastDate: string | null;
};

type CompareRow = {
  code: string;
  byStudent: Record<string, CompareCell>;
};

type SupportSignal = {
  key:
    | "FLAGGED"
    | "PINNED"
    | "ILP"
    | "NO_EVIDENCE"
    | "STALE_EVIDENCE"
    | "LOW_EVIDENCE"
    | "NO_SCORE_EVIDENCE";
  label: string;
  detail: string;
  severity: "high" | "med" | "low";
};

const LS_PINNED = "edu:students:pinned";
const LS_FLAGGED = "edu:students:flagged";

export default function StudentsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [showILPOnly, setShowILPOnly] = useState(false);
  const [classId, setClassId] = useState<string>("");

  // quick filters
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

  // Right-click context menu
  const [ctx, setCtx] = useState<CtxMenuState>(null);
  const ctxRef = useRef<HTMLDivElement | null>(null);

  // FM drawer
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Keyboard selection (FM-style focus row)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // MULTI-SELECT
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastAnchorIndexRef = useRef<number>(-1);

  const selectedArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // Drawer evidence
  const [evLoading, setEvLoading] = useState(false);
  const [evErr, setEvErr] = useState("");
  const [evOk, setEvOk] = useState("");
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);

  // Drawer compare
  const [compareMode, setCompareMode] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareErr, setCompareErr] = useState("");
  const [compareRows, setCompareRows] = useState<CompareRow[]>([]);
  const [compareLastRunAt, setCompareLastRunAt] = useState<string>("");

  // Quick-add evidence form (drawer)
  const [showAdd, setShowAdd] = useState(false);
  const [occurredOn, setOccurredOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [instrumentCode, setInstrumentCode] = useState("");
  const [score, setScore] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Actions flyout (drawer)
  const [actionsOpen, setActionsOpen] = useState(true);

  // Support signals flyout (drawer)
  const [signalsOpen, setSignalsOpen] = useState(true);

  // pinned/flagged (localStorage)
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  // ─────────────────────────────
  // Helpers
  // ─────────────────────────────
  const studentName = (s: StudentRow | null) => {
    if (!s) return "—";
    const pref = (s.preferred_name ?? "").trim();
    const first = (s.first_name ?? "").trim();
    return pref || first || "Unnamed student";
  };

  const classById = useMemo(() => {
    const m = new Map<string, ClassRow>();
    for (const c of classes) m.set(c.id, c);
    return m;
  }, [classes]);

  const classLabel = (id: string | null) => {
    if (!id) return "—";
    const c = classById.get(id);
    if (!c) return "—";
    const nm = c.name ?? "Class";
    const yl = c.year_level != null ? `Year ${c.year_level}` : "";
    return yl ? `${nm} • ${yl}` : nm;
  };

  const safeLoadSet = (key: string) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return new Set<string>();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set<string>();
      return new Set<string>(parsed.filter((x) => typeof x === "string"));
    } catch {
      return new Set<string>();
    }
  };

  const safeSaveSet = (key: string, set: Set<string>) => {
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
    } catch {
      // ignore
    }
  };

  const togglePinned = (id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      safeSaveSet(LS_PINNED, next);
      return next;
    });
  };

  const toggleFlagged = (id: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      safeSaveSet(LS_FLAGGED, next);
      return next;
    });
  };

  const clearPinned = () => {
    const next = new Set<string>();
    setPinnedIds(next);
    safeSaveSet(LS_PINNED, next);
  };

  const clearFlagged = () => {
    const next = new Set<string>();
    setFlaggedIds(next);
    safeSaveSet(LS_FLAGGED, next);
  };

  const openFullProfile = (id: string) => router.push(`/students/${id}`);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const copyIds = async (ids: string[]) => {
    if (ids.length === 0) return;
    await copyText(ids.join("\n"));
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelected(null);
    setEvidence([]);
    setEvErr("");
    setEvOk("");
    setShowAdd(false);
    setInstrumentCode("");
    setScore("");
    setNote("");
    setSaving(false);

    setCompareMode(false);
    setCompareLoading(false);
    setCompareErr("");
    setCompareRows([]);
    setCompareLastRunAt("");

    setActionsOpen(true);
    setSignalsOpen(true);
  };

  const scrollRowIntoView = (studentId: string) => {
    const el = rowRefs.current[studentId];
    if (!el) return;
    try {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } catch {
      el.scrollIntoView();
    }
  };

  // Parse evidence note like: "... (NAP-NUM) — Score: 237 ..."
  const extract = (text: string) => {
    const code = text.match(/\(([\w-]+)\)/)?.[1] ?? "UNKNOWN";
    const sc = text.match(/score:\s*([\d.]+)/i)?.[1];
    return { code, score: sc ? Number(sc) : null };
  };

  const daysBetween = (aISO: string, bISO: string) => {
    const a = new Date(aISO);
    const b = new Date(bISO);
    const ms = Math.abs(b.getTime() - a.getTime());
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  };

  const evidenceDateISO = (e: EvidenceRow) => (e.occurred_on ?? e.created_at).slice(0, 10);

  // Instrument summary (latest score + count + last date)
  const summary = useMemo<InstrumentSummary[]>(() => {
    const map = new Map<string, InstrumentSummary>();

    for (const e of evidence) {
      const { code, score } = extract(e.note ?? "");
      const date = evidenceDateISO(e);

      if (!map.has(code)) {
        map.set(code, { code, count: 0, latestScore: null, lastDate: date });
      }

      const row = map.get(code)!;
      row.count += 1;

      // Evidence ordered newest -> oldest, so first non-null score is "latest"
      if (row.latestScore === null && score !== null) row.latestScore = score;

      row.lastDate = row.lastDate || date;
    }

    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [evidence]);

  const signals = useMemo<SupportSignal[]>(() => {
    const s = selected;
    if (!s) return [];

    const out: SupportSignal[] = [];

    if (s.id && flaggedIds.has(s.id)) {
      out.push({
        key: "FLAGGED",
        label: "Flagged",
        detail: "Marked for follow-up (local flag).",
        severity: "high",
      });
    }

    if (s.id && pinnedIds.has(s.id)) {
      out.push({
        key: "PINNED",
        label: "Pinned",
        detail: "Pinned to top of lists (local pin).",
        severity: "low",
      });
    }

    if (s.is_ilp) {
      out.push({
        key: "ILP",
        label: "ILP",
        detail: "Student is marked as ILP in the database.",
        severity: "med",
      });
    }

    if (evidence.length === 0) {
      out.push({
        key: "NO_EVIDENCE",
        label: "No evidence yet",
        detail: "No evidence entries exist for this student.",
        severity: "high",
      });
      return out;
    }

    const latest = evidence[0];
    const latestISO = evidenceDateISO(latest);
    const todayISO = new Date().toISOString().slice(0, 10);
    const days = daysBetween(latestISO, todayISO);

    if (days >= 30) {
      out.push({
        key: "STALE_EVIDENCE",
        label: "No recent evidence",
        detail: `Last evidence is ${days} days ago (${latestISO}).`,
        severity: "high",
      });
    } else if (days >= 14) {
      out.push({
        key: "STALE_EVIDENCE",
        label: "Evidence is getting old",
        detail: `Last evidence is ${days} days ago (${latestISO}).`,
        severity: "med",
      });
    } else {
      out.push({
        key: "STALE_EVIDENCE",
        label: "Recent evidence OK",
        detail: `Last evidence is ${days} day(s) ago (${latestISO}).`,
        severity: "low",
      });
    }

    if (evidence.length <= 2) {
      out.push({
        key: "LOW_EVIDENCE",
        label: "Low evidence volume",
        detail: `Only ${evidence.length} evidence entry(ies) recorded.`,
        severity: evidence.length === 1 ? "high" : "med",
      });
    }

    // “Scoreless” evidence check (are we recording CODE-only notes but not Score?)
    const anyScore = evidence.some((ev) => {
      const { score } = extract(ev.note ?? "");
      return score !== null && Number.isFinite(score);
    });

    if (!anyScore) {
      out.push({
        key: "NO_SCORE_EVIDENCE",
        label: "No scored evidence found",
        detail: "Evidence notes don’t include “Score: …” yet (still OK early on).",
        severity: "med",
      });
    }

    return out;
  }, [selected, evidence, flaggedIds, pinnedIds]);

  const signalsBySeverity = useMemo(() => {
    const order = (sev: SupportSignal["severity"]) => (sev === "high" ? 0 : sev === "med" ? 1 : 2);
    return [...signals].sort((a, b) => order(a.severity) - order(b.severity));
  }, [signals]);

  // ─────────────────────────────
  // Filtered list
  // ─────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return students
      .filter((s) => (!showILPOnly ? true : !!s.is_ilp))
      .filter((s) => (!classId ? true : s.class_id === classId))
      .filter((s) => (!showPinnedOnly ? true : pinnedIds.has(s.id)))
      .filter((s) => (!showFlaggedOnly ? true : flaggedIds.has(s.id)))
      .filter((s) => {
        if (!q) return true;
        const name = studentName(s).toLowerCase();
        return (
          name.includes(q) ||
          (s.first_name ?? "").toLowerCase().includes(q) ||
          (s.preferred_name ?? "").toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // pinned to top, then alphabetical
        const ap = pinnedIds.has(a.id) ? 1 : 0;
        const bp = pinnedIds.has(b.id) ? 1 : 0;
        if (ap !== bp) return bp - ap;
        return studentName(a).localeCompare(studentName(b));
      });
  }, [
    students,
    search,
    showILPOnly,
    classId,
    showPinnedOnly,
    showFlaggedOnly,
    pinnedIds,
    flaggedIds,
  ]);

  const selectedStudents = useMemo(() => {
    const map = new Map<string, StudentRow>();
    for (const s of filtered) map.set(s.id, s);
    return selectedArray.map((id) => map.get(id)).filter(Boolean) as StudentRow[];
  }, [filtered, selectedArray]);

  // ─────────────────────────────
  // Load list data
  // ─────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    setErr("");

    const auth = await supabase.auth.getUser();
    if (auth.error || !auth.data.user) {
      window.location.href = "/";
      return;
    }

    const sRes = await supabase
      .from("students")
      .select("id, first_name, preferred_name, is_ilp, class_id")
      .order("preferred_name", { ascending: true })
      .order("first_name", { ascending: true });

    if (sRes.error) {
      setErr(`Load students failed: ${sRes.error.message}`);
      setStudents([]);
      setClasses([]);
      setLoading(false);
      return;
    }

    setStudents((sRes.data as StudentRow[]) ?? []);

    const cRes = await supabase
      .from("classes")
      .select("id, name, year_level")
      .order("year_level", { ascending: true })
      .order("name", { ascending: true });

    if (!cRes.error) setClasses((cRes.data as ClassRow[]) ?? []);
    else setClasses([]);

    setLoading(false);
  };

  useEffect(() => {
    setPinnedIds(safeLoadSet(LS_PINNED));
    setFlaggedIds(safeLoadSet(LS_FLAGGED));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep selection index sane when filters change
  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedIndex(-1);
      return;
    }
    if (selectedIndex < 0 || selectedIndex >= filtered.length) {
      setSelectedIndex(0);
      return;
    }
  }, [filtered.length]); // intentionally minimal

  // Prune multi-select to only visible rows
  useEffect(() => {
    const visible = new Set(filtered.map((s) => s.id));
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set<string>();
      for (const id of prev) if (visible.has(id)) next.add(id);
      return next;
    });
  }, [filtered]);

  // Keep drawer student in sync when open
  useEffect(() => {
    if (!drawerOpen) return;
    if (selectedIndex < 0 || selectedIndex >= filtered.length) return;
    const s = filtered[selectedIndex];
    setSelected(s);
    scrollRowIntoView(s.id);
    loadEvidenceFor(s.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, drawerOpen]);

  // ─────────────────────────────
  // Load evidence for selected student
  // ─────────────────────────────
  const loadEvidenceFor = async (studentId: string) => {
    setEvLoading(true);
    setEvErr("");
    setEvOk("");

    const eRes = await supabase
      .from("evidence_entries")
      .select("id, student_id, note, occurred_on, created_at")
      .eq("student_id", studentId)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (eRes.error) {
      setEvErr(`Load evidence failed: ${eRes.error.message}`);
      setEvidence([]);
      setEvLoading(false);
      return;
    }

    setEvidence((eRes.data as EvidenceRow[]) ?? []);
    setEvLoading(false);
  };

  // ─────────────────────────────
  // Compare: fetch evidence for selected students & build matrix
  // ─────────────────────────────
  const runCompare = async (studentIds: string[]) => {
    setCompareErr("");
    setCompareLoading(true);
    setCompareRows([]);
    setCompareLastRunAt("");

    const ids = studentIds.slice(0, 8);

    if (ids.length < 2) {
      setCompareErr("Select 2+ students to compare.");
      setCompareLoading(false);
      return;
    }

    const eRes = await supabase
      .from("evidence_entries")
      .select("id, student_id, note, occurred_on, created_at")
      .in("student_id", ids)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (eRes.error) {
      setCompareErr(`Compare load failed: ${eRes.error.message}`);
      setCompareLoading(false);
      return;
    }

    const rows = (eRes.data as EvidenceRow[]) ?? [];

    const byStudentCode = new Map<string, Map<string, CompareCell>>();
    for (const sid of ids) byStudentCode.set(sid, new Map());

    for (const ev of rows) {
      const sid = ev.student_id;
      if (!byStudentCode.has(sid)) continue;

      const txt = ev.note ?? "";
      const { code, score } = extract(txt);
      const date = (ev.occurred_on ?? ev.created_at).slice(0, 10);

      const m = byStudentCode.get(sid)!;

      if (!m.has(code)) {
        m.set(code, { latestScore: score, lastDate: date });
      }
    }

    const codes = new Set<string>();
    for (const sid of ids) {
      const m = byStudentCode.get(sid)!;
      for (const code of m.keys()) codes.add(code);
    }

    const out: CompareRow[] = Array.from(codes)
      .sort((a, b) => a.localeCompare(b))
      .map((code) => {
        const byStudent: Record<string, CompareCell> = {};
        for (const sid of ids) {
          const m = byStudentCode.get(sid)!;
          byStudent[sid] = m.get(code) ?? { latestScore: null, lastDate: null };
        }
        return { code, byStudent };
      });

    setCompareRows(out);
    setCompareLastRunAt(new Date().toISOString().slice(0, 19).replace("T", " "));
    setCompareLoading(false);
  };

  useEffect(() => {
    if (!drawerOpen) return;
    if (!compareMode) return;
    const ids = Array.from(selectedIds);
    if (ids.length < 2) return;
    runCompare(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen, compareMode, selectedIds]);

  // ─────────────────────────────
  // Row click behaviour (multi-select support)
  // ─────────────────────────────
  const applySelectionClick = (idx: number, s: StudentRow, e: React.MouseEvent) => {
    const isShift = e.shiftKey;
    const isCtrl = e.ctrlKey || e.metaKey;

    setSelectedIndex(idx);
    lastAnchorIndexRef.current = idx;

    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (isShift && filtered.length > 0) {
        const anchor = lastAnchorIndexRef.current >= 0 ? lastAnchorIndexRef.current : idx;
        const start = Math.min(anchor, idx);
        const end = Math.max(anchor, idx);

        const rangeIds = new Set<string>();
        for (let i = start; i <= end; i++) rangeIds.add(filtered[i].id);

        if (isCtrl) {
          for (const id of rangeIds) next.add(id);
          return next;
        }

        return rangeIds;
      }

      if (isCtrl) {
        if (next.has(s.id)) next.delete(s.id);
        else next.add(s.id);
        return next;
      }

      return new Set([s.id]);
    });
  };

  const openDrawerFor = async (s: StudentRow) => {
    setSelected(s);
    setDrawerOpen(true);

    setShowAdd(false);
    setEvErr("");
    setEvOk("");
    setInstrumentCode("");
    setScore("");
    setNote("");
    setSaving(false);

    await loadEvidenceFor(s.id);
  };

  const onRowClick = async (idx: number, s: StudentRow, e: React.MouseEvent) => {
    applySelectionClick(idx, s, e);
    await openDrawerFor(s);
  };

  // ─────────────────────────────
  // Context menu close + ESC
  // ─────────────────────────────
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ctx) return;
      const el = ctxRef.current;
      if (el && e.target instanceof Node && el.contains(e.target)) return;
      setCtx(null);
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCtx(null);
        if (drawerOpen) closeDrawer();
      }
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, drawerOpen]);

  const onRowContextMenu = (e: React.MouseEvent, idx: number, s: StudentRow) => {
    e.preventDefault();
    applySelectionClick(idx, s, e);
    setCtx({ x: e.clientX, y: e.clientY, student: s });
  };

  // ─────────────────────────────
  // Keyboard nav (↑/↓/Enter like FM) + Space toggles selection
  // ─────────────────────────────
  useEffect(() => {
    const isTypingTarget = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = (el.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return true;
      if ((el as any).isContentEditable) return true;
      return false;
    };

    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (filtered.length === 0) return;
        setCtx(null);
        setSelectedIndex((prev) => (prev < 0 ? 0 : Math.min(filtered.length - 1, prev + 1)));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (filtered.length === 0) return;
        setCtx(null);
        setSelectedIndex((prev) => (prev < 0 ? 0 : Math.max(0, prev - 1)));
        return;
      }

      if (e.key === " ") {
        if (filtered.length === 0) return;
        if (selectedIndex < 0 || selectedIndex >= filtered.length) return;
        e.preventDefault();
        const s = filtered[selectedIndex];
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(s.id)) next.delete(s.id);
          else next.add(s.id);
          return next;
        });
        return;
      }

      if (e.key === "Enter") {
        if (filtered.length === 0) return;
        if (selectedIndex < 0 || selectedIndex >= filtered.length) return;
        e.preventDefault();
        setCtx(null);
        openDrawerFor(filtered[selectedIndex]);
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, selectedIndex]);

  useEffect(() => {
    if (selectedIndex < 0 || selectedIndex >= filtered.length) return;
    scrollRowIntoView(filtered[selectedIndex].id);
  }, [selectedIndex, filtered]);

  // ─────────────────────────────
  // Save evidence (drawer quick-add)
  // ─────────────────────────────
  const saveEvidence = async () => {
    setEvErr("");
    setEvOk("");

    if (!selected?.id) return setEvErr("No student selected.");
    const code = instrumentCode.trim().toUpperCase();
    if (!code) return setEvErr("Instrument code is required.");

    const scoreTrim = score.trim();
    if (scoreTrim && !Number.isFinite(Number(scoreTrim))) {
      return setEvErr("Score must be numeric (or leave blank).");
    }

    const noteTrim = (note ?? "").trim();
    const fullNote =
      `${noteTrim}` +
      `${noteTrim ? " — " : ""}` +
      `(${code})` +
      (scoreTrim ? ` — Score: ${scoreTrim}` : "");

    setSaving(true);

    const { error } = await supabase.from("evidence_entries").insert([
      {
        student_id: selected.id,
        note: fullNote,
        occurred_on: occurredOn,
      },
    ]);

    if (error) {
      setEvErr(`Save evidence failed: ${error.message}`);
      setSaving(false);
      return;
    }

    setEvOk("Evidence added ✅");
    setSaving(false);
    setShowAdd(false);
    setInstrumentCode("");
    setScore("");
    setNote("");

    await loadEvidenceFor(selected.id);

    if (compareMode) {
      const ids = Array.from(selectedIds);
      if (ids.length >= 2) runCompare(ids);
    }
  };

  // ─────────────────────────────
  // Bulk actions
  // ─────────────────────────────
  const clearSelection = () => setSelectedIds(new Set());

  const bulkOpenFirstPanel = async () => {
    if (selectedStudents.length === 0) return;
    const first = selectedStudents[0];
    const idx = filtered.findIndex((x) => x.id === first.id);
    if (idx >= 0) setSelectedIndex(idx);
    await openDrawerFor(first);
  };

  const bulkOpenFirstProfile = () => {
    if (selectedStudents.length === 0) return;
    openFullProfile(selectedStudents[0].id);
  };

  const bulkAddEvidenceFirst = async () => {
    if (selectedStudents.length === 0) return;
    const first = selectedStudents[0];
    const idx = filtered.findIndex((x) => x.id === first.id);
    if (idx >= 0) setSelectedIndex(idx);
    await openDrawerFor(first);
    setShowAdd(true);
  };

  const bulkCompare = async () => {
    if (selectedStudents.length < 2) return;
    await bulkOpenFirstPanel();
    setCompareMode(true);
    runCompare(Array.from(selectedIds));
  };

  const bulkPinToggle = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    for (const id of ids) togglePinned(id);
  };

  const bulkFlagToggle = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    for (const id of ids) toggleFlagged(id);
  };

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  if (loading) {
    return (
      <main style={{ padding: 24, maxWidth: 1200 }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>STUDENTS</div>
        <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>Loading students…</div>
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <div style={skeletonRow} />
          <div style={{ height: 10 }} />
          <div style={skeletonRow} />
          <div style={{ height: 10 }} />
          <div style={skeletonRow} />
        </div>
      </main>
    );
  }

  const anySelected = selectedIds.size > 0;

  const compareIds = Array.from(selectedIds).slice(0, 8);
  const compareHeaderStudents = compareIds
    .map((id) => {
      const s = filtered.find((x) => x.id === id) || students.find((x) => x.id === id);
      return s ?? null;
    })
    .filter(Boolean) as StudentRow[];

  return (
    <main style={{ padding: 24, maxWidth: 1400 }}>
      <section style={panel}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>STUDENTS</div>
          <div style={{ fontSize: 26, fontWeight: 900 }}>Student List</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
            Click row → opens panel • Ctrl/Shift select • Space toggles • ↑/↓ focus • Enter opens
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill label={`Total: ${students.length}`} />
            <Pill label={`Showing: ${filtered.length}`} />
            <Pill label={`Selected: ${selectedIds.size}`} />
            <Pill label={`Pinned: ${pinnedIds.size}`} />
            <Pill label={`Flagged: ${flaggedIds.size}`} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={loadAll} style={btn}>
            Refresh
          </button>
          <button onClick={() => router.push("/teacher")} style={btn}>
            ← Back to Teacher
          </button>
        </div>
      </section>

      {!!err && (
        <div style={errorBox}>
          <strong style={{ color: "crimson" }}>Error:</strong>{" "}
          <span style={{ whiteSpace: "pre-wrap" }}>{err}</span>
        </div>
      )}

      {/* Bulk Action Bar */}
      {anySelected && (
        <section style={{ ...panel, marginTop: 12, borderStyle: "dashed" }}>
          <div style={{ width: "100%" }}>
            <div style={{ fontWeight: 900 }}>Bulk actions</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
              {selectedIds.size} selected • Ctrl/Shift click to modify selection • Compare supports up to 8 students
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={btn} onClick={() => copyIds(selectedArray)}>
                Copy IDs (newline)
              </button>
              <button style={btn} onClick={bulkOpenFirstPanel}>
                Open panel (first)
              </button>
              <button style={btn} onClick={bulkOpenFirstProfile}>
                Open profile (first)
              </button>
              <button
                style={{ ...btn, background: "#111", color: "white", borderColor: "#111" }}
                onClick={bulkAddEvidenceFirst}
              >
                + Evidence (first)
              </button>
              <button style={btn} onClick={bulkCompare} disabled={selectedIds.size < 2}>
                Compare selected
              </button>

              <button style={btn} onClick={bulkPinToggle}>
                Toggle Pin (selected)
              </button>
              <button style={btn} onClick={bulkFlagToggle}>
                Toggle Flag (selected)
              </button>

              <button style={btn} onClick={clearSelection}>
                Clear selection
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Controls */}
      <section style={{ ...panel, marginTop: 12 }}>
        <div style={{ width: "100%" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
            <label style={{ fontSize: 12 }}>
              Search (name or UUID)
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to filter…"
                style={input}
              />
            </label>

            <label style={{ fontSize: 12 }}>
              Class
              <select value={classId} onChange={(e) => setClassId(e.target.value)} style={select}>
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {(c.name ?? "Class") + (c.year_level != null ? ` • Year ${c.year_level}` : "")}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 10, marginTop: 22 }}>
                <input
                  type="checkbox"
                  checked={showILPOnly}
                  onChange={(e) => setShowILPOnly(e.target.checked)}
                />
                ILP only
              </label>

              <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 10, marginTop: 22 }}>
                <input
                  type="checkbox"
                  checked={showPinnedOnly}
                  onChange={(e) => setShowPinnedOnly(e.target.checked)}
                />
                Pinned only
              </label>

              <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={showFlaggedOnly}
                  onChange={(e) => setShowFlaggedOnly(e.target.checked)}
                />
                Flagged only
              </label>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "flex-end" }}>
                <button style={btn} onClick={clearPinned} disabled={pinnedIds.size === 0}>
                  Clear pinned
                </button>
                <button style={btn} onClick={clearFlagged} disabled={flaggedIds.size === 0}>
                  Clear flagged
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Table */}
      <section style={{ ...panel, marginTop: 12 }}>
        <div style={{ width: "100%" }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>
            Students ({filtered.length})
            <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>
              Ctrl/Shift select • Space toggle • Enter open • Right-click actions
            </span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.75 }}>No students match your filters.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1080 }}>
                <thead>
                  <tr style={{ textAlign: "left", fontSize: 12, opacity: 0.7 }}>
                    <th style={{ padding: "8px 6px" }}>Sel</th>
                    <th style={{ padding: "8px 6px" }}>Badges</th>
                    <th style={{ padding: "8px 6px" }}>Student</th>
                    <th style={{ padding: "8px 6px" }}>Class</th>
                    <th style={{ padding: "8px 6px" }}>ILP</th>
                    <th style={{ padding: "8px 6px" }}>Quick</th>
                    <th style={{ padding: "8px 6px" }}>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, idx) => {
                    const isFocus = idx === selectedIndex;
                    const isPicked = selectedIds.has(s.id);
                    const isPinned = pinnedIds.has(s.id);
                    const isFlagged = flaggedIds.has(s.id);

                    return (
                      <tr
                        key={s.id}
                        ref={(el) => {
                          rowRefs.current[s.id] = el;
                        }}
                        onClick={(e) => onRowClick(idx, s, e)}
                        onContextMenu={(e) => onRowContextMenu(e, idx, s)}
                        style={{
                          ...rowStyle,
                          background: isFocus ? "rgba(0,0,0,0.04)" : "transparent",
                          outline: isFocus ? "2px solid rgba(0,0,0,0.12)" : "none",
                          outlineOffset: "-2px",
                        }}
                        title="Click opens panel • Ctrl/Shift select • Right-click actions"
                      >
                        <td style={{ padding: "10px 6px", width: 50 }}>
                          <input
                            type="checkbox"
                            checked={isPicked}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedIndex(idx);
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(s.id)) next.delete(s.id);
                                else next.add(s.id);
                                return next;
                              });
                              lastAnchorIndexRef.current = idx;
                            }}
                          />
                        </td>

                        <td style={{ padding: "10px 6px", width: 120 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            {isPinned && <span title="Pinned">📌</span>}
                            {isFlagged && <span title="Needs review">⚑</span>}
                          </div>
                        </td>

                        <td style={{ padding: "10px 6px", fontWeight: 900 }}>{studentName(s)}</td>
                        <td style={{ padding: "10px 6px" }}>{classLabel(s.class_id)}</td>
                        <td style={{ padding: "10px 6px" }}>{s.is_ilp ? "Yes" : "No"}</td>

                        <td style={{ padding: "10px 6px", width: 360 }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              style={miniBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDrawerFor(s);
                                setShowAdd(true);
                                setSelectedIndex(idx);
                                setSelectedIds(new Set([s.id]));
                                lastAnchorIndexRef.current = idx;
                              }}
                            >
                              + Evidence
                            </button>

                            <button
                              style={miniBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePinned(s.id);
                              }}
                              title="Pin/unpin (local only)"
                            >
                              {isPinned ? "Unpin" : "Pin"}
                            </button>

                            <button
                              style={miniBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFlagged(s.id);
                              }}
                              title="Flag/unflag (local only)"
                            >
                              {isFlagged ? "Unflag" : "Flag"}
                            </button>

                            <button
                              style={miniBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                copyText(s.id);
                              }}
                              title="Copy student UUID"
                            >
                              Copy ID
                            </button>

                            <button
                              style={miniBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIndex(idx);
                                setSelectedIds((prev) => {
                                  const next = new Set(prev);
                                  next.add(s.id);
                                  return next;
                                });
                                openDrawerFor(s);
                                setCompareMode(true);
                              }}
                              title="Compare (requires 2+ selected)"
                            >
                              Compare
                            </button>
                          </div>
                        </td>

                        <td style={{ padding: "10px 6px", fontSize: 12, opacity: 0.8 }}>
                          <code>{s.id}</code>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Right-click menu */}
      {ctx && (
        <div
          ref={ctxRef}
          style={{
            position: "fixed",
            left: ctx.x,
            top: ctx.y,
            zIndex: 9999,
            background: "white",
            border: "1px solid #e6e6e6",
            borderRadius: 12,
            boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
            padding: 8,
            minWidth: 280,
          }}
        >
          <div style={{ padding: "8px 10px", fontSize: 12, opacity: 0.7 }}>
            {studentName(ctx.student)} • selected {selectedIds.size}
          </div>

          <MenuItem
            label="Open panel"
            onClick={() => {
              const s = ctx.student;
              setCtx(null);
              openDrawerFor(s);
            }}
          />
          <MenuItem
            label="Open full profile"
            onClick={() => {
              const s = ctx.student;
              setCtx(null);
              openFullProfile(s.id);
            }}
          />
          <MenuItem
            label="Add evidence (open panel + form)"
            onClick={() => {
              const s = ctx.student;
              setCtx(null);
              openDrawerFor(s);
              setShowAdd(true);
            }}
          />

          <MenuItem
            label={pinnedIds.has(ctx.student.id) ? "Unpin student" : "Pin student"}
            onClick={() => {
              togglePinned(ctx.student.id);
              setCtx(null);
            }}
          />
          <MenuItem
            label={flaggedIds.has(ctx.student.id) ? "Unflag student" : "Flag student (needs review)"}
            onClick={() => {
              toggleFlagged(ctx.student.id);
              setCtx(null);
            }}
          />

          <MenuItem
            label="Compare selected"
            onClick={() => {
              setCtx(null);
              if (selectedIds.size < 2) return;
              bulkCompare();
            }}
          />
          <MenuItem
            label="Copy selected IDs"
            onClick={async () => {
              await copyIds(Array.from(selectedIds));
              setCtx(null);
            }}
          />
          <MenuItem
            label="Clear selection"
            onClick={() => {
              setSelectedIds(new Set());
              setCtx(null);
            }}
          />
        </div>
      )}

      {/* FM Slide-over Drawer */}
      {drawerOpen && (
        <>
          <div
            onClick={closeDrawer}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.25)",
              zIndex: 9000,
            }}
          />

          <aside
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100vh",
              width: "min(680px, 95vw)",
              background: "white",
              borderLeft: "1px solid #e6e6e6",
              zIndex: 9001,
              padding: 16,
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>PROFILE PANEL</div>
                <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>
                  {studentName(selected)}{" "}
                  {selected?.id && pinnedIds.has(selected.id) && <span title="Pinned">📌</span>}{" "}
                  {selected?.id && flaggedIds.has(selected.id) && <span title="Needs review">⚑</span>}
                </div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                  {selected ? classLabel(selected.class_id) : "—"}
                  {selected?.is_ilp ? " • ILP" : ""}
                </div>
                {selectedIds.size > 1 && (
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                    Multi-select active: {selectedIds.size} selected (compare supports up to 8)
                  </div>
                )}
              </div>

              <button onClick={closeDrawer} style={btn}>
                ✕ Close
              </button>
            </div>

            {!!evErr && (
              <div style={{ ...errorBox, marginTop: 12 }}>
                <strong style={{ color: "crimson" }}>Error:</strong>{" "}
                <span style={{ whiteSpace: "pre-wrap" }}>{evErr}</span>
              </div>
            )}
            {!!evOk && (
              <div style={{ ...okBox, marginTop: 12 }}>
                <strong style={{ color: "green" }}>OK:</strong> {evOk}
              </div>
            )}

            {/* ACTIONS */}
            <section style={{ ...card, marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 900 }}>Actions</div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                    FM-style quick actions (pinned/flagged are stored locally).
                  </div>
                </div>
                <button style={btn} onClick={() => setActionsOpen((v) => !v)}>
                  {actionsOpen ? "Hide" : "Show"}
                </button>
              </div>

              {actionsOpen && (
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    style={btn}
                    onClick={() => {
                      if (!selected) return;
                      openFullProfile(selected.id);
                    }}
                  >
                    Open full profile →
                  </button>

                  <button
                    style={{ ...btn, background: "#111", color: "white", borderColor: "#111" }}
                    onClick={() => setShowAdd((v) => !v)}
                  >
                    + Add evidence
                  </button>

                  <button
                    style={btn}
                    onClick={() => {
                      if (!selected) return;
                      copyText(selected.id);
                    }}
                  >
                    Copy ID
                  </button>

                  <button
                    style={btn}
                    onClick={() => {
                      if (!selected) return;
                      loadEvidenceFor(selected.id);
                    }}
                  >
                    Refresh
                  </button>

                  <button
                    style={btn}
                    disabled={selectedIds.size < 2}
                    onClick={() => {
                      if (selectedIds.size < 2) return;
                      setCompareMode(true);
                      runCompare(Array.from(selectedIds));
                    }}
                  >
                    Compare selected
                  </button>

                  <button
                    style={btn}
                    onClick={() => {
                      if (!selected) return;
                      togglePinned(selected.id);
                    }}
                  >
                    {selected?.id && pinnedIds.has(selected.id) ? "Unpin" : "Pin"}
                  </button>

                  <button
                    style={btn}
                    onClick={() => {
                      if (!selected) return;
                      toggleFlagged(selected.id);
                    }}
                  >
                    {selected?.id && flaggedIds.has(selected.id) ? "Unflag" : "Flag"}
                  </button>
                </div>
              )}
            </section>

            {/* SUPPORT SIGNALS */}
            <section style={{ ...card, marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 900 }}>Support Signals</div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                    Auto-generated alerts (no DB changes).
                  </div>
                </div>
                <button style={btn} onClick={() => setSignalsOpen((v) => !v)}>
                  {signalsOpen ? "Hide" : "Show"}
                </button>
              </div>

              {signalsOpen && (
                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  {signalsBySeverity.length === 0 ? (
                    <div style={{ fontSize: 13, opacity: 0.75 }}>No signals.</div>
                  ) : (
                    signalsBySeverity.map((sig) => (
                      <div
                        key={sig.key}
                        style={{
                          border: "1px solid #eee",
                          borderRadius: 12,
                          padding: 10,
                          display: "grid",
                          gridTemplateColumns: "auto 1fr",
                          gap: 10,
                          alignItems: "start",
                        }}
                      >
                        <SignalDot severity={sig.severity} />
                        <div>
                          <div style={{ fontWeight: 900 }}>{sig.label}</div>
                          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{sig.detail}</div>

                          {sig.key === "NO_EVIDENCE" || sig.key === "LOW_EVIDENCE" ? (
                            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button
                                style={{ ...miniBtn, background: "#111", color: "white", borderColor: "#111" }}
                                onClick={() => setShowAdd(true)}
                              >
                                + Add evidence now
                              </button>
                              <button style={miniBtn} onClick={() => setInstrumentCode("NAP-NUM")}>
                                Fill: NAP-NUM
                              </button>
                              <button style={miniBtn} onClick={() => setInstrumentCode("NAP-READ")}>
                                Fill: NAP-READ
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>

            {/* Compare view */}
            {compareMode && (
              <section style={{ ...card, marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>Compare selected (latest per instrument)</div>
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                      Uses <code>evidence_entries</code> to extract <code>(CODE)</code> and <code>Score:</code>.
                      {compareLastRunAt ? ` • Last refresh: ${compareLastRunAt}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={btn}
                      onClick={() => runCompare(Array.from(selectedIds))}
                      disabled={compareLoading || selectedIds.size < 2}
                    >
                      {compareLoading ? "Refreshing…" : "Refresh compare"}
                    </button>
                    <button
                      style={btn}
                      onClick={() => {
                        setCompareMode(false);
                        setCompareErr("");
                        setCompareRows([]);
                      }}
                    >
                      Hide
                    </button>
                  </div>
                </div>

                {!!compareErr && (
                  <div style={{ ...errorBox, marginTop: 12 }}>
                    <strong style={{ color: "crimson" }}>Compare error:</strong>{" "}
                    <span style={{ whiteSpace: "pre-wrap" }}>{compareErr}</span>
                  </div>
                )}

                {compareLoading ? (
                  <div style={{ marginTop: 10 }}>
                    <div style={skeletonRow} />
                    <div style={{ height: 10 }} />
                    <div style={skeletonRow} />
                  </div>
                ) : compareRows.length === 0 ? (
                  <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
                    No comparable evidence found yet (for selected students).
                  </div>
                ) : (
                  <div style={{ overflowX: "auto", marginTop: 10 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                      <thead>
                        <tr style={{ textAlign: "left", fontSize: 12, opacity: 0.7 }}>
                          <th style={{ padding: "8px 6px" }}>Code</th>
                          {compareHeaderStudents.slice(0, 8).map((s) => (
                            <th key={s.id} style={{ padding: "8px 6px" }}>
                              {studentName(s)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {compareRows.map((r) => (
                          <tr key={r.code} style={{ borderTop: "1px solid #f0f0f0" }}>
                            <td style={{ padding: "10px 6px", fontWeight: 900 }}>
                              <code>{r.code}</code>
                            </td>

                            {compareHeaderStudents.slice(0, 8).map((s) => {
                              const cell = r.byStudent[s.id] ?? { latestScore: null, lastDate: null };
                              const label =
                                cell.latestScore == null
                                  ? "—"
                                  : `${cell.latestScore}${cell.lastDate ? ` (${cell.lastDate})` : ""}`;
                              return (
                                <td key={s.id} style={{ padding: "10px 6px", fontSize: 12 }}>
                                  {label}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* Add Evidence Form */}
            {showAdd && (
              <section style={{ ...card, marginTop: 12 }}>
                <div style={{ fontWeight: 900 }}>Quick-add evidence</div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                  Stored in <code>evidence_entries.note</code> and <code>occurred_on</code>.
                </div>

                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label style={{ fontSize: 12 }}>
                    Occurred on
                    <input
                      type="date"
                      value={occurredOn}
                      onChange={(e) => setOccurredOn(e.target.value)}
                      style={input}
                    />
                  </label>

                  <label style={{ fontSize: 12 }}>
                    Instrument code
                    <input
                      value={instrumentCode}
                      onChange={(e) => setInstrumentCode(e.target.value)}
                      placeholder="e.g. NAP-NUM"
                      style={input}
                    />
                  </label>
                </div>

                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label style={{ fontSize: 12 }}>
                    Score (optional)
                    <input value={score} onChange={(e) => setScore(e.target.value)} placeholder="e.g. 237" style={input} />
                  </label>

                  <label style={{ fontSize: 12 }}>
                    Note (optional)
                    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. practice test / supports" style={input} />
                  </label>
                </div>

                <button
                  onClick={saveEvidence}
                  disabled={saving}
                  style={{ ...btn, marginTop: 10, background: "#111", color: "white", borderColor: "#111" }}
                >
                  {saving ? "Saving…" : "Save evidence"}
                </button>
              </section>
            )}

            {/* Assessment Summary by instrument */}
            <section style={{ ...card, marginTop: 12 }}>
              <div style={{ fontWeight: 900 }}>Assessment Summary by instrument</div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                Code → latest score → count → last date (derived from evidence notes).
              </div>

              {evLoading ? (
                <div style={{ marginTop: 10 }}>
                  <div style={skeletonRow} />
                  <div style={{ height: 10 }} />
                  <div style={skeletonRow} />
                </div>
              ) : summary.length === 0 ? (
                <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>No evidence yet.</div>
              ) : (
                <div style={{ overflowX: "auto", marginTop: 10 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                    <thead>
                      <tr style={{ textAlign: "left", fontSize: 12, opacity: 0.7 }}>
                        <th style={{ padding: "8px 6px" }}>Code</th>
                        <th style={{ padding: "8px 6px" }}>Latest</th>
                        <th style={{ padding: "8px 6px" }}>Count</th>
                        <th style={{ padding: "8px 6px" }}>Last date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map((r) => (
                        <tr key={r.code} style={{ borderTop: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "10px 6px", fontWeight: 900 }}>
                            <code>{r.code}</code>
                          </td>
                          <td style={{ padding: "10px 6px" }}>{r.latestScore ?? "—"}</td>
                          <td style={{ padding: "10px 6px" }}>{r.count}</td>
                          <td style={{ padding: "10px 6px" }}>{r.lastDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Evidence timeline */}
            <section style={{ ...card, marginTop: 12 }}>
              <div style={{ fontWeight: 900 }}>Evidence timeline</div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>Latest entries (up to 30).</div>

              {evLoading ? (
                <div style={{ marginTop: 10 }}>
                  <div style={skeletonRow} />
                  <div style={{ height: 10 }} />
                  <div style={skeletonRow} />
                </div>
              ) : evidence.length === 0 ? (
                <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>No evidence yet.</div>
              ) : (
                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  {evidence.slice(0, 30).map((e) => (
                    <div key={e.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 10 }}>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        {(e.occurred_on ?? e.created_at).slice(0, 10)} • <code>{e.id}</code>
                      </div>
                      <div style={{ marginTop: 6, fontWeight: 800 }}>{e.note ?? "—"}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </>
      )}
    </main>
  );
}

/* ─────────────────────────────
   UI helpers
───────────────────────────── */
function Pill({ label }: { label: string }) {
  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid #e6e6e6",
        fontSize: 12,
        fontWeight: 800,
        background: "white",
      }}
    >
      {label}
    </span>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "10px 10px",
        borderRadius: 10,
        border: "1px solid transparent",
        background: "transparent",
        cursor: "pointer",
        fontWeight: 800,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f6f6f6";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {label}
    </button>
  );
}

function SignalDot({ severity }: { severity: "high" | "med" | "low" }) {
  const bg =
    severity === "high"
      ? "rgba(220, 38, 38, 0.12)"
      : severity === "med"
      ? "rgba(245, 158, 11, 0.14)"
      : "rgba(34, 197, 94, 0.12)";

  const bd =
    severity === "high"
      ? "rgba(220, 38, 38, 0.35)"
      : severity === "med"
      ? "rgba(245, 158, 11, 0.35)"
      : "rgba(34, 197, 94, 0.35)";

  const dot =
    severity === "high" ? "●" : severity === "med" ? "●" : "●";

  const color =
    severity === "high"
      ? "rgb(220,38,38)"
      : severity === "med"
      ? "rgb(245,158,11)"
      : "rgb(34,197,94)";

  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 12,
        border: `1px solid ${bd}`,
        background: bg,
        display: "grid",
        placeItems: "center",
        fontWeight: 900,
        color,
        userSelect: "none",
      }}
      title={severity.toUpperCase()}
    >
      {dot}
    </div>
  );
}

/* ─────────────────────────────
   Styles
───────────────────────────── */
const panel: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  padding: 16,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  background: "white",
};

const card: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  padding: 12,
  background: "white",
};

const btn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontWeight: 900,
  cursor: "pointer",
  background: "white",
};

const miniBtn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontWeight: 900,
  cursor: "pointer",
  background: "white",
  fontSize: 12,
};

const select: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: 10,
  borderRadius: 12,
  border: "1px solid #ddd",
};

const input: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: 10,
  borderRadius: 12,
  border: "1px solid #ddd",
};

const errorBox: React.CSSProperties = {
  marginTop: 12,
  marginBottom: 12,
  padding: 10,
  border: "1px solid #f2c1c1",
  borderRadius: 10,
  background: "white",
};

const okBox: React.CSSProperties = {
  marginTop: 12,
  marginBottom: 12,
  padding: 10,
  border: "1px solid #cfe9cf",
  borderRadius: 10,
  background: "white",
};

const rowStyle: React.CSSProperties = {
  borderTop: "1px solid #f0f0f0",
  cursor: "pointer",
};

const skeletonRow: React.CSSProperties = {
  height: 56,
  borderRadius: 12,
  border: "1px solid #eee",
  background:
    "linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0.02) 100%)",
};
