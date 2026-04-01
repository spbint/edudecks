"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────────── TYPES ───────────────────────────── */

type ClassRow = {
  id: string;
  name: string | null;
  year_level: number | null;
  created_at?: string | null;
};

type StudentMini = {
  id: string;
  class_id: string | null;
  is_ilp?: boolean | null;
  is_archived?: boolean | null;
};

type EvidenceMini = {
  id: string;
  class_id?: string | null;
  student_id?: string | null;
  created_at?: string | null;
  occurred_on?: string | null;
  is_deleted?: boolean | null;
};

type InterventionMini = {
  id: string;
  class_id?: string | null;
  student_id?: string | null;
  status?: string | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  next_review_on?: string | null;
  due_on?: string | null;
};

type SortKey = "year" | "name" | "created" | "students" | "evidence" | "overdue";
type ViewMode = "gridCompact" | "gridDetailed" | "list";

/* ───────────────────────────── UTIL ───────────────────────────── */

function safe(v: string | null | undefined) {
  return (v ?? "").trim();
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

function fmtYear(y: number | null) {
  return y == null ? "Y?" : `Y${y}`;
}

function normalizeName(s: string) {
  return s.trim().toLowerCase();
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function coalesceDate(...xs: Array<string | null | undefined>) {
  for (const x of xs) {
    if (x && safe(x)) return x;
  }
  return null;
}

function isClosedStatus(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  return s === "done" || s === "closed" || s === "resolved" || s === "archived";
}

function dueSoonLevel(due: string | null | undefined) {
  if (!due) return "none" as const;
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return "none" as const;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = dueDate.getTime() - today.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return "overdue" as const;
  if (days <= 7) return "soon" as const;
  return "ok" as const;
}

function loadPinned(): string[] {
  try {
    const raw = localStorage.getItem("edu_pinned_classes");
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function savePinned(ids: string[]) {
  try {
    localStorage.setItem("edu_pinned_classes", JSON.stringify(ids));
  } catch {
    // ignore
  }
}

/* ───────────────────────────── STYLES ───────────────────────────── */

const S = {
  shell: { display: "flex", minHeight: "100vh", background: "#f6f7fb" } as React.CSSProperties,
  main: { flex: 1, padding: 22, maxWidth: 1380, margin: "0 auto", width: "100%" } as React.CSSProperties,

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(17,24,39,0.06), rgba(99,102,241,0.08))",
    padding: 18,
  } as React.CSSProperties,

  subtle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  } as React.CSSProperties,

  h1: {
    fontSize: 40,
    fontWeight: 950,
    lineHeight: 1.05,
    marginTop: 8,
    color: "#0f172a",
  } as React.CSSProperties,

  row: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  } as React.CSSProperties,

  card: {
    border: "1px solid #e8eaf0",
    borderRadius: 18,
    background: "#fff",
  } as React.CSSProperties,

  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontSize: 12,
    fontWeight: 900,
    color: "#0f172a",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  chipMuted: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: 12,
    fontWeight: 900,
    color: "#475569",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  chipDanger: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    fontSize: 12,
    fontWeight: 900,
    color: "#9f1239",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  btn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontWeight: 900,
    cursor: "pointer",
    background: "#fff",
    color: "#0f172a",
  } as React.CSSProperties,

  btnPrimary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #0f172a",
    fontWeight: 900,
    cursor: "pointer",
    background: "#0f172a",
    color: "#fff",
  } as React.CSSProperties,

  btnDanger: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #fecaca",
    fontWeight: 900,
    cursor: "pointer",
    background: "#fff1f2",
    color: "#9f1239",
  } as React.CSSProperties,

  btnMini: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    fontWeight: 900,
    cursor: "pointer",
    background: "#fff",
    color: "#0f172a",
    fontSize: 12,
  } as React.CSSProperties,

  input: {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    width: "100%",
    fontWeight: 900,
    background: "#fff",
    outline: "none",
    color: "#0f172a",
  } as React.CSSProperties,

  select: {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    width: "100%",
    fontWeight: 900,
    background: "#fff",
    outline: "none",
    color: "#0f172a",
  } as React.CSSProperties,

  helper: {
    marginTop: 8,
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 750,
    lineHeight: 1.35,
  } as React.CSSProperties,

  alert: {
    marginTop: 10,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    padding: 12,
    color: "#9f1239",
    fontWeight: 900,
  } as React.CSSProperties,

  ok: {
    marginTop: 10,
    borderRadius: 14,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    padding: 12,
    color: "#14532d",
    fontWeight: 900,
  } as React.CSSProperties,

  statGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 12,
  } as React.CSSProperties,

  stat: {
    border: "1px solid #e8eaf0",
    borderRadius: 18,
    background: "#fff",
    padding: 14,
  } as React.CSSProperties,

  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 950,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  } as React.CSSProperties,

  statValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  statHelp: {
    marginTop: 8,
    fontSize: 12,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.35,
  } as React.CSSProperties,
};

/* ───────────────────────────── PAGE ───────────────────────────── */

export default function ClassEntryPage() {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [ilpCounts, setIlpCounts] = useState<Record<string, number>>({});
  const [evidenceCounts, setEvidenceCounts] = useState<Record<string, number>>({});
  const [openPlanCounts, setOpenPlanCounts] = useState<Record<string, number>>({});
  const [overdueCounts, setOverdueCounts] = useState<Record<string, number>>({});

  const [view, setView] = useState<ViewMode>("gridDetailed");
  const [sort, setSort] = useState<SortKey>("year");
  const [q, setQ] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const [newClassName, setNewClassName] = useState("");
  const [newYearLevel, setNewYearLevel] = useState<string>("");

  const [pinned, setPinned] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPinned(loadPinned());
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      const el = document.activeElement as HTMLElement | null;
      const tag = (el?.tagName ?? "").toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || (el as any)?.isContentEditable;

      if (!isTyping && key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (!isTyping && key === "escape") {
        setQ("");
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function loadData() {
    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      const { data: cRows, error: cErr } = await supabase
        .from("classes")
        .select("id,name,year_level,created_at")
        .order("year_level", { ascending: true })
        .order("name", { ascending: true });

      if (cErr) throw cErr;

      const cls = (cRows ?? []) as ClassRow[];
      setClasses(cls);

      const { data: sRows, error: sErr } = await supabase
        .from("students")
        .select("id,class_id,is_ilp,is_archived");

      if (!sErr) {
        const counts: Record<string, number> = {};
        const ilps: Record<string, number> = {};

        (sRows as StudentMini[]).forEach((s) => {
          const cid = s.class_id;
          if (!cid) return;
          if (s.is_archived) return;

          counts[cid] = (counts[cid] ?? 0) + 1;
          if (s.is_ilp) ilps[cid] = (ilps[cid] ?? 0) + 1;
        });

        setStudentCounts(counts);
        setIlpCounts(ilps);
      } else {
        if (!isMissingColumnError(sErr)) console.warn("Student load failed:", sErr);
        setStudentCounts({});
        setIlpCounts({});
      }

      const { data: eRows, error: eErr } = await supabase
        .from("evidence_entries")
        .select("id,class_id,student_id,created_at,occurred_on,is_deleted")
        .eq("is_deleted", false);

      if (!eErr) {
        const counts: Record<string, number> = {};

        (eRows as EvidenceMini[]).forEach((e) => {
          const cid = safe(e.class_id);
          if (!cid) return;
          counts[cid] = (counts[cid] ?? 0) + 1;
        });

        setEvidenceCounts(counts);
      } else {
        setEvidenceCounts({});
      }

      const { data: iRows, error: iErr } = await supabase
        .from("interventions")
        .select("id,class_id,student_id,status,review_due_on,review_due_date,next_review_on,due_on");

      if (!iErr) {
        const openCounts: Record<string, number> = {};
        const overdue: Record<string, number> = {};

        (iRows as InterventionMini[]).forEach((i) => {
          const cid = safe(i.class_id);
          if (!cid) return;
          if (isClosedStatus(i.status)) return;

          openCounts[cid] = (openCounts[cid] ?? 0) + 1;

          const due = coalesceDate(i.review_due_on, i.review_due_date, i.next_review_on, i.due_on);
          if (dueSoonLevel(due) === "overdue") {
            overdue[cid] = (overdue[cid] ?? 0) + 1;
          }
        });

        setOpenPlanCounts(openCounts);
        setOverdueCounts(overdue);
      } else {
        setOpenPlanCounts({});
        setOverdueCounts({});
      }

      setMsg("Loaded.");
      setTimeout(() => setMsg(null), 900);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load classes.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function togglePinned(id: string) {
    setPinned((cur) => {
      const has = cur.includes(id);
      const next = has ? cur.filter((x) => x !== id) : [id, ...cur];
      savePinned(next);
      return next;
    });
  }

  function openClass(id: string) {
    router.push(`/admin/classes/${id}?tab=overview`);
  }

  async function createClass() {
    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      const name = safe(newClassName);
      if (!name) throw new Error("Please enter a class name.");

      const yearNum =
        newYearLevel === "" ? null : Number.isNaN(Number(newYearLevel)) ? null : Number(newYearLevel);

      const payload: Record<string, any> = {
        name,
        year_level: yearNum,
      };

      const { data, error } = await supabase.from("classes").insert(payload).select("id").single();
      if (error) throw error;

      setMsg("Class created.");
      setNewClassName("");
      setNewYearLevel("");
      await loadData();

      const newId = safe((data as any)?.id);
      if (newId) router.push(`/admin/classes/${newId}?tab=overview`);
    } catch (e: any) {
      setErr(e?.message ?? "Could not create class.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteClass(c: ClassRow) {
    const count = studentCounts[c.id] ?? 0;
    if (count > 0) {
      setErr("This class still has students assigned. Move or archive them first.");
      return;
    }

    const ok = window.confirm(`Delete class "${safe(c.name) || "Unnamed class"}"?`);
    if (!ok) return;

    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      const { error } = await supabase.from("classes").delete().eq("id", c.id);
      if (error) throw error;
      setMsg("Class deleted.");
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? "Could not delete class.");
    } finally {
      setBusy(false);
    }
  }

  const years = useMemo(() => {
    const set = new Set<number>();
    classes.forEach((c) => {
      if (typeof c.year_level === "number") set.add(c.year_level);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [classes]);

  const filtered = useMemo(() => {
    const query = normalizeName(q);
    const yf = yearFilter;

    let arr = classes.filter((c) => {
      if (yf !== "all") {
        const y = c.year_level == null ? "" : String(c.year_level);
        if (y !== yf) return false;
      }
      if (!query) return true;
      const hay = normalizeName(`${safe(c.name)} ${fmtYear(c.year_level)}`);
      return hay.includes(query);
    });

    arr = [...arr].sort((a, b) => {
      if (sort === "year") {
        const ay = a.year_level ?? 999;
        const by = b.year_level ?? 999;
        if (ay !== by) return ay - by;
        return normalizeName(safe(a.name)).localeCompare(normalizeName(safe(b.name)));
      }

      if (sort === "name") {
        const an = normalizeName(safe(a.name));
        const bn = normalizeName(safe(b.name));
        const c = an.localeCompare(bn);
        if (c !== 0) return c;
        const ay = a.year_level ?? 999;
        const by = b.year_level ?? 999;
        return ay - by;
      }

      if (sort === "students") {
        return (studentCounts[b.id] ?? 0) - (studentCounts[a.id] ?? 0);
      }

      if (sort === "evidence") {
        return (evidenceCounts[b.id] ?? 0) - (evidenceCounts[a.id] ?? 0);
      }

      if (sort === "overdue") {
        return (overdueCounts[b.id] ?? 0) - (overdueCounts[a.id] ?? 0);
      }

      const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bd - ad;
    });

    const pinnedSet = new Set(pinned);
    const pinnedArr = arr.filter((c) => pinnedSet.has(c.id));
    const restArr = arr.filter((c) => !pinnedSet.has(c.id));
    return [...pinnedArr, ...restArr];
  }, [classes, q, yearFilter, sort, pinned, studentCounts, evidenceCounts, overdueCounts]);

  const totalPinnedVisible = useMemo(() => {
    const set = new Set(pinned);
    return filtered.filter((c) => set.has(c.id)).length;
  }, [filtered, pinned]);

  const overallStats = useMemo(() => {
    const classCount = filtered.length;
    const studentCount = filtered.reduce((sum, c) => sum + (studentCounts[c.id] ?? 0), 0);
    const ilpCount = filtered.reduce((sum, c) => sum + (ilpCounts[c.id] ?? 0), 0);
    const evidenceCount = filtered.reduce((sum, c) => sum + (evidenceCounts[c.id] ?? 0), 0);
    const overdue = filtered.reduce((sum, c) => sum + (overdueCounts[c.id] ?? 0), 0);
    return { classCount, studentCount, ilpCount, evidenceCount, overdue };
  }, [filtered, studentCounts, ilpCounts, evidenceCounts, overdueCounts]);

  function ClassCard({ c }: { c: ClassRow }) {
    const isPinned = pinned.includes(c.id);
    const count = studentCounts[c.id] ?? 0;
    const ilp = ilpCounts[c.id] ?? 0;
    const evidence = evidenceCounts[c.id] ?? 0;
    const openPlans = openPlanCounts[c.id] ?? 0;
    const overdue = overdueCounts[c.id] ?? 0;

    const title = safe(c.name) || "Unnamed class";
    const year = fmtYear(c.year_level);

    const outerStyle: React.CSSProperties = {
      ...S.card,
      borderRadius: 18,
      padding: 14,
      background: isPinned ? "#f8fafc" : "#fff",
      borderColor: isPinned ? "#cbd5e1" : "#e8eaf0",
      cursor: busy ? "not-allowed" : "pointer",
      opacity: busy ? 0.6 : 1,
      outline: "none",
    };

    return (
      <div
        role="button"
        tabIndex={0}
        aria-disabled={busy}
        onClick={() => {
          if (busy) return;
          openClass(c.id);
        }}
        onKeyDown={(e) => {
          if (busy) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openClass(c.id);
          }
        }}
        style={outerStyle}
      >
        <div style={{ display: "flex", alignItems: "start", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={S.chip}>{isPinned ? "Pinned" : "Class"}</span>
              <span style={S.chip}>{year}</span>
              <span style={S.chipMuted}>{count} students</span>
              {overdue > 0 ? <span style={S.chipDanger}>{overdue} overdue</span> : null}
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: view === "gridCompact" ? 18 : 22,
                fontWeight: 950,
                color: "#0f172a",
                lineHeight: 1.15,
                wordBreak: "break-word",
              }}
            >
              {title}
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={S.chipMuted}>ILP: {ilp}</span>
              <span style={S.chipMuted}>Evidence: {evidence}</span>
              <span style={S.chipMuted}>Open plans: {openPlans}</span>
            </div>

            {view === "gridDetailed" ? (
              <div style={{ marginTop: 10, fontSize: 12, fontWeight: 850, color: "#64748b", lineHeight: 1.35 }}>
                Click to open the class hub, roster, evidence feed, and intervention tools.
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "end" }}>
            <button
              type="button"
              style={S.btn}
              onClick={(e) => {
                e.stopPropagation();
                if (busy) return;
                togglePinned(c.id);
              }}
              disabled={busy}
              title={isPinned ? "Unpin" : "Pin to top"}
            >
              {isPinned ? "Unpin" : "Pin"}
            </button>

            {view === "gridDetailed" ? (
              <button
                type="button"
                style={S.btnPrimary}
                onClick={(e) => {
                  e.stopPropagation();
                  if (busy) return;
                  openClass(c.id);
                }}
                disabled={busy}
              >
                Open →
              </button>
            ) : null}
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            style={S.btnMini}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/students?class_id=${encodeURIComponent(c.id)}`);
            }}
            disabled={busy}
          >
            Roster
          </button>

          <button
            type="button"
            style={S.btnMini}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/evidence-feed?classId=${encodeURIComponent(c.id)}`);
            }}
            disabled={busy}
          >
            Feed
          </button>

          <button
            type="button"
            style={S.btnMini}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/interventions?classId=${encodeURIComponent(c.id)}`);
            }}
            disabled={busy}
          >
            Plans
          </button>

          {count === 0 ? (
            <button
              type="button"
              style={S.btnDanger}
              onClick={(e) => {
                e.stopPropagation();
                deleteClass(c);
              }}
              disabled={busy}
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  function ListRow({ c }: { c: ClassRow }) {
    const isPinned = pinned.includes(c.id);
    const count = studentCounts[c.id] ?? 0;
    const ilp = ilpCounts[c.id] ?? 0;
    const evidence = evidenceCounts[c.id] ?? 0;
    const openPlans = openPlanCounts[c.id] ?? 0;
    const overdue = overdueCounts[c.id] ?? 0;
    const title = safe(c.name) || "Unnamed class";

    return (
      <div
        role="button"
        tabIndex={0}
        aria-disabled={busy}
        onClick={() => {
          if (busy) return;
          openClass(c.id);
        }}
        onKeyDown={(e) => {
          if (busy) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openClass(c.id);
          }
        }}
        style={{
          display: "grid",
          gridTemplateColumns: "1.35fr 0.5fr 0.8fr 0.9fr 0.95fr",
          gap: 10,
          alignItems: "center",
          padding: 12,
          borderTop: "1px solid #eef2f7",
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.6 : 1,
          background: isPinned ? "#f8fafc" : "#fff",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 950,
              color: "#0f172a",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 850, color: "#64748b" }}>
            Created: {formatDate(c.created_at)} · id: <span style={{ color: "#94a3b8" }}>{c.id.slice(0, 8)}…</span>
          </div>
        </div>

        <div>
          <span style={S.chip}>{fmtYear(c.year_level)}</span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={S.chipMuted}>{count} students</span>
          <span style={S.chipMuted}>ILP {ilp}</span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={S.chipMuted}>Evidence {evidence}</span>
          <span style={S.chipMuted}>Plans {openPlans}</span>
          {overdue > 0 ? <span style={S.chipDanger}>Overdue {overdue}</span> : null}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            style={S.btn}
            onClick={(e) => {
              e.stopPropagation();
              if (busy) return;
              togglePinned(c.id);
            }}
            disabled={busy}
          >
            {isPinned ? "Unpin" : "Pin"}
          </button>

          <button
            type="button"
            style={S.btnPrimary}
            onClick={(e) => {
              e.stopPropagation();
              if (busy) return;
              openClass(c.id);
            }}
            disabled={busy}
          >
            Open →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.subtle}>Classes</div>
          <div style={S.h1}>Class entry + launcher</div>

          <div style={{ ...S.row, marginTop: 10 }}>
            <div style={{ color: "#334155", fontSize: 14, fontWeight: 850 }}>
              Create a class, pin key classes to the top, and launch straight into each class hub.
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={S.btn} onClick={loadData} disabled={busy} title="Refresh">
                Refresh
              </button>
              <button
                style={S.btnPrimary}
                onClick={() => router.push("/admin")}
                disabled={busy}
                title="Back to admin home"
              >
                ← Admin
              </button>
            </div>
          </div>

          <div style={S.statGrid}>
            <div style={S.stat}>
              <div style={S.statLabel}>Classes</div>
              <div style={S.statValue}>{overallStats.classCount}</div>
              <div style={S.statHelp}>Visible class hubs in the current filter set.</div>
            </div>
            <div style={S.stat}>
              <div style={S.statLabel}>Students</div>
              <div style={S.statValue}>{overallStats.studentCount}</div>
              <div style={S.statHelp}>Active students across visible classes.</div>
            </div>
            <div style={S.stat}>
              <div style={S.statLabel}>ILP</div>
              <div style={S.statValue}>{overallStats.ilpCount}</div>
              <div style={S.statHelp}>Students flagged for individual support.</div>
            </div>
            <div style={S.stat}>
              <div style={S.statLabel}>Evidence</div>
              <div style={S.statValue}>{overallStats.evidenceCount}</div>
              <div style={S.statHelp}>Evidence items linked to visible classes.</div>
            </div>
            <div style={S.stat}>
              <div style={S.statLabel}>Overdue reviews</div>
              <div style={S.statValue}>{overallStats.overdue}</div>
              <div style={S.statHelp}>Open class-linked intervention reviews overdue.</div>
            </div>
          </div>

          {err ? <div style={S.alert}>{err}</div> : null}
          {msg ? <div style={S.ok}>{msg}</div> : null}
        </section>

        <section
          style={{
            ...S.card,
            marginTop: 14,
            padding: 16,
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div>
            <div style={S.subtle}>Create class</div>
            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 180px 120px", gap: 10 }}>
              <input
                style={S.input}
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Class name"
                disabled={busy}
              />
              <select
                style={S.select}
                value={newYearLevel}
                onChange={(e) => setNewYearLevel(e.target.value)}
                disabled={busy}
              >
                <option value="">Year level</option>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((y) => (
                  <option key={y} value={String(y)}>
                    {fmtYear(y)}
                  </option>
                ))}
              </select>
              <button style={S.btnPrimary} onClick={createClass} disabled={busy}>
                Create
              </button>
            </div>
            <div style={S.helper}>
              Keep naming consistent so your class hubs, roster pages, and analytics stay tidy.
            </div>
          </div>

          <div>
            <div style={S.subtle}>Filters + layout</div>
            <div
              style={{
                marginTop: 8,
                display: "grid",
                gridTemplateColumns: "1.2fr 170px 170px 170px",
                gap: 10,
              }}
            >
              <div>
                <input
                  ref={searchRef}
                  style={S.input}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search classes… press / to focus"
                  disabled={busy}
                />
                <div style={S.helper}>
                  Showing <strong>{filtered.length}</strong> of {classes.length}
                  {totalPinnedVisible ? (
                    <>
                      {" "}
                      · <strong>{totalPinnedVisible}</strong> pinned visible
                    </>
                  ) : null}
                </div>
              </div>

              <div>
                <select style={S.select} value={view} onChange={(e) => setView(e.target.value as ViewMode)} disabled={busy}>
                  <option value="gridDetailed">Grid detailed</option>
                  <option value="gridCompact">Grid compact</option>
                  <option value="list">List</option>
                </select>
                <div style={S.helper}>Hydration-safe cards.</div>
              </div>

              <div>
                <select style={S.select} value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} disabled={busy}>
                  <option value="all">All years</option>
                  {years.map((y) => (
                    <option key={y} value={String(y)}>
                      {fmtYear(y)}
                    </option>
                  ))}
                </select>
                <div style={S.helper}>Narrow by cohort.</div>
              </div>

              <div>
                <select style={S.select} value={sort} onChange={(e) => setSort(e.target.value as SortKey)} disabled={busy}>
                  <option value="year">Year → Name</option>
                  <option value="name">Name</option>
                  <option value="created">Newest</option>
                  <option value="students">Students</option>
                  <option value="evidence">Evidence</option>
                  <option value="overdue">Overdue</option>
                </select>
                <div style={S.helper}>Pinned always on top.</div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 14 }}>
          {filtered.length === 0 ? (
            <div
              style={{
                ...S.card,
                padding: 16,
                borderRadius: 18,
                borderStyle: "dashed",
                background: "#f8fafc",
                color: "#64748b",
                fontWeight: 900,
              }}
            >
              No classes match your filters. Clear search or year filter and try again.
            </div>
          ) : null}

          {view === "list" ? (
            <div style={{ ...S.card, borderRadius: 18, overflow: "hidden" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.35fr 0.5fr 0.8fr 0.9fr 0.95fr",
                  gap: 10,
                  padding: 12,
                  borderBottom: "1px solid #e8eaf0",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 950, color: "#64748b" }}>Class</div>
                <div style={{ fontSize: 12, fontWeight: 950, color: "#64748b" }}>Year</div>
                <div style={{ fontSize: 12, fontWeight: 950, color: "#64748b" }}>Roster</div>
                <div style={{ fontSize: 12, fontWeight: 950, color: "#64748b" }}>Signals</div>
                <div style={{ fontSize: 12, fontWeight: 950, color: "#64748b", textAlign: "right" }}>Actions</div>
              </div>
              {filtered.map((c) => (
                <ListRow key={c.id} c={c} />
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  view === "gridCompact"
                    ? "repeat(4, minmax(0, 1fr))"
                    : "repeat(3, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {filtered.map((c) => (
                <ClassCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </section>

        <div style={{ marginTop: 14, fontSize: 12, color: "#94a3b8", fontWeight: 850 }}>
          Shortcuts: <strong>/</strong> search · <strong>Esc</strong> clear. Empty classes can be deleted directly here.
        </div>
      </main>
    </div>
  );
}