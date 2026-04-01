"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type ClassRow = { id: string; name: string | null; year_level: number | null };
type StudentRow = { id: string; first_name: string | null; preferred_name: string | null; is_ilp: boolean | null; class_id: string | null };
type TeacherRow = { id: string; first_name: string | null; last_name: string | null; email: string | null };
type ClassTeacherRow = { id: string; class_id: string; teacher_id: string };

type InstrumentRow = { id: string; instrument_code: string; instrument_name: string; domain: string; score_type: string };
type ResultRow = {
  id: string;
  student_id: string;
  instrument_id: string;
  occurred_on: string;
  score_numeric: number | null;
  stanine: number | null;
  band: string | null;
  created_at: string;
};

export default function WholeSchoolPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [classTeachers, setClassTeachers] = useState<ClassTeacherRow[]>([]);

  const [instruments, setInstruments] = useState<InstrumentRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);

  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // ─────────────────────────────
  // AUTH GUARD
  // ─────────────────────────────
  useEffect(() => {
    const guard = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) window.location.href = "/";
    };
    guard();
  }, []);

  const studentName = (s: StudentRow) => {
    const pref = (s.preferred_name ?? "").trim();
    const first = (s.first_name ?? "").trim();
    return pref || first || "Unnamed student";
  };

  const teacherName = (t: TeacherRow) => {
    const fn = (t.first_name ?? "").trim();
    const ln = (t.last_name ?? "").trim();
    const full = `${fn} ${ln}`.trim();
    return full || (t.email ?? "").trim() || "Unnamed teacher";
  };

  const loadAll = async () => {
    setLoading(true);
    setErr("");
    setOk("");

    try {
      const [cRes, sRes, tRes, ctRes, iRes, rRes] = await Promise.all([
        supabase.from("classes").select("id, name, year_level").order("year_level", { ascending: true }).order("name", { ascending: true }),
        supabase.from("students").select("id, first_name, preferred_name, is_ilp, class_id").order("first_name", { ascending: true }),
        supabase.from("teachers").select("id, first_name, last_name, email").order("first_name", { ascending: true }),
        supabase.from("class_teachers").select("id, class_id, teacher_id"),
        supabase.from("assessment_instruments").select("id, instrument_code, instrument_name, domain, score_type").order("instrument_name", { ascending: true }),
        supabase
          .from("assessment_results")
          .select("id, student_id, instrument_id, occurred_on, score_numeric, stanine, band, created_at")
          .order("occurred_on", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (cRes.error) throw new Error(`Load classes failed: ${cRes.error.message}`);
      if (sRes.error) throw new Error(`Load students failed: ${sRes.error.message}`);
      if (tRes.error) throw new Error(`Load teachers failed: ${tRes.error.message}`);
      if (ctRes.error) throw new Error(`Load class_teachers failed: ${ctRes.error.message}`);
      if (iRes.error) throw new Error(`Load assessment_instruments failed: ${iRes.error.message}`);
      if (rRes.error) throw new Error(`Load assessment_results failed: ${rRes.error.message}`);

      setClasses((cRes.data as ClassRow[]) ?? []);
      setStudents((sRes.data as StudentRow[]) ?? []);
      setTeachers((tRes.data as TeacherRow[]) ?? []);
      setClassTeachers((ctRes.data as ClassTeacherRow[]) ?? []);

      setInstruments((iRes.data as InstrumentRow[]) ?? []);
      setResults((rRes.data as ResultRow[]) ?? []);

      setOk("Loaded ✅");
    } catch (e: any) {
      setErr(e?.message ?? "Unknown load error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const classStudentCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of students) {
      if (!s.class_id) continue;
      m[s.class_id] = (m[s.class_id] ?? 0) + 1;
    }
    return m;
  }, [students]);

  const classTeacherCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const ct of classTeachers) {
      m[ct.class_id] = (m[ct.class_id] ?? 0) + 1;
    }
    return m;
  }, [classTeachers]);

  const unassignedStudents = useMemo(() => students.filter((s) => !s.class_id), [students]);

  const teacherIdsAssignedAnywhere = useMemo(() => new Set(classTeachers.map((ct) => ct.teacher_id)), [classTeachers]);

  const unassignedTeachers = useMemo(() => teachers.filter((t) => !teacherIdsAssignedAnywhere.has(t.id)), [teachers, teacherIdsAssignedAnywhere]);

  const instrumentById = useMemo(() => {
    const m = new Map<string, InstrumentRow>();
    instruments.forEach((i) => m.set(i.id, i));
    return m;
  }, [instruments]);

  const searchLower = search.trim().toLowerCase();

  const filteredUnassignedStudents = useMemo(() => {
    if (!searchLower) return unassignedStudents;
    return unassignedStudents.filter((s) => studentName(s).toLowerCase().includes(searchLower));
  }, [unassignedStudents, searchLower]);

  const filteredUnassignedTeachers = useMemo(() => {
    if (!searchLower) return unassignedTeachers;
    return unassignedTeachers.filter((t) => teacherName(t).toLowerCase().includes(searchLower) || (t.email ?? "").toLowerCase().includes(searchLower));
  }, [unassignedTeachers, searchLower]);

  if (loading) return <main style={{ padding: 24 }}>Loading whole-school view…</main>;

  return (
    <main style={{ padding: 24, maxWidth: 1200 }}>
      {/* Header */}
      <section
        style={{
          border: "1px solid #e6e6e6",
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>SUPERUSER • WHOLE SCHOOL</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>Whole-school Data</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>A single pane of glass for setup + activity.</div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/admin")} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd" }}>
            ← Back to Admin
          </button>
          <button onClick={loadAll} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd" }}>
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

      {/* Search */}
      <section style={{ border: "1px solid #e6e6e6", borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <label style={{ fontSize: 12, display: "block" }}>
          Search (unassigned lists)
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a student/teacher name or teacher email…"
            style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
          />
        </label>
      </section>

      {/* KPI cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 16 }}>
        <Kpi title="Classes" value={classes.length} />
        <Kpi title="Students" value={students.length} />
        <Kpi title="Teachers" value={teachers.length} />
        <Kpi title="Unassigned students" value={unassignedStudents.length} />
        <Kpi title="Unassigned teachers" value={unassignedTeachers.length} />
        <Kpi title="Instruments / Results" value={`${instruments.length} / ${results.length}`} />
      </section>

      {/* Classes table */}
      <section style={{ border: "1px solid #e6e6e6", borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Classes overview</div>
        {classes.length === 0 ? (
          <div style={{ fontSize: 13, opacity: 0.75 }}>No classes found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ fontSize: 12, opacity: 0.7, textAlign: "left" }}>
                <th style={{ padding: "8px 6px" }}>Class</th>
                <th style={{ padding: "8px 6px" }}>Year</th>
                <th style={{ padding: "8px 6px" }}>Students</th>
                <th style={{ padding: "8px 6px" }}>Teachers</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "10px 6px", fontWeight: 900 }}>{c.name ?? c.id}</td>
                  <td style={{ padding: "10px 6px" }}>{c.year_level ?? "—"}</td>
                  <td style={{ padding: "10px 6px" }}>{classStudentCounts[c.id] ?? 0}</td>
                  <td style={{ padding: "10px 6px" }}>{classTeacherCounts[c.id] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Two-column: Unassigned lists */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <section style={{ border: "1px solid #e6e6e6", borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Unassigned students</div>
          {filteredUnassignedStudents.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.75 }}>None 🎉</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {filteredUnassignedStudents.slice(0, 40).map((s) => (
                <div key={s.id} style={{ border: "1px solid #f1f1f1", borderRadius: 14, padding: 12, display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>{studentName(s)}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {s.is_ilp ? "ILP" : "Standard"} • <code>{s.id}</code>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/student/${s.id}`)}
                    style={{ padding: "8px 12px", borderRadius: 12, border: "1px solid #ddd", fontWeight: 900 }}
                  >
                    Profile
                  </button>
                </div>
              ))}
              {filteredUnassignedStudents.length > 40 ? (
                <div style={{ fontSize: 12, opacity: 0.7 }}>Showing first 40…</div>
              ) : null}
            </div>
          )}
        </section>

        <section style={{ border: "1px solid #e6e6e6", borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Unassigned teachers</div>
          {filteredUnassignedTeachers.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.75 }}>None 🎉</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {filteredUnassignedTeachers.slice(0, 40).map((t) => (
                <div key={t.id} style={{ border: "1px solid #f1f1f1", borderRadius: 14, padding: 12 }}>
                  <div style={{ fontWeight: 900 }}>{teacherName(t)}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {t.email ?? <span style={{ opacity: 0.6 }}>no email</span>} • <code>{t.id}</code>
                  </div>
                </div>
              ))}
              {filteredUnassignedTeachers.length > 40 ? (
                <div style={{ fontSize: 12, opacity: 0.7 }}>Showing first 40…</div>
              ) : null}
            </div>
          )}
        </section>
      </div>

      {/* Latest assessments */}
      <section style={{ border: "1px solid #e6e6e6", borderRadius: 16, padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Latest assessment results (most recent 50)</div>
        {results.length === 0 ? (
          <div style={{ fontSize: 13, opacity: 0.75 }}>No results found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ fontSize: 12, opacity: 0.7, textAlign: "left" }}>
                <th style={{ padding: "8px 6px" }}>Date</th>
                <th style={{ padding: "8px 6px" }}>Instrument</th>
                <th style={{ padding: "8px 6px" }}>Student</th>
                <th style={{ padding: "8px 6px" }}>Score</th>
                <th style={{ padding: "8px 6px" }}>Stanine</th>
                <th style={{ padding: "8px 6px" }}>Band</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const inst = instrumentById.get(r.instrument_id);
                const stu = students.find((s) => s.id === r.student_id);
                return (
                  <tr key={r.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px 6px", fontWeight: 800 }}>{r.occurred_on}</td>
                    <td style={{ padding: "10px 6px" }}>
                      <div style={{ fontWeight: 900 }}>{inst?.instrument_name ?? r.instrument_id}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        {inst?.instrument_code ? `${inst.instrument_code} • ` : ""}
                        {inst?.domain ?? "—"}
                      </div>
                    </td>
                    <td style={{ padding: "10px 6px" }}>
                      {stu ? (
                        <button
                          onClick={() => router.push(`/student/${stu.id}`)}
                          style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd", fontWeight: 900 }}
                        >
                          {studentName(stu)}
                        </button>
                      ) : (
                        <span style={{ opacity: 0.75 }}>{r.student_id}</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 6px" }}>{r.score_numeric ?? "—"}</td>
                    <td style={{ padding: "10px 6px" }}>{r.stanine ?? "—"}</td>
                    <td style={{ padding: "10px 6px" }}>{r.band ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: any }) {
  return (
    <div style={{ border: "1px solid #e6e6e6", borderRadius: 16, padding: 14 }}>
      <div style={{ fontSize: 11, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{String(value)}</div>
    </div>
  );
}
