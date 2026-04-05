"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import TeacherShellHeader from "@/app/components/TeacherShellHeader";

type ClassRow = {
  id: string;
  name: string | null;
  year_level: number | null;
};

type StudentRow = {
  id: string;
  first_name: string | null;
  preferred_name: string | null;
  is_ilp: boolean | null;
  class_id: string | null;
};

export default function TeacherStudentProfileBrowserPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);

  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // ─────────────────────────────
  // AUTH GUARD (basic)
  // ─────────────────────────────
  useEffect(() => {
    const guard = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) window.location.href = "/";
    };
    guard();
  }, []);

  // ─────────────────────────────
  // LOAD DATA
  // ─────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    setErr("");
    setOk("");

    const { data: cData, error: cErr } = await supabase
      .from("classes")
      .select("id, name, year_level")
      .order("year_level", { ascending: true })
      .order("name", { ascending: true });

    if (cErr) {
      setErr(`Load classes failed: ${cErr.message}`);
      setClasses([]);
    } else {
      setClasses((cData as ClassRow[]) ?? []);
    }

    const { data: sData, error: sErr } = await supabase
      .from("students")
      .select("id, first_name, preferred_name, is_ilp, class_id")
      .order("preferred_name", { ascending: true })
      .order("first_name", { ascending: true });

    if (sErr) {
      setErr(`Load students failed: ${sErr.message}`);
      setStudents([]);
    } else {
      setStudents((sData as StudentRow[]) ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────
  // LOOKUPS
  // ─────────────────────────────
  const classById = useMemo(() => {
    const m = new Map<string, ClassRow>();
    for (const c of classes) m.set(c.id, c);
    return m;
  }, [classes]);

  const studentName = (s: StudentRow) => {
    const pref = (s.preferred_name ?? "").trim();
    const first = (s.first_name ?? "").trim();
    return pref || first || "Unnamed student";
  };

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => s.id === selectedStudentId) ?? null;
  }, [students, selectedStudentId]);

  const selectedClass = useMemo(() => {
    if (!selectedStudent?.class_id) return null;
    return classById.get(selectedStudent.class_id) ?? null;
  }, [selectedStudent, classById]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students.slice(0, 200); // keep fast when blank

    return students
      .filter((s) => {
        const n = studentName(s).toLowerCase();
        return n.includes(q) || s.id.toLowerCase().includes(q);
      })
      .slice(0, 200);
  }, [students, search]);

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const c of classes) if (typeof c.year_level === "number") set.add(c.year_level);
    return Array.from(set).sort((a, b) => a - b);
  }, [classes]);

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  if (loading) return <main style={{ padding: 24 }}>Loading...</main>;

  return (
    <main style={{ padding: 24, maxWidth: 1200 }}>
      <TeacherShellHeader
        title="Student Profile Browser"
        subtitle="Signed in and ready to browse student profiles without losing your place."
      >
        <button onClick={() => loadAll()} style={btn}>
          Refresh
        </button>
      </TeacherShellHeader>

      {/* Header */}
      <section style={{ ...panel, marginTop: 16 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>TEACHER • STUDENT PROFILES</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>Student Profile Browser</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            This is a <strong>generic profile template</strong> that populates when you select a student (no IDs needed).
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill label={`Students: ${students.length}`} />
            <Pill label={`Classes: ${classes.length}`} />
            <Pill label={`Years: ${years.length}`} />
            <Pill label={`Selected: ${selectedStudent ? studentName(selectedStudent) : "None"}`} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/")} style={btn}>
            ← Home
          </button>
          <button onClick={() => router.push("/admin")} style={btn}>
            Admin
          </button>
          <button onClick={() => loadAll()} style={btn}>
            Refresh
          </button>
        </div>
      </section>

      {!!err && (
        <div style={{ marginBottom: 14, padding: 10, border: "1px solid #f2c1c1", borderRadius: 10 }}>
          <strong style={{ color: "crimson" }}>Error:</strong> {err}
        </div>
      )}
      {!!ok && (
        <div style={{ marginBottom: 14, padding: 10, border: "1px solid #cfe9cf", borderRadius: 10 }}>
          <strong style={{ color: "green" }}>OK:</strong> {ok}
        </div>
      )}

      {/* Picker + Profile */}
      <section style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 16 }}>
        {/* LEFT: Student picker */}
        <aside style={panelCol}>
          <div style={{ width: "100%" }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Find a student</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Search by preferred/first name (shows up to 200 results).
            </div>

            <label style={{ display: "block", marginTop: 10, fontSize: 12 }}>
              Search
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type a name…"
                style={input}
              />
            </label>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  setSelectedStudentId("");
                  setOk("Cleared selection.");
                }}
                style={btn}
                disabled={!selectedStudentId}
              >
                Clear selection
              </button>

              <button
                onClick={() => {
                  setSearch("");
                  setOk("Cleared search.");
                }}
                style={btn}
                disabled={!search.trim()}
              >
                Clear search
              </button>
            </div>

            <div style={{ marginTop: 14, borderTop: "1px solid #f2f2f2", paddingTop: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
                Results ({filteredStudents.length})
              </div>

              {filteredStudents.length === 0 ? (
                <div style={{ fontSize: 13, opacity: 0.75 }}>No matches.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 520, overflow: "auto" }}>
                  {filteredStudents.map((s) => {
                    const isSelected = s.id === selectedStudentId;
                    const c = s.class_id ? classById.get(s.class_id) : null;

                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudentId(s.id)}
                        style={{
                          ...listBtn,
                          borderColor: isSelected ? "#111" : "#e6e6e6",
                          background: isSelected ? "#111" : "transparent",
                          color: isSelected ? "white" : "inherit",
                        }}
                        title={s.id}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 900 }}>{studentName(s)}</div>
                          {s.is_ilp ? (
                            <span style={badge}>
                              ILP
                            </span>
                          ) : null}
                        </div>
                        <div style={{ fontSize: 12, opacity: isSelected ? 0.85 : 0.7, marginTop: 2 }}>
                          {c ? (
                            <>
                              {c.name ?? c.id}
                              {c.year_level != null ? ` • Year ${c.year_level}` : ""}
                            </>
                          ) : (
                            "Unassigned"
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* RIGHT: Profile */}
        <section style={panelCol}>
          {!selectedStudent ? (
            <GenericProfileTemplate />
          ) : (
            <StudentProfile
              student={selectedStudent}
              classRow={selectedClass}
              displayName={studentName(selectedStudent)}
            />
          )}
        </section>
      </section>
    </main>
  );
}

/* ─────────────────────────────
   PROFILE COMPONENTS
───────────────────────────── */

function GenericProfileTemplate() {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>PROFILE TEMPLATE</div>
      <div style={{ fontSize: 20, fontWeight: 900, marginTop: 4 }}>No student selected</div>
      <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6, maxWidth: 760 }}>
        Choose a student from the left to populate this profile. This page is the <strong>generic</strong> profile layout
        we’ll reuse for every student.
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card title="Snapshot (coming from data)">
          Class, year level, ILP flag, key alerts, last updated.
        </Card>
        <Card title="Progress (assessment-driven)">
          Trends over time by domain (Reading / Writing / Maths).
        </Card>
        <Card title="Latest evidence">
          Most recent assessments and results (when assessments tables are ready).
        </Card>
        <Card title="Strengths + Next steps (rules first)">
          Simple logic-generated summaries from evidence.
        </Card>
        <Card title="Support signals">
          Missing data, sudden dips, gaps, or notes.
        </Card>
        <Card title="Reporting output">
          “Export to report comment” later (infrastructure only for now).
        </Card>
      </div>
    </div>
  );
}

function StudentProfile({
  student,
  classRow,
  displayName,
}: {
  student: {
    id: string;
    first_name: string | null;
    preferred_name: string | null;
    is_ilp: boolean | null;
    class_id: string | null;
  };
  classRow: { id: string; name: string | null; year_level: number | null } | null;
  displayName: string;
}) {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>STUDENT PROFILE</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{displayName}</div>

      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Pill label={`ID: ${student.id}`} />
        <Pill label={classRow ? `Class: ${classRow.name ?? classRow.id}` : "Class: Unassigned"} />
        <Pill label={classRow?.year_level != null ? `Year ${classRow.year_level}` : "Year —"} />
        <Pill label={student.is_ilp ? "ILP: Yes" : "ILP: No"} />
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card title="Snapshot">
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            <div>
              <strong>Class:</strong> {classRow ? classRow.name ?? classRow.id : "Unassigned"}
            </div>
            <div>
              <strong>Year:</strong> {classRow?.year_level != null ? `Year ${classRow.year_level}` : "—"}
            </div>
            <div>
              <strong>ILP:</strong> {student.is_ilp ? "Yes" : "No"}
            </div>
          </div>
        </Card>

        <Card title="Assessment Progress (placeholder)">
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            Next: wire up assessment tables once your assessments-admin policies are stable.
          </div>
          <ul style={{ margin: "8px 0 0 18px", fontSize: 13, opacity: 0.8 }}>
            <li>Domain trends (reading/writing/maths)</li>
            <li>Latest results</li>
            <li>Gaps / missing evidence</li>
          </ul>
        </Card>

        <Card title="Latest Evidence (placeholder)">
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            Will list recent assessment rows + notes, newest first.
          </div>
        </Card>

        <Card title="Strengths & Next Steps (placeholder)">
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            Will generate auto-summaries from evidence (rules first, AI later if desired).
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─────────────────────────────
   UI HELPERS
───────────────────────────── */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={card}>
      <div style={{ fontWeight: 900, marginBottom: 6 }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

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

const panel: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const panelCol: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  padding: 16,
  width: "100%",
  background: "white",
};

const btn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontWeight: 900,
  cursor: "pointer",
  background: "transparent",
};

const input: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: 10,
  borderRadius: 12,
  border: "1px solid #ddd",
};

const listBtn: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: 12,
  borderRadius: 12,
  border: "1px solid #e6e6e6",
  cursor: "pointer",
};

const badge: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  padding: "2px 8px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.35)",
};

const card: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 14,
};
