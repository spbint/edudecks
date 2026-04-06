"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { supabase } from "@/lib/supabaseClient";
import { StudentNameLink } from "@/app/admin/components/StudentNameLink";

/* ───────────────────────── TYPES ───────────────────────── */

type StudentRow = {
  id: string;
  first_name: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
};

type NoteRow = {
  id: string;
  student_id: string | null;
  note_text: string | null;
  created_at?: string | null;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function studentDisplayName(student: StudentRow | null) {
  if (!student) return "Open student";
  const first = String(student.preferred_name || student.first_name || "").trim();
  const last = String(student.surname || student.family_name || "").trim();
  return `${first}${last ? ` ${last}` : ""}`.trim() || "Open student";
}

/* ───────────────────────── PAGE ───────────────────────── */

export default function NotesEntryPage() {
  const searchParams = useSearchParams();

  const studentId = searchParams?.get("studentId") || "";

  const [student, setStudent] = useState<StudentRow | null>(null);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);

  /* ───────────────────────── LOAD STUDENT ───────────────────────── */

  useEffect(() => {
    async function load() {
      if (!studentId) {
        setLoading(false);
        return;
      }

      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      const { data: notesData } = await supabase
        .from("notes")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      setStudent(studentData || null);
      setNotes(notesData || []);
      setLoading(false);
    }

    load();
  }, [studentId]);

  /* ───────────────────────── SAVE NOTE ───────────────────────── */

  async function saveNote() {
    if (!studentId || !noteText.trim()) return;

    const { error } = await supabase.from("notes").insert({
      student_id: studentId,
      note_text: noteText,
    });

    if (!error) {
      setNoteText("");

      const { data: notesData } = await supabase
        .from("notes")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      setNotes(notesData || []);
    }
  }

  /* ───────────────────────── UI ───────────────────────── */

  return (
    <div style={S.page}>
      <AdminLeftNav />

      <main style={S.main}>
        <h1 style={S.title}>Notes Entry</h1>

        {!studentId && (
          <div style={S.warning}>
            No student selected. Open this page from a student context.
          </div>
        )}

        {studentId && (
          <>
            <div style={S.studentCard}>
              <div style={S.studentLabel}>Student</div>

              <div style={S.studentName}>
                <StudentNameLink studentId={studentId}>
                  {studentDisplayName(student)}
                </StudentNameLink>
              </div>
            </div>

            <div style={S.entryBox}>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter observation, anecdotal note, or incident..."
                style={S.textarea}
              />

              <button onClick={saveNote} style={S.saveBtn}>
                Save Note
              </button>
            </div>

            <h2 style={S.sectionTitle}>Recent Notes</h2>

            {loading && <div>Loading...</div>}

            {!loading && notes.length === 0 && (
              <div style={S.empty}>No notes recorded yet.</div>
            )}

            <div style={S.notesList}>
              {notes.map((note) => (
                <div key={note.id} style={S.noteCard}>
                  <div style={S.noteDate}>
                    {note.created_at
                      ? new Date(note.created_at).toLocaleString()
                      : ""}
                  </div>

                  <div style={S.noteText}>{note.note_text}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */

const S: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#0f172a",
    color: "#e5e7eb",
  },

  main: {
    flex: 1,
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: 900,
    marginBottom: 20,
  },

  warning: {
    background: "#7f1d1d",
    padding: 12,
    borderRadius: 10,
    fontWeight: 700,
  },

  studentCard: {
    background: "#111827",
    padding: 16,
    borderRadius: 14,
    marginBottom: 18,
    border: "1px solid #1f2937",
  },

  studentLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
  },

  studentName: {
    fontSize: 18,
    fontWeight: 900,
  },

  entryBox: {
    background: "#111827",
    padding: 16,
    borderRadius: 14,
    border: "1px solid #1f2937",
    marginBottom: 24,
  },

  textarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 10,
    padding: 10,
    border: "1px solid #374151",
    background: "#020617",
    color: "#e5e7eb",
    marginBottom: 10,
  },

  saveBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 900,
    marginBottom: 12,
  },

  empty: {
    color: "#94a3b8",
    fontStyle: "italic",
  },

  notesList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  noteCard: {
    background: "#111827",
    borderRadius: 12,
    padding: 12,
    border: "1px solid #1f2937",
  },

  noteDate: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 6,
  },

  noteText: {
    fontSize: 14,
    lineHeight: 1.5,
  },
};