"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type StudentRow = {
  id: string;
  class_id: string | null;
  first_name: string | null;
  preferred_name: string | null;
  surname?: string | null;
  family_name?: string | null;
  is_ilp?: boolean | null;
};

type ClassRow = {
  id: string;
  name: string | null;
  year_level?: number | null;
};

type TeacherNoteRow = {
  id: string;
  student_id: string | null;
  class_id: string | null;
  created_at: string | null;
  updated_at?: string | null;
  note_kind?: string | null;
  title?: string | null;
  note?: string | null;
  is_deleted?: boolean | null;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function studentName(s: StudentRow | undefined) {
  if (!s) return "Student";
  const first = safe(s.preferred_name) || safe(s.first_name);
  const sur = safe(s.surname || s.family_name);
  const out = `${first}${sur ? " " + sur : ""}`.trim();
  return out || "Student";
}

function classLabel(c: ClassRow | undefined) {
  if (!c) return "Class";
  return `${safe(c.name) || "Class"}${c.year_level ? ` Y${c.year_level}` : ""}`.trim();
}

function isoShort(d: string | null | undefined) {
  if (!d) return "—";
  try {
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return String(d).slice(0, 10);
    return x.toISOString().slice(0, 10);
  } catch {
    return String(d).slice(0, 10);
  }
}

function clip(text: string, max = 180) {
  const s = safe(text);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

function csvEscape(value: string) {
  const s = safe(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, any>[]) {
  if (!rows.length) return "";
  const headerSet = rows.reduce<Set<string>>((s, r) => {
    Object.keys(r).forEach((k) => s.add(k));
    return s;
  }, new Set<string>());

  const headers = Array.from(headerSet);
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) =>
      headers.map((h) => csvEscape(String(row[h] ?? ""))).join(",")
    ),
  ];

  return "\ufeff" + lines.join("\n");
}

function downloadCsv(filename: string, rows: Record<string, any>[]) {
  const csv = toCsv(rows);
  if (!csv) return;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

/* ───────────────────────── STYLES ───────────────────────── */

const S = {
  shell: { display: "flex", minHeight: "100vh", background: "#f6f7fb" } as React.CSSProperties,
  main: { flex: 1, padding: 24, maxWidth: 1400, margin: "0 auto", width: "100%" } as React.CSSProperties,

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(17,24,39,0.06), rgba(99,102,241,0.08))",
    padding: 18,
  } as React.CSSProperties,

  h1: { fontSize: 34, fontWeight: 950, margin: 0, color: "#0f172a", lineHeight: 1.05 } as React.CSSProperties,
  sub: { marginTop: 8, color: "#475569", fontWeight: 800, fontSize: 13 } as React.CSSProperties,
  subtle: { color: "#6b7280", fontSize: 12, fontWeight: 900, letterSpacing: 0.6 } as React.CSSProperties,

  card: {
    border: "1px solid #e8eaf0",
    borderRadius: 18,
    background: "#fff",
    padding: 16,
  } as React.CSSProperties,

  row: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap" as const,
    alignItems: "center",
  } as React.CSSProperties,

  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  } as React.CSSProperties,

  row4: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: 12,
  } as React.CSSProperties,

  label: {
    display: "block",
    fontWeight: 950,
    color: "#0f172a",
    marginBottom: 6,
    fontSize: 13,
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontWeight: 800,
    color: "#0f172a",
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
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  err: {
    marginTop: 10,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    padding: 12,
    borderRadius: 14,
    color: "#9f1239",
    fontWeight: 900,
  } as React.CSSProperties,

  ok: {
    marginTop: 10,
    border: "1px solid #bbf7d0",
    background: "#ecfdf5",
    padding: 12,
    borderRadius: 14,
    color: "#065f46",
    fontWeight: 900,
  } as React.CSSProperties,

  btn: {
    padding: "12px 16px",
    fontWeight: 900,
    background: "#e5e7eb",
    color: "#0f172a",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    cursor: "pointer",
  } as React.CSSProperties,

  btnPrimary: {
    padding: "12px 16px",
    fontWeight: 950,
    background: "#111827",
    color: "#fff",
    borderRadius: 12,
    border: "1px solid #111827",
    cursor: "pointer",
  } as React.CSSProperties,

  btnDanger: {
    padding: "10px 12px",
    fontWeight: 900,
    background: "#fff1f2",
    color: "#9f1239",
    borderRadius: 10,
    border: "1px solid #fecaca",
    cursor: "pointer",
  } as React.CSSProperties,

  tableWrap: {
    border: "1px solid #e8eaf0",
    borderRadius: 16,
    overflow: "hidden",
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  } as React.CSSProperties,

  th: {
    textAlign: "left" as const,
    fontSize: 12,
    fontWeight: 950,
    color: "#64748b",
    padding: 12,
    borderBottom: "1px solid #e8eaf0",
    background: "#fbfcff",
  } as React.CSSProperties,

  td: {
    padding: 12,
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "top" as const,
  } as React.CSSProperties,
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function TeacherNotesPage() {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [notes, setNotes] = useState<TeacherNoteRow[]>([]);

  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [noteKind, setNoteKind] = useState("");
  const [query, setQuery] = useState("");

  async function loadStudents() {
    const base = "id,class_id,first_name,preferred_name,is_ilp";
    const tries = [`${base},surname`, `${base},family_name`, base];

    for (const sel of tries) {
      const { data, error } = await supabase
        .from("students")
        .select(sel)
        .order("first_name", { ascending: true })
        .limit(50000);

      if (!error) {
        setStudents(((data ?? []) as unknown) as StudentRow[]);
        return;
      }
      if (!isMissingColumnError(error)) throw error;
    }

    setStudents([]);
  }

  async function loadClasses() {
    const { data, error } = await supabase
      .from("classes")
      .select("id,name,year_level")
      .order("name", { ascending: true })
      .limit(5000);

    if (error) throw error;
    setClasses(((data ?? []) as unknown) as ClassRow[]);
  }

  async function loadNotes() {
    const tries = [
      "id,student_id,class_id,created_at,updated_at,note_kind,title,note,is_deleted",
      "id,student_id,class_id,created_at,updated_at,note_kind,note,is_deleted",
      "id,student_id,class_id,created_at,note_kind,note,is_deleted",
      "id,student_id,class_id,created_at,note_kind,note",
    ];

    for (const sel of tries) {
      const { data, error } = await supabase
        .from("teacher_notes")
        .select(sel)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1000);

      if (!error) {
        const rows = (((data ?? []) as unknown) as TeacherNoteRow[]).filter(
          (x) => !x.is_deleted
        );
        setNotes(rows);
        return;
      }

      if (!isMissingColumnError(error)) throw error;
    }

    setNotes([]);
  }

  async function loadAll() {
    setBusy(true);
    setErr(null);
    setOkMsg(null);

    try {
      await Promise.all([loadStudents(), loadClasses(), loadNotes()]);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load notes.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const studentById = useMemo(() => {
    const map = new Map<string, StudentRow>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const classById = useMemo(() => {
    const map = new Map<string, ClassRow>();
    classes.forEach((c) => map.set(c.id, c));
    return map;
  }, [classes]);

  const filteredNotes = useMemo(() => {
    const q = safe(query).toLowerCase();

    return notes.filter((n) => {
      if (studentId && n.student_id !== studentId) return false;
      if (classId && n.class_id !== classId) return false;
      if (noteKind && safe(n.note_kind).toLowerCase() !== safe(noteKind).toLowerCase()) return false;

      if (!q) return true;

      const student = n.student_id ? studentById.get(n.student_id) : undefined;
      const klass = n.class_id ? classById.get(n.class_id) : undefined;

      const hay = [
        safe(n.note_kind),
        safe(n.title),
        safe(n.note),
        studentName(student),
        classLabel(klass),
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [notes, studentId, classId, noteKind, query, studentById, classById]);

  const exportRows = useMemo(() => {
    return filteredNotes.map((n) => {
      const student = n.student_id ? studentById.get(n.student_id) : undefined;
      const klass = n.class_id ? classById.get(n.class_id) : undefined;

      return {
        Date: isoShort(n.updated_at ?? n.created_at ?? null),
        Type: safe(n.note_kind) || "General",
        Title: safe(n.title),
        Note: safe(n.note),
        Student: studentName(student),
        Class: classLabel(klass),
        StudentId: safe(n.student_id),
        ClassId: safe(n.class_id),
        NoteId: safe(n.id),
      };
    });
  }, [filteredNotes, studentById, classById]);

  async function softDelete(noteId: string) {
    const ok = confirm("Delete this teacher note?\n\nThis will hide it from the list.");
    if (!ok) return;

    setBusy(true);
    setErr(null);
    setOkMsg(null);

    try {
      const { error } = await supabase
        .from("teacher_notes")
        .update({ is_deleted: true })
        .eq("id", noteId);

      if (error) throw error;

      setOkMsg("Note deleted.");
      setNotes((prev) => prev.filter((x) => x.id !== noteId));
      setTimeout(() => setOkMsg(null), 1200);
    } catch (e: any) {
      setErr(e?.message ?? "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.subtle}>TEACHER NOTES</div>
          <h1 style={S.h1}>Teacher notes</h1>
          <div style={S.sub}>
            Search, review, export, and manage teacher notes across students and classes.
            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={S.chip}>Notes: {filteredNotes.length}</span>
              <span style={S.chip}>Students: {students.length}</span>
              <span style={S.chip}>Classes: {classes.length}</span>

              <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={S.btn} onClick={loadAll} disabled={busy}>
                  Refresh
                </button>
                <button
                  style={S.btnPrimary}
                  onClick={() => router.push("/admin/teacher-notes-entry")}
                  disabled={busy}
                >
                  New note
                </button>
              </div>
            </div>
          </div>

          {err ? <div style={S.err}>{err}</div> : null}
          {okMsg ? <div style={S.ok}>{okMsg}</div> : null}
        </section>

        <section style={{ ...S.card, marginTop: 14 }}>
          <div style={S.row4}>
            <div>
              <label style={S.label}>Class</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} style={S.input}>
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {safe(c.name) || "Class"} {c.year_level ? `Y${c.year_level}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={S.label}>Student</label>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={S.input}>
                <option value="">All students</option>
                {students
                  .filter((s) => !classId || s.class_id === classId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {studentName(s)}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label style={S.label}>Type</label>
              <input
                value={noteKind}
                onChange={(e) => setNoteKind(e.target.value)}
                placeholder="e.g. Behaviour"
                style={S.input}
              />
            </div>

            <div>
              <label style={S.label}>Search</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Title, note, student…"
                style={S.input}
              />
            </div>
          </div>

          <div style={{ ...S.row, marginTop: 14 }}>
            <button
              style={S.btn}
              onClick={() => {
                setStudentId("");
                setClassId("");
                setNoteKind("");
                setQuery("");
              }}
            >
              Clear filters
            </button>

            <button
              style={S.btn}
              onClick={() => {
                if (!exportRows.length) {
                  setErr("No rows to export.");
                  return;
                }
                downloadCsv(
                  `teacher_notes_${new Date().toISOString().slice(0, 10)}.csv`,
                  exportRows
                );
                setOkMsg("CSV exported.");
                setTimeout(() => setOkMsg(null), 1200);
              }}
            >
              Export CSV
            </button>
          </div>
        </section>

        <section style={{ ...S.card, marginTop: 14 }}>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Type</th>
                  <th style={S.th}>Student</th>
                  <th style={S.th}>Class</th>
                  <th style={S.th}>Title / Note</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotes.map((n) => {
                  const student = n.student_id ? studentById.get(n.student_id) : undefined;
                  const klass = n.class_id ? classById.get(n.class_id) : undefined;

                  return (
                    <tr key={n.id}>
                      <td style={S.td}>
                        <span style={S.chip}>{isoShort(n.updated_at ?? n.created_at ?? null)}</span>
                      </td>

                      <td style={S.td}>
                        <span style={S.chip}>{safe(n.note_kind) || "General"}</span>
                      </td>

                      <td style={S.td}>
                        <div style={{ fontWeight: 900, color: "#0f172a" }}>
                          {studentName(student)}
                        </div>
                        {student?.is_ilp ? <div style={{ marginTop: 6 }}><span style={S.chip}>ILP</span></div> : null}
                      </td>

                      <td style={S.td}>
                        <div style={{ fontWeight: 900, color: "#0f172a" }}>
                          {classLabel(klass)}
                        </div>
                      </td>

                      <td style={S.td}>
                        <div style={{ color: "#0f172a", fontWeight: 950, lineHeight: 1.25 }}>
                          {safe(n.title) || safe(n.note_kind) || "Teacher note"}
                        </div>

                        {safe(n.note) ? (
                          <div
                            style={{
                              marginTop: 6,
                              color: "#334155",
                              fontWeight: 800,
                              lineHeight: 1.35,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {clip(safe(n.note), 280)}
                          </div>
                        ) : (
                          <div style={{ marginTop: 6, color: "#64748b", fontWeight: 800 }}>—</div>
                        )}

                        <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8", fontWeight: 800 }}>
                          ID: <span style={{ fontFamily: "monospace" }}>{String(n.id).slice(0, 8)}…</span>
                        </div>
                      </td>

                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            style={S.btn}
                            disabled={busy}
                            onClick={() =>
                              router.push(
                                `/admin/teacher-notes-entry?studentId=${safe(n.student_id)}&edit=${n.id}`
                              )
                            }
                          >
                            Edit
                          </button>

                          {n.student_id ? (
                            <button
                              style={S.btn}
                              disabled={busy}
                              onClick={() =>
                                router.push(`/admin/students/${n.student_id}?tab=timeline`)
                              }
                            >
                              Student →
                            </button>
                          ) : null}

                          <button
                            style={S.btnDanger}
                            disabled={busy}
                            onClick={() => softDelete(n.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredNotes.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...S.td, padding: 16, color: "#64748b", fontWeight: 900 }}>
                      No teacher notes match the current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}