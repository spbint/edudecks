"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type ClassRow = {
  id: string;
  name: string | null;
  year_level?: number | null;
  [k: string]: any;
};

type StudentRow = {
  id: string;
  class_id: string | null;
  first_name: string | null;
  preferred_name: string | null;
  surname?: string | null;
  family_name?: string | null;
  is_ilp?: boolean | null;
  [k: string]: any;
};

type TeacherNoteRow = {
  id: string;
  student_id: string | null;
  class_id?: string | null;
  created_at: string | null;
  updated_at?: string | null;
  note_kind?: string | null;
  title?: string | null;
  note?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function fmtYear(y: number | null | undefined) {
  return y == null ? "" : `Y${y}`;
}

function studentDisplayName(s: StudentRow | undefined) {
  if (!s) return "Student";
  const first = safe(s.preferred_name) || safe(s.first_name);
  const sur = safe(s.surname || s.family_name);
  const full = `${first}${sur ? " " + sur : ""}`.trim();
  return full || "Student";
}

function pickWhen(r: TeacherNoteRow) {
  return safe(r.updated_at) || safe(r.created_at);
}

function toDateOnly(isoOrDate: string) {
  if (!isoOrDate) return null;
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysAgo(n: number) {
  const t = new Date();
  t.setDate(t.getDate() - n);
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
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

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pickNoteKind(r: TeacherNoteRow) {
  return safe(r.note_kind) || "General";
}

function pickTitle(r: TeacherNoteRow) {
  return safe(r.title) || pickNoteKind(r) || "Teacher note";
}

function clip(text: string, max = 180) {
  const s = safe(text);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function toCsv(rows: Array<Record<string, any>>) {
  if (!rows.length) return "";
  const headers = Array.from(
    rows.reduce((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set<string>())
  );

  const esc = (v: any) => {
    const s = String(v ?? "");
    if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };

  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))];
  return lines.join("\n");
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ───────────────────────── STYLES ───────────────────────── */

const S = {
  shell: { display: "flex", minHeight: "100vh", background: "#f6f7fb" } as React.CSSProperties,
  main: { flex: 1, padding: 22, maxWidth: 1550, margin: "0 auto" } as React.CSSProperties,

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(17,24,39,0.06), rgba(99,102,241,0.08))",
    padding: 18,
  } as React.CSSProperties,

  card: { border: "1px solid #e8eaf0", borderRadius: 18, background: "#fff" } as React.CSSProperties,
  subtle: { color: "#6b7280", fontSize: 12, fontWeight: 900, letterSpacing: 0.6 } as React.CSSProperties,
  h1: { fontSize: 40, fontWeight: 950, lineHeight: 1.05, marginTop: 8, color: "#0f172a" } as React.CSSProperties,

  row: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" } as React.CSSProperties,

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

  chipWarn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #fed7aa",
    background: "#fff7ed",
    fontSize: 12,
    fontWeight: 900,
    color: "#9a3412",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  chipGood: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #bbf7d0",
    background: "#ecfdf5",
    fontSize: 12,
    fontWeight: 900,
    color: "#065f46",
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

  input: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontWeight: 900,
    background: "#fff",
    outline: "none",
    color: "#0f172a",
    width: "100%",
  } as React.CSSProperties,

  sticky: {
    marginTop: 14,
    position: "sticky",
    top: 0,
    zIndex: 4,
    paddingTop: 10,
    paddingBottom: 10,
    background: "#f6f7fb",
  } as React.CSSProperties,
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function TeacherNotesPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const classIdFromUrl = safe(sp.get("classId"));
  const studentIdFromUrl = safe(sp.get("studentId"));
  const qFromUrl = safe(sp.get("q"));
  const kindFromUrl = safe(sp.get("kind"));
  const sortFromUrl = safe(sp.get("sort")) || "latest";
  const windowFromUrl = Number(sp.get("window") || 30);
  const limitFromUrl = Number(sp.get("limit") || 200);
  const staleFromUrl = safe(sp.get("staleOnly")) === "1";

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [notes, setNotes] = useState<TeacherNoteRow[]>([]);

  const [classId, setClassId] = useState(classIdFromUrl);
  const [studentId, setStudentId] = useState(studentIdFromUrl);
  const [q, setQ] = useState(qFromUrl);
  const [noteKind, setNoteKind] = useState(kindFromUrl);
  const [sortBy, setSortBy] = useState(sortFromUrl);
  const [windowDays, setWindowDays] = useState(Number.isFinite(windowFromUrl) && windowFromUrl > 0 ? windowFromUrl : 30);
  const [limitRows, setLimitRows] = useState(Number.isFinite(limitFromUrl) && limitFromUrl > 0 ? limitFromUrl : 200);
  const [staleOnly, setStaleOnly] = useState(staleFromUrl);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  function syncUrl(
    next?: Partial<{
      classId: string;
      studentId: string;
      q: string;
      kind: string;
      sort: string;
      window: number;
      limit: number;
      staleOnly: boolean;
    }>
  ) {
    const p = new URLSearchParams();

    const c = safe(next?.classId ?? classId);
    const s = safe(next?.studentId ?? studentId);
    const qq = safe(next?.q ?? q);
    const k = safe(next?.kind ?? noteKind);
    const so = safe(next?.sort ?? sortBy) || "latest";
    const w = Number(next?.window ?? windowDays);
    const l = Number(next?.limit ?? limitRows);
    const st = Boolean(next?.staleOnly ?? staleOnly);

    if (c) p.set("classId", c);
    if (s) p.set("studentId", s);
    if (qq) p.set("q", qq);
    if (k) p.set("kind", k);
    if (so && so !== "latest") p.set("sort", so);
    if (w && w !== 30) p.set("window", String(w));
    if (l && l !== 200) p.set("limit", String(l));
    if (st) p.set("staleOnly", "1");

    router.replace(`/admin/teacher-notes${p.toString() ? `?${p.toString()}` : ""}`);
  }

  async function loadClasses() {
    const { data, error } = await supabase
      .from("classes")
      .select("id,name,year_level")
      .order("name", { ascending: true })
      .limit(5000);

    if (error) throw error;
    setClasses((data ?? []) as ClassRow[]);
  }

  async function loadStudents() {
    const baseCols = "id,class_id,first_name,preferred_name,is_ilp";
    const tries = [`${baseCols},surname`, `${baseCols},family_name`, baseCols];

    for (const sel of tries) {
      const r = await supabase.from("students").select(sel).limit(30000);
      if (!r.error) {
        setStudents((r.data ?? []) as StudentRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setStudents([]);
  }

  async function loadTeacherNotes() {
    const baseSelect = "id,student_id,class_id,created_at,updated_at,note_kind,title,note,is_deleted";
    const fallbackSelect = "id,student_id,class_id,created_at,updated_at,note_kind,note,is_deleted";
    const fallbackSelect2 = "id,student_id,class_id,created_at,note_kind,note";

    const tries = [baseSelect, fallbackSelect, fallbackSelect2];

    for (const sel of tries) {
      const r = await supabase
        .from("teacher_notes")
        .select(sel)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50000);

      if (!r.error) {
        const raw = (r.data ?? []) as TeacherNoteRow[];
        setNotes(raw.filter((x) => !x.is_deleted));
        return;
      }

      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setNotes([]);
  }

  async function loadAll() {
    setBusy(true);
    setErr(null);

    try {
      await Promise.all([loadClasses(), loadStudents(), loadTeacherNotes()]);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load teacher notes.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const studentsById = useMemo(() => {
    const m: Record<string, StudentRow> = {};
    for (const s of students) m[s.id] = s;
    return m;
  }, [students]);

  const classById = useMemo(() => {
    const m: Record<string, ClassRow> = {};
    for (const c of classes) m[c.id] = c;
    return m;
  }, [classes]);

  const studentOptions = useMemo(() => {
    return students
      .filter((s) => !classId || s.class_id === classId)
      .sort((a, b) => studentDisplayName(a).localeCompare(studentDisplayName(b)));
  }, [students, classId]);

  const noteKindOptions = useMemo(() => {
    const set = new Set<string>();
    for (const n of notes) set.add(pickNoteKind(n));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [notes]);

  const latestByStudent = useMemo(() => {
    const m = new Map<string, Date>();
    for (const n of notes) {
      const sid = safe(n.student_id);
      if (!sid) continue;
      const d = toDateOnly(pickWhen(n));
      if (!d) continue;
      const prev = m.get(sid);
      if (!prev || d.getTime() > prev.getTime()) m.set(sid, d);
    }
    return m;
  }, [notes]);

  const staleStudents = useMemo(() => {
    const cutoff = daysAgo(21);
    return students.filter((s) => {
      if (classId && s.class_id !== classId) return false;
      const d = latestByStudent.get(s.id);
      return !d || d < cutoff;
    });
  }, [students, latestByStudent, classId]);

  const filtered = useMemo(() => {
    const cutoff = daysAgo(windowDays);
    const qq = q.trim().toLowerCase();

    const list = notes.filter((n) => {
      const id = safe(n.id);
      if (!id) return false;

      const d0 = toDateOnly(pickWhen(n));
      if (!d0) return false;
      if (d0 < cutoff) return false;

      if (classId && safe(n.class_id) && safe(n.class_id) !== classId) return false;
      if (studentId && safe(n.student_id) !== studentId) return false;
      if (noteKind && pickNoteKind(n) !== noteKind) return false;

      if (classId && !safe(n.class_id)) {
        const sid = safe(n.student_id);
        const stu = studentsById[sid];
        if (stu && safe(stu.class_id) !== classId) return false;
      }

      if (staleOnly) {
        const sid = safe(n.student_id);
        if (!sid) return false;
        const latest = latestByStudent.get(sid);
        if (!latest || latest >= daysAgo(21)) return false;
      }

      if (qq) {
        const sid = safe(n.student_id);
        const stu = studentsById[sid];
        const studentName = studentDisplayName(stu).toLowerCase();
        const title = pickTitle(n).toLowerCase();
        const body = safe(n.note).toLowerCase();
        const kind = pickNoteKind(n).toLowerCase();

        if (
          !studentName.includes(qq) &&
          !title.includes(qq) &&
          !body.includes(qq) &&
          !kind.includes(qq) &&
          !id.toLowerCase().includes(qq)
        ) {
          return false;
        }
      }

      return true;
    });

    list.sort((a, b) => {
      const aWhen = new Date(pickWhen(a)).getTime() || 0;
      const bWhen = new Date(pickWhen(b)).getTime() || 0;

      if (sortBy === "latest") return bWhen - aWhen;
      if (sortBy === "oldest") return aWhen - bWhen;

      if (sortBy === "student_az") {
        const an = studentDisplayName(studentsById[safe(a.student_id)]).toLowerCase();
        const bn = studentDisplayName(studentsById[safe(b.student_id)]).toLowerCase();
        return an.localeCompare(bn) || bWhen - aWhen;
      }

      if (sortBy === "kind_az") {
        const ak = pickNoteKind(a).toLowerCase();
        const bk = pickNoteKind(b).toLowerCase();
        return ak.localeCompare(bk) || bWhen - aWhen;
      }

      return bWhen - aWhen;
    });

    return list.slice(0, Math.max(1, limitRows));
  }, [
    notes,
    windowDays,
    classId,
    studentId,
    noteKind,
    q,
    studentsById,
    limitRows,
    sortBy,
    staleOnly,
    latestByStudent,
  ]);

  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const uniqStudents = new Set<string>();
    const uniqKinds = new Set<string>();

    for (const n of filtered) {
      const sid = safe(n.student_id);
      if (sid) uniqStudents.add(sid);
      uniqKinds.add(pickNoteKind(n));
    }

    return {
      total,
      uniqStudents: uniqStudents.size,
      uniqKinds: uniqKinds.size,
      selected: selectedIds.length,
    };
  }, [filtered, selectedIds.length]);

  const feedStats = useMemo(() => {
    const within = (days: number) => {
      const cutoff = daysAgo(days);
      return notes.filter((n) => {
        const d = toDateOnly(pickWhen(n));
        return !!d && d >= cutoff;
      }).length;
    };

    const countByKind = new Map<string, number>();
    for (const n of notes) {
      const kind = pickNoteKind(n);
      countByKind.set(kind, (countByKind.get(kind) ?? 0) + 1);
    }

    let topKind = "—";
    let topKindCount = 0;
    for (const [k, v] of countByKind.entries()) {
      if (v > topKindCount) {
        topKind = k;
        topKindCount = v;
      }
    }

    return {
      last7: within(7),
      last21: within(21),
      staleStudents: staleStudents.length,
      topKind,
      topKindCount,
    };
  }, [notes, staleStudents]);

  function toggleExpand(id: string) {
    setExpanded((m) => ({ ...m, [id]: !m[id] }));
  }

  function toggleSelect(id: string) {
    setSelected((m) => ({ ...m, [id]: !m[id] }));
  }

  function selectAllVisible(on: boolean) {
    const next: Record<string, boolean> = { ...selected };
    for (const n of filtered) {
      const id = safe(n.id);
      if (!id) continue;
      next[id] = on;
    }
    setSelected(next);
  }

  function clearSelection() {
    setSelected({});
  }

  function exportSelectedCsv() {
    const rows = filtered
      .filter((n) => selected[safe(n.id)])
      .map((n) => {
        const sid = safe(n.student_id);
        const stu = studentsById[sid];
        const cls = classById[safe(n.class_id || stu?.class_id)];
        return {
          id: safe(n.id),
          created_at: safe(n.created_at),
          updated_at: safe(n.updated_at),
          class_id: safe(n.class_id) || safe(stu?.class_id),
          class_name: safe(cls?.name),
          student_id: sid,
          student_name: studentDisplayName(stu),
          note_kind: pickNoteKind(n),
          title: pickTitle(n),
          note: safe(n.note),
        };
      });

    const csv = toCsv(rows);
    downloadText(`teacher-notes-selected-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  async function copySelectedIds() {
    const ids = selectedIds.join("\n");
    try {
      await navigator.clipboard.writeText(ids);
    } catch {
      window.prompt("Copy these IDs:", ids);
    }
  }

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.subtle}>TEACHER NOTES</div>
          <div style={S.h1}>Teacher Notes</div>

          <div style={{ ...S.row, marginTop: 10 }}>
            <span style={S.chipGood}>Notes 7d: {feedStats.last7}</span>
            <span style={S.chip}>Notes 21d: {feedStats.last21}</span>
            <span style={feedStats.staleStudents > 0 ? S.chipWarn : S.chipGood}>
              Students stale 21+d: {feedStats.staleStudents}
            </span>
            <span style={S.chip}>
              Top type: {feedStats.topKind} {feedStats.topKindCount > 0 ? `(${feedStats.topKindCount})` : ""}
            </span>

            <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={S.btn} onClick={loadAll} disabled={busy}>
                Refresh
              </button>
              <button style={S.btn} onClick={() => router.push("/admin/evidence-feed")} disabled={busy}>
                Evidence feed →
              </button>
              <button
                style={S.btnPrimary}
                onClick={() =>
                  router.push(
                    `/admin/teacher-notes-entry${
                      studentId || classId
                        ? `?${new URLSearchParams({
                            ...(classId ? { classId } : {}),
                            ...(studentId ? { studentId } : {}),
                          }).toString()}`
                        : ""
                    }`
                  )
                }
                disabled={busy}
              >
                + New note
              </button>
            </div>
          </div>

          {err ? (
            <div
              style={{
                marginTop: 12,
                borderRadius: 14,
                border: "1px solid #fecaca",
                background: "#fff1f2",
                padding: 12,
                color: "#9f1239",
                fontWeight: 900,
              }}
            >
              {err}
            </div>
          ) : null}
        </section>

        <section
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {[
            { label: "VISIBLE ROWS", value: stats.total, hint: "After filters" },
            { label: "STUDENTS", value: stats.uniqStudents, hint: "Represented in current feed" },
            { label: "NOTE TYPES", value: stats.uniqKinds, hint: "Across filtered results" },
            { label: "SELECTED", value: stats.selected, hint: "Ready for bulk export" },
          ].map((x) => (
            <div key={x.label} style={{ ...S.card, padding: 14 }}>
              <div style={S.subtle}>{x.label}</div>
              <div style={{ marginTop: 6, fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{x.value}</div>
              <div style={{ marginTop: 6, color: "#64748b", fontWeight: 800, fontSize: 12 }}>{x.hint}</div>
            </div>
          ))}
        </section>

        <div style={S.sticky}>
          <div style={{ ...S.card, padding: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr 1fr 1fr",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div>
                <div style={S.subtle}>SEARCH</div>
                <input
                  style={S.input}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    syncUrl({ q: e.target.value });
                  }}
                  placeholder="Student, title, note, type, id…"
                  disabled={busy}
                />
              </div>

              <div>
                <div style={S.subtle}>CLASS</div>
                <select
                  style={S.input}
                  value={classId}
                  onChange={(e) => {
                    const next = e.target.value;
                    setClassId(next);
                    if (studentId) setStudentId("");
                    syncUrl({ classId: next, studentId: "" });
                  }}
                  disabled={busy}
                >
                  <option value="">All classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {safe(c.name) || "Class"} {fmtYear(c.year_level)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={S.subtle}>STUDENT</div>
                <select
                  style={S.input}
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    syncUrl({ studentId: e.target.value });
                  }}
                  disabled={busy}
                >
                  <option value="">All students</option>
                  {studentOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {studentDisplayName(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={S.subtle}>NOTE TYPE</div>
                <select
                  style={S.input}
                  value={noteKind}
                  onChange={(e) => {
                    setNoteKind(e.target.value);
                    syncUrl({ kind: e.target.value });
                  }}
                  disabled={busy}
                >
                  <option value="">All types</option>
                  {noteKindOptions.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={S.subtle}>WINDOW</div>
                <select
                  style={S.input}
                  value={String(windowDays)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setWindowDays(v);
                    syncUrl({ window: v });
                  }}
                  disabled={busy}
                >
                  <option value="7">Last 7 days</option>
                  <option value="14">Last 14 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="60">Last 60 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>

              <div>
                <div style={S.subtle}>SORT</div>
                <select
                  style={S.input}
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    syncUrl({ sort: e.target.value });
                  }}
                  disabled={busy}
                >
                  <option value="latest">Latest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="student_az">Student A–Z</option>
                  <option value="kind_az">Type A–Z</option>
                </select>
              </div>

              <div>
                <div style={S.subtle}>LIMIT</div>
                <select
                  style={S.input}
                  value={String(limitRows)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setLimitRows(v);
                    syncUrl({ limit: v });
                  }}
                  disabled={busy}
                >
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="500">500</option>
                  <option value="1000">1000</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                style={staleOnly ? S.btnPrimary : S.btn}
                onClick={() => {
                  const next = !staleOnly;
                  setStaleOnly(next);
                  syncUrl({ staleOnly: next });
                }}
                disabled={busy}
              >
                {staleOnly ? "Stale only ON" : "Show stale students only"}
              </button>

              <button style={S.btn} onClick={() => selectAllVisible(true)} disabled={busy || filtered.length === 0}>
                Select visible
              </button>
              <button style={S.btn} onClick={() => selectAllVisible(false)} disabled={busy || filtered.length === 0}>
                Deselect visible
              </button>
              <button style={S.btn} onClick={clearSelection} disabled={busy || selectedIds.length === 0}>
                Clear selection
              </button>

              <span style={{ ...S.chip, marginLeft: 6 }}>Bulk actions</span>

              <button style={S.btnPrimary} onClick={exportSelectedCsv} disabled={busy || selectedIds.length === 0}>
                Export selected CSV
              </button>

              <button style={S.btn} onClick={copySelectedIds} disabled={busy || selectedIds.length === 0}>
                Copy selected IDs
              </button>

              <button
                style={S.btn}
                onClick={() => {
                  setClassId("");
                  setStudentId("");
                  setQ("");
                  setNoteKind("");
                  setSortBy("latest");
                  setWindowDays(30);
                  setLimitRows(200);
                  setStaleOnly(false);
                  setSelected({});
                  router.replace("/admin/teacher-notes");
                }}
                disabled={busy}
              >
                Reset filters
              </button>
            </div>
          </div>
        </div>

        {staleStudents.length > 0 ? (
          <section style={{ marginTop: 14 }}>
            <div style={{ ...S.card, padding: 14 }}>
              <div style={S.subtle}>STUDENTS NEEDING A FRESH NOTE</div>
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {staleStudents.slice(0, 20).map((s) => {
                  const latest = latestByStudent.get(s.id);
                  const label = latest
                    ? `${studentDisplayName(s)} • ${formatDate(latest.toISOString())}`
                    : `${studentDisplayName(s)} • none yet`;

                  return (
                    <button
                      key={s.id}
                      style={latest ? S.btn : S.btnPrimary}
                      onClick={() =>
                        router.push(
                          `/admin/teacher-notes-entry?studentId=${encodeURIComponent(s.id)}&classId=${encodeURIComponent(
                            s.class_id || ""
                          )}`
                        )
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        <section style={{ marginTop: 14 }}>
          <div style={{ ...S.card, padding: 0 }}>
            <div
              style={{
                padding: 14,
                borderBottom: "1px solid #eef2f7",
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={S.subtle}>LATEST NOTES</div>
              <span style={S.chip}>Tip: click a row to expand details</span>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: 14, color: "#64748b", fontWeight: 900 }}>
                No teacher notes match your filters.
              </div>
            ) : null}

            {filtered.map((n) => {
              const id = safe(n.id);
              const sid = safe(n.student_id);
              const stu = studentsById[sid];
              const cls = classById[safe(n.class_id || stu?.class_id)];
              const name = studentDisplayName(stu);

              const when = pickWhen(n);
              const kind = pickNoteKind(n);
              const title = pickTitle(n);
              const expandedOn = !!expanded[id];
              const checked = !!selected[id];

              const lastForStudent = latestByStudent.get(sid);
              const stale = lastForStudent ? lastForStudent < daysAgo(21) : true;

              return (
                <div key={id} style={{ borderBottom: "1px solid #eef2f7" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "44px 1.35fr 0.95fr 0.8fr 140px 120px",
                      gap: 10,
                      padding: 12,
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => toggleExpand(id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div onClick={(ev) => ev.stopPropagation()}>
                      <input type="checkbox" checked={checked} onChange={() => toggleSelect(id)} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 950,
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {title}
                      </div>
                      <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={S.chip}>{kind}</span>
                        <span style={S.chip}>{formatDateTime(when)}</span>
                        {stale ? <span style={S.chipWarn}>Student stale 21+d</span> : null}
                      </div>
                      {safe(n.note) ? (
                        <div style={{ marginTop: 6, color: "#64748b", fontWeight: 800, fontSize: 12 }}>
                          {clip(safe(n.note), 120)}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={S.subtle}>STUDENT</div>
                      <div
                        style={{
                          fontWeight: 900,
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {name}
                      </div>
                      {stu?.is_ilp ? (
                        <div style={{ marginTop: 4 }}>
                          <span style={S.chip}>ILP</span>
                        </div>
                      ) : null}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={S.subtle}>CLASS</div>
                      <div style={{ fontWeight: 900, color: "#0f172a" }}>
                        {safe(cls?.name) || "—"} {cls?.year_level != null ? fmtYear(cls.year_level) : ""}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }} onClick={(ev) => ev.stopPropagation()}>
                      <button style={S.btn} onClick={() => router.push(`/admin/students/${sid}?tab=timeline`)} disabled={!sid}>
                        Profile →
                      </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <span style={S.chip}>{expandedOn ? "Hide" : "Expand"}</span>
                    </div>
                  </div>

                  {expandedOn ? (
                    <div style={{ padding: 12, background: "#fafbff" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
                        <div style={{ ...S.card, padding: 12 }}>
                          <div style={S.subtle}>NOTE</div>
                          <div style={{ marginTop: 8, fontWeight: 950, color: "#0f172a" }}>{title}</div>

                          <div style={{ marginTop: 10 }}>
                            <div style={S.subtle}>CONTENT</div>
                            <div style={{ marginTop: 6, fontWeight: 850, color: "#334155", whiteSpace: "pre-wrap" }}>
                              {safe(n.note) || "—"}
                            </div>
                          </div>
                        </div>

                        <div style={{ ...S.card, padding: 12 }}>
                          <div style={S.subtle}>METADATA</div>
                          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <span style={S.chip}>ID: {id.slice(0, 8)}…</span>
                              <span style={S.chip}>Kind: {kind}</span>
                            </div>

                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <span style={S.chip}>Created: {safe(n.created_at) || "—"}</span>
                              <span style={S.chip}>Updated: {safe(n.updated_at) || "—"}</span>
                            </div>

                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <span style={S.chip}>Student: {name}</span>
                              <span style={S.chip}>
                                Last note for student: {lastForStudent ? formatDate(lastForStudent.toISOString()) : "none"}
                              </span>
                            </div>

                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <button style={S.btnPrimary} onClick={() => router.push(`/admin/teacher-notes-entry?edit=${id}`)}>
                                Edit note →
                              </button>

                              {sid ? (
                                <button style={S.btn} onClick={() => router.push(`/admin/teacher-notes-entry?studentId=${sid}`)}>
                                  New for student →
                                </button>
                              ) : null}

                              {sid ? (
                                <button
                                  style={S.btn}
                                  onClick={() =>
                                    router.push(
                                      `/admin/interventions-entry?studentId=${sid}&classId=${encodeURIComponent(
                                        safe(stu?.class_id)
                                      )}`
                                    )
                                  }
                                >
                                  Create intervention →
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section style={{ marginTop: 14 }}>
          <div style={{ ...S.card, padding: 14 }}>
            <div style={S.subtle}>NOTE TYPE BREAKDOWN (CURRENT FILTERS)</div>
            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {Array.from(
                filtered.reduce((m, n) => {
                  const kind = pickNoteKind(n);
                  m.set(kind, (m.get(kind) ?? 0) + 1);
                  return m;
                }, new Map<string, number>())
              )
                .sort((a, b) => b[1] - a[1])
                .map(([kind, count]) => (
                  <button
                    key={kind}
                    style={noteKind === kind ? S.btnPrimary : S.btn}
                    onClick={() => {
                      const next = noteKind === kind ? "" : kind;
                      setNoteKind(next);
                      syncUrl({ kind: next });
                    }}
                  >
                    {kind}: {count}
                  </button>
                ))}

              {filtered.length === 0 ? (
                <span style={{ color: "#64748b", fontWeight: 900 }}>No data in current filter.</span>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}