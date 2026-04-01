"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function toDateInputValue(v: string | null | undefined) {
  if (!v) return "";
  return String(v).slice(0, 10);
}

function todayDateInputValue() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

function clip(text: string, max = 180) {
  const s = safe(text);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/* ───────────────────────── STYLES ───────────────────────── */

const S = {
  shell: { display: "flex", minHeight: "100vh", background: "#f6f7fb" } as React.CSSProperties,
  main: { flex: 1, padding: 24, maxWidth: 1280, margin: "0 auto" } as React.CSSProperties,

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(17,24,39,0.06), rgba(99,102,241,0.08))",
    padding: 18,
  } as React.CSSProperties,

  h1: { fontSize: 34, fontWeight: 950, margin: 0, color: "#0f172a", lineHeight: 1.05 } as React.CSSProperties,
  sub: { marginTop: 8, color: "#475569", fontWeight: 800, fontSize: 13 } as React.CSSProperties,

  card: { border: "1px solid #e8eaf0", borderRadius: 18, background: "#fff" } as React.CSSProperties,
  subtle: { color: "#6b7280", fontSize: 12, fontWeight: 900, letterSpacing: 0.6 } as React.CSSProperties,

  grid: { marginTop: 14, display: "grid", gap: 14 } as React.CSSProperties,
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as React.CSSProperties,

  label: { display: "block", fontWeight: 950, color: "#0f172a", marginBottom: 6 } as React.CSSProperties,

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

  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontWeight: 800,
    color: "#0f172a",
    background: "#fff",
    lineHeight: 1.35,
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

  actions: { display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" } as React.CSSProperties,

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
    padding: "12px 16px",
    fontWeight: 950,
    background: "#fff1f2",
    color: "#9f1239",
    borderRadius: 12,
    border: "1px solid #fecaca",
    cursor: "pointer",
  } as React.CSSProperties,

  tableWrap: { border: "1px solid #e8eaf0", borderRadius: 16, overflow: "hidden" } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" as const } as React.CSSProperties,
  th: {
    textAlign: "left",
    fontSize: 12,
    fontWeight: 950,
    color: "#64748b",
    padding: 12,
    borderBottom: "1px solid #e8eaf0",
    background: "#fbfcff",
  } as React.CSSProperties,
  td: { padding: 12, borderBottom: "1px solid #eef2f7", verticalAlign: "top" } as React.CSSProperties,
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function TeacherNotesEntryPage() {
  const router = useRouter();
  const params = useSearchParams();

  const studentIdParam = params.get("studentId");
  const classIdParam = params.get("classId");
  const editId = params.get("edit");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);

  const [studentId, setStudentId] = useState<string>(studentIdParam ?? "");
  const [classId, setClassId] = useState<string>(classIdParam ?? "");

  const [noteKind, setNoteKind] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [noteDate, setNoteDate] = useState("");

  const [latest, setLatest] = useState<TeacherNoteRow[]>([]);

  const selectedStudent = useMemo(() => students.find((s) => s.id === studentId), [students, studentId]);
  const selectedClass = useMemo(() => classes.find((c) => c.id === classId), [classes, classId]);

  const noteTemplates = useMemo(
    () => [
      {
        label: "Learning observation",
        kind: "Learning",
        title: "Learning observation",
        body: "Observed during:\nStrengths shown:\nSupport needed:\nNext step:\n",
      },
      {
        label: "Wellbeing check-in",
        kind: "Wellbeing",
        title: "Wellbeing check-in",
        body: "Student presentation:\nTriggers/context:\nSupport provided:\nFollow-up:\n",
      },
      {
        label: "Parent contact",
        kind: "Parent contact",
        title: "Parent communication",
        body: "Who was contacted:\nReason:\nSummary of discussion:\nAgreed next steps:\n",
      },
      {
        label: "Behaviour incident",
        kind: "Behaviour",
        title: "Behaviour incident / response",
        body: "What happened:\nResponse taken:\nStudent reflection:\nNext step / monitoring:\n",
      },
      {
        label: "General observation",
        kind: "Observation",
        title: "General observation",
        body: "Observation:\nImpact on learning / wellbeing:\nNext step:\n",
      },
    ],
    []
  );

  /* ───────────────────────── LOAD DATA ───────────────────────── */

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
        setStudents((data ?? []) as StudentRow[]);
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
    setClasses((data ?? []) as ClassRow[]);
  }

  async function loadExisting() {
    if (!editId) return;

    const tries = [
      "id,student_id,class_id,created_at,updated_at,note_kind,title,note,is_deleted",
      "id,student_id,class_id,created_at,updated_at,note_kind,note,is_deleted",
      "id,student_id,class_id,created_at,note_kind,note",
    ];

    for (const sel of tries) {
      const { data, error } = await supabase.from("teacher_notes").select(sel).eq("id", editId).single();
      if (!error) {
        const r = data as TeacherNoteRow;
        setStudentId(r.student_id ?? "");
        setClassId(r.class_id ?? "");
        setNoteKind(r.note_kind ?? "");
        setTitle(r.title ?? "");
        setNote(r.note ?? "");
        setNoteDate(toDateInputValue(r.updated_at || r.created_at));
        return;
      }
      if (!isMissingColumnError(error)) throw error;
    }
  }

  async function loadLatestForStudent(sid: string) {
    if (!sid) {
      setLatest([]);
      return;
    }

    const tries = [
      "id,student_id,class_id,created_at,updated_at,note_kind,title,note,is_deleted",
      "id,student_id,class_id,created_at,updated_at,note_kind,note,is_deleted",
      "id,student_id,class_id,created_at,note_kind,note",
    ];

    for (const sel of tries) {
      const { data, error } = await supabase
        .from("teacher_notes")
        .select(sel)
        .eq("student_id", sid)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error) {
        const rows = ((data ?? []) as TeacherNoteRow[]).filter((x) => !x.is_deleted);
        setLatest(rows);
        return;
      }

      if (!isMissingColumnError(error)) throw error;
    }

    setLatest([]);
  }

  async function loadAll() {
    setBusy(true);
    setErr(null);
    setOkMsg(null);

    try {
      await Promise.all([loadStudents(), loadClasses()]);
      await loadExisting();

      if (!editId) setNoteDate((v) => v || todayDateInputValue());

      if (studentIdParam) await loadLatestForStudent(studentIdParam);
      else if (studentId) await loadLatestForStudent(studentId);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadLatestForStudent(studentId);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load latest notes.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const latestDateForStudent = useMemo(() => {
    if (!latest.length) return null;
    const d = latest[0]?.updated_at || latest[0]?.created_at || null;
    return d;
  }, [latest]);

  const isStale = useMemo(() => {
    if (!latestDateForStudent) return true;
    const d = new Date(latestDateForStudent);
    if (Number.isNaN(d.getTime())) return true;
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 21;
  }, [latestDateForStudent]);

  /* ───────────────────────── BEHAVIOUR ───────────────────────── */

  function clearForm() {
    setNoteKind("");
    setTitle("");
    setNote("");
    setNoteDate(todayDateInputValue());
  }

  function applyTemplate(kind: string, titleText: string, body: string) {
    if (!safe(noteKind)) setNoteKind(kind);
    if (!safe(title)) setTitle(titleText);
    if (!safe(note)) setNote(body);
  }

  function onChangeClass(nextClassId: string) {
    setClassId(nextClassId);

    if (studentId) {
      const s = students.find((x) => x.id === studentId);
      if (s && nextClassId && s.class_id !== nextClassId) setStudentId("");
    }
  }

  function onChangeStudent(nextStudentId: string) {
    setStudentId(nextStudentId);

    const s = students.find((x) => x.id === nextStudentId);
    if (s?.class_id) setClassId(s.class_id);
  }

  /* ───────────────────────── SAVE / DELETE ───────────────────────── */

  async function save() {
    setBusy(true);
    setErr(null);
    setOkMsg(null);

    try {
      if (!studentId) throw new Error("Please select a student.");

      const k = safe(noteKind);
      const t = safe(title);
      const n = safe(note);

      if (!k && !t && !n) throw new Error("Please add at least a Note type, Title, or Note.");

      const inferredClassId = classId || selectedStudent?.class_id || null;

      const payload: any = {
        student_id: studentId,
        class_id: inferredClassId,
        note_kind: k || null,
        title: t || null,
        note: n || null,
        is_deleted: false,
      };

      if (editId) {
        const { error } = await supabase.from("teacher_notes").update(payload).eq("id", editId);
        if (error) throw error;
        setOkMsg("Note updated.");
      } else {
        const { error } = await supabase.from("teacher_notes").insert(payload);
        if (error) throw error;
        setOkMsg("Note saved.");
      }

      await loadLatestForStudent(studentId);
      clearForm();
      router.push("/admin/teacher-notes");
    } catch (e: any) {
      setErr(e?.message ?? "Save failed.");
    } finally {
      setBusy(false);
      setTimeout(() => setOkMsg(null), 1200);
    }
  }

  async function softDelete(noteId: string) {
    const ok = confirm("Delete this teacher note?\n\nThis will hide it from lists (soft delete).");
    if (!ok) return;

    setBusy(true);
    setErr(null);
    setOkMsg(null);

    try {
      const { error } = await supabase.from("teacher_notes").update({ is_deleted: true }).eq("id", noteId);
      if (error) throw error;

      setOkMsg("Note deleted.");
      await loadLatestForStudent(studentId);
      if (editId === noteId) router.push(studentId ? `/admin/teacher-notes-entry?studentId=${studentId}` : "/admin/teacher-notes-entry");
    } catch (e: any) {
      setErr(e?.message ?? "Delete failed.");
    } finally {
      setBusy(false);
      setTimeout(() => setOkMsg(null), 1200);
    }
  }

  /* ───────────────────────── UI ───────────────────────── */

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.subtle}>TEACHER NOTES</div>
          <h1 style={S.h1}>{editId ? "Edit teacher note" : "New teacher note"}</h1>
          <div style={S.sub}>
            Capture a quick note for a student, including note type, optional title, and the note itself.
            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {selectedClass ? (
                <span style={S.chip}>
                  Class: {safe(selectedClass.name) || "Class"} {selectedClass.year_level ? `Y${selectedClass.year_level}` : ""}
                </span>
              ) : (
                <span style={S.chip}>Class: —</span>
              )}

              <span style={S.chip}>Student: {selectedStudent ? studentName(selectedStudent) : "—"}</span>
              {selectedStudent?.is_ilp ? <span style={S.chip}>ILP</span> : null}
              <span style={S.chip}>Note date: {noteDate || "—"}</span>
              {selectedStudent ? (
                latestDateForStudent ? (
                  isStale ? (
                    <span style={S.chipWarn}>Last note: {isoShort(latestDateForStudent)} • stale 21+d</span>
                  ) : (
                    <span style={S.chip}>Last note: {isoShort(latestDateForStudent)}</span>
                  )
                ) : (
                  <span style={S.chipWarn}>No previous notes</span>
                )
              ) : null}

              <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={S.btn} onClick={loadAll} disabled={busy}>
                  Refresh
                </button>
                <button style={S.btn} onClick={() => router.push("/admin/teacher-notes")} disabled={busy}>
                  Back to notes →
                </button>
              </div>
            </div>
          </div>

          {err ? <div style={S.err}>{err}</div> : null}
          {okMsg ? <div style={S.ok}>{okMsg}</div> : null}
        </section>

        <section style={{ ...S.card, marginTop: 14, padding: 16 }}>
          <div style={S.grid}>
            <div style={S.row2}>
              <div>
                <label style={S.label}>Class</label>
                <select value={classId} onChange={(e) => onChangeClass(e.target.value)} style={S.input} disabled={busy}>
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {safe(c.name) || "Class"} {c.year_level ? `Y${c.year_level}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={S.label}>Student</label>
                <select value={studentId} onChange={(e) => onChangeStudent(e.target.value)} style={S.input} disabled={busy}>
                  <option value="">Select student</option>
                  {students
                    .filter((s) => !classId || s.class_id === classId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {studentName(s)}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div style={S.row2}>
              <div>
                <label style={S.label}>Note type</label>
                <input
                  value={noteKind}
                  onChange={(e) => setNoteKind(e.target.value)}
                  placeholder="e.g. Behaviour, Parent contact, Wellbeing, Learning, Observation"
                  style={S.input}
                  disabled={busy}
                />
              </div>

              <div>
                <label style={S.label}>Note date</label>
                <input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} style={S.input} disabled />
              </div>
            </div>

            <div>
              <label style={S.label}>Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional short title"
                style={S.input}
                disabled={busy}
              />
            </div>

            <div>
              <label style={S.label}>Quick templates</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {noteTemplates.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    style={S.btn}
                    onClick={() => applyTemplate(t.kind, t.title, t.body)}
                    disabled={busy}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={S.label}>Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={10}
                style={S.textarea}
                disabled={busy}
                placeholder="Write the teacher note here…"
              />
              <div style={{ marginTop: 8, color: "#64748b", fontSize: 12, fontWeight: 800 }}>
                Characters: {safe(note).length}
              </div>
            </div>

            <div style={S.actions}>
              <button onClick={save} disabled={busy} style={S.btnPrimary}>
                {busy ? "Saving…" : editId ? "Update note" : "Save note"}
              </button>

              <button
                onClick={() => {
                  clearForm();
                  router.push(studentId ? `/admin/teacher-notes-entry?studentId=${studentId}` : "/admin/teacher-notes-entry");
                }}
                style={S.btn}
                disabled={busy}
                title="Clear form (and exit edit mode)"
              >
                New note
              </button>

              {selectedStudent ? (
                <button
                  onClick={() => router.push(`/admin/students/${selectedStudent.id}?tab=timeline`)}
                  style={S.btn}
                  disabled={busy}
                >
                  Open student →
                </button>
              ) : null}

              <button onClick={() => router.push("/admin/teacher-notes")} style={S.btn} disabled={busy}>
                Cancel
              </button>
            </div>
          </div>
        </section>

        <section style={{ ...S.card, marginTop: 14, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 950, color: "#0f172a" }}>Latest 30</div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800 }}>
              {studentId ? "Latest notes for selected student." : "Pick a student to see recent notes."}
            </div>
          </div>

          <div style={{ marginTop: 12, ...S.tableWrap }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Type</th>
                  <th style={S.th}>Title / Note</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((n) => (
                  <tr key={n.id}>
                    <td style={S.td}>
                      <span style={S.chip}>{isoShort(n.updated_at ?? n.created_at ?? null)}</span>
                    </td>
                    <td style={S.td}>
                      <span style={S.chip}>{safe(n.note_kind) || "General"}</span>
                    </td>
                    <td style={S.td}>
                      <div style={{ color: "#0f172a", fontWeight: 950, lineHeight: 1.25 }}>
                        {safe(n.title) || safe(n.note_kind) || "Teacher note"}
                      </div>
                      {safe(n.note) ? (
                        <div style={{ marginTop: 6, color: "#334155", fontWeight: 800, lineHeight: 1.35, whiteSpace: "pre-wrap" }}>
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
                          onClick={() => router.push(`/admin/teacher-notes-entry?studentId=${studentId}&edit=${n.id}`)}
                        >
                          Edit
                        </button>
                        <button style={S.btnDanger} disabled={busy} onClick={() => softDelete(n.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!studentId ? (
                  <tr>
                    <td colSpan={4} style={{ ...S.td, padding: 16, color: "#64748b", fontWeight: 900 }}>
                      Select a student to view recent notes.
                    </td>
                  </tr>
                ) : latest.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ ...S.td, padding: 16, color: "#64748b", fontWeight: 900 }}>
                      No teacher notes yet for this student — add one above.
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