"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SupportSignalsEvidence from "../components/SupportSignalsEvidence";
import TeacherShellHeader from "@/app/components/TeacherShellHeader";
import TeacherStudentTable from "./components/TeacherStudentTable";

/* ───────────────────────────── TYPES ───────────────────────────── */

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

/* ───────────────────────────── UI HELPERS ───────────────────────────── */

function safeClassName(name: string | null) {
  const s = (name ?? "").trim();
  return s ? s : "Unnamed class";
}

function fmtYear(y: number | null) {
  if (y == null) return "-";
  if (y === 0) return "Kinder/Prep";
  return `Year ${y}`;
}

function safeStudentName(s: StudentRow) {
  const pref = (s.preferred_name ?? "").trim();
  const first = (s.first_name ?? "").trim();
  return (pref || first || "Student").trim();
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Pill({
  text,
  tone = "muted",
}: {
  text: string;
  tone?: "muted" | "ok" | "warn";
}) {
  const cls =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={cx("inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold", cls)}>
      {text}
    </span>
  );
}

// soft color per class id (deterministic)
function colorFromId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;

  const palette = ["#F6F3FF", "#EFFFFA", "#FFF6E9", "#F1FAFF", "#FFF0F3", "#F6FFF0", "#F5F5F5"];
  return palette[hash % palette.length];
}

/* ───────────────────────────── PERSISTED CLASS ───────────────────────────── */

const LAST_TEACHER_CLASS_KEY = "fm_teacher_last_class_v1";
function readLastTeacherClassId(): string | null {
  try {
    return localStorage.getItem(LAST_TEACHER_CLASS_KEY);
  } catch {
    return null;
  }
}
function writeLastTeacherClassId(id: string) {
  try {
    localStorage.setItem(LAST_TEACHER_CLASS_KEY, id);
  } catch {}
}

/* ───────────────────────────── PAGE ───────────────────────────── */

export default function TeacherPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);

  // selected class (filter)
  const [classId, setClassId] = useState<string>("");

  // quick student search (filters roster before passing to table)
  const [studentQ, setStudentQ] = useState("");

  /* ───────── Auth guard ───────── */
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) window.location.href = "/";
    })();
  }, []);

  /* ───────── Load data ───────── */
  const loadAll = async () => {
    setLoading(true);
    setErr("");

    try {
      const [cRes, sRes] = await Promise.all([
        supabase
          .from("classes")
          .select("id, name, year_level")
          .order("year_level", { ascending: true })
          .order("name", { ascending: true }),
        supabase
          .from("students")
          .select("id, first_name, preferred_name, is_ilp, class_id")
          .order("preferred_name", { ascending: true })
          .order("first_name", { ascending: true }),
      ]);

      if (cRes.error) throw new Error(`Load classes failed: ${cRes.error.message}`);
      if (sRes.error) throw new Error(`Load students failed: ${sRes.error.message}`);

      const classList = (cRes.data as ClassRow[]) ?? [];
      const studentList = (sRes.data as StudentRow[]) ?? [];

      setClasses(classList);
      setStudents(studentList);

      // choose a sane default class:
      // priority: current -> last saved -> first with students -> first class
      const last = readLastTeacherClassId();

      if (!classId) {
        const counts = new Map<string, number>();
        for (const s of studentList) {
          if (!s.class_id) continue;
          counts.set(s.class_id, (counts.get(s.class_id) ?? 0) + 1);
        }

        const firstWithStudents = classList.find((c) => (counts.get(c.id) ?? 0) > 0)?.id;
        const fallbackFirst = classList[0]?.id;

        const preferred = last || firstWithStudents || fallbackFirst || "";
        if (preferred) setClassId(preferred);
      } else {
        // if currently-selected class got deleted, fallback
        const stillExists = classList.some((c) => c.id === classId);
        if (!stillExists) {
          const fallbackFirst = classList[0]?.id || "";
          setClassId(fallbackFirst);
        }
      }
    } catch (e: any) {
      console.error("Teacher loadAll() crashed:", e);
      setErr(e?.message ?? "Teacher dashboard failed to load.");
      setClasses([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (classId) writeLastTeacherClassId(classId);
  }, [classId]);

  /* ───────── Derived ───────── */

  const classById = useMemo(() => {
    const m = new Map<string, ClassRow>();
    for (const c of classes) m.set(c.id, c);
    return m;
  }, [classes]);

  const classCounts = useMemo(() => {
    const m = new Map<string, { total: number; ilp: number }>();
    for (const s of students) {
      if (!s.class_id) continue;
      const cur = m.get(s.class_id) ?? { total: 0, ilp: 0 };
      cur.total += 1;
      if (s.is_ilp) cur.ilp += 1;
      m.set(s.class_id, cur);
    }
    return m;
  }, [students]);

  const selectedClass = useMemo(() => (classId ? classById.get(classId) ?? null : null), [classById, classId]);

  const classTitle = useMemo(() => {
    if (!selectedClass) return "—";
    return `${safeClassName(selectedClass.name)} (${fmtYear(selectedClass.year_level)})`;
  }, [selectedClass]);

  const rosterCount = useMemo(() => (classId ? classCounts.get(classId)?.total ?? 0 : 0), [classCounts, classId]);

  const ilpCount = useMemo(() => (classId ? classCounts.get(classId)?.ilp ?? 0 : 0), [classCounts, classId]);

  // filter students before passing to the table (so TeacherStudentTable doesn't need changes)
  const filteredStudents = useMemo(() => {
    if (!studentQ.trim()) return students;

    const q = studentQ.trim().toLowerCase();
    return students.filter((s) => {
      const name = safeStudentName(s).toLowerCase();
      const cls = (s.class_id ?? "").toLowerCase();
      return name.includes(q) || cls.includes(q) || s.id.toLowerCase().includes(q);
    });
  }, [students, studentQ]);

  /* ───────────────────────────── UI ───────────────────────────── */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1200px] px-6 py-8">
          <div className="dash-card p-6">
            <div className="text-[12px] font-semibold tracking-widest text-slate-500">TEACHER</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Loading...</div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="h-[160px] rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50" />
              <div className="h-[160px] rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const hasClasses = classes.length > 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1200px] px-6 py-8 space-y-4">
        <TeacherShellHeader
          title="Class Overview"
          subtitle="You're signed in, your class workspace is ready, and the next actions are kept close by."
        >
          <Link href="/students" className="dash-btn dash-btn-muted">
            Open Students
          </Link>
          <button className="dash-btn dash-btn-muted" onClick={loadAll} type="button">
            Refresh
          </button>
        </TeacherShellHeader>

        {/* HERO */}
        <section className="dash-card overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50 to-sky-50 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[12px] font-semibold tracking-widest text-slate-500">TEACHER</div>
                <div className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Class Overview</div>
                <div className="mt-2 text-sm text-slate-600">
                  Select a class to view roster + bulk actions + support signals (from evidence).
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill text={`Class: ${classTitle}`} />
                  <Pill text={`Students: ${rosterCount}`} tone={rosterCount ? "ok" : "muted"} />
                  <Pill text={`ILP: ${ilpCount}`} tone={ilpCount ? "warn" : "muted"} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link href="/admin" className="dash-btn dash-btn-primary">
                  Admin ->
                </Link>
              </div>
            </div>

            {err ? <div className="mt-4 dash-alert">{err}</div> : null}
          </div>
        </section>

        {/* CLASS SELECTION */}
        <section className="dash-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-slate-900">Select class</div>
              <div className="mt-1 text-sm text-slate-600">Quick tiles for speed, plus dropdown for precision.</div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/admin/enter-results" className="dash-btn dash-btn-primary">
                Enter Results ->
              </Link>
            </div>
          </div>

          {!hasClasses ? (
            <div className="mt-4 dash-alert">
              No classes found. Create one in <Link className="font-semibold underline" href="/admin/class-entry">Admin -> Class Entry</Link>.
            </div>
          ) : (
            <>
              {/* Quick tiles */}
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {classes.map((c) => {
                  const counts = classCounts.get(c.id) ?? { total: 0, ilp: 0 };
                  const selected = c.id === classId;
                  const bg = selected ? "#ffffff" : colorFromId(c.id);

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setClassId(c.id)}
                      className={cx(
                        "dash-card p-4 text-left transition",
                        selected ? "border-slate-300 shadow-sm" : "hover:border-blue-200 hover:bg-white"
                      )}
                      style={{ background: bg }}
                      title={`${safeClassName(c.name)} (${fmtYear(c.year_level)})`}
                    >
                      <div className="text-base font-semibold text-slate-900 leading-tight">{safeClassName(c.name)}</div>
                      <div className="mt-2 text-sm text-slate-600">
                        {fmtYear(c.year_level)} - {counts.total} student{counts.total === 1 ? "" : "s"}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">ILP: {counts.ilp}</div>

                      {selected ? (
                        <div className="mt-3 text-xs font-semibold text-slate-700">Selected</div>
                      ) : (
                        <div className="mt-3 text-xs text-slate-500">Click to select</div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Dropdown */}
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <label className="text-sm text-slate-700">
                  <div className="mb-2 font-semibold">Class</div>
                  <select
                    className="dash-input"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    {classes.map((c) => {
                      const counts = classCounts.get(c.id) ?? { total: 0, ilp: 0 };
                      return (
                        <option key={c.id} value={c.id}>
                          {safeClassName(c.name)} ({fmtYear(c.year_level)}) - {counts.total} students - ILP {counts.ilp}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="dash-btn dash-btn-muted"
                    onClick={() => setClassId(classes[0]?.id ?? "")}
                    disabled={!classes.length}
                  >
                    Reset to first
                  </button>
                </div>
              </div>

              <div className="mt-3 text-sm text-slate-600">
                Runs on <span className="font-mono">students</span> + <span className="font-mono">evidence_entries</span>.
              </div>
            </>
          )}
        </section>

        {/* STUDENTS */}
        <section className="dash-card p-0 overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-slate-900">Students</div>
                <div className="mt-1 text-sm text-slate-600">Bulk actions and individual actions live in the table.</div>
              </div>

              <div className="min-w-[260px]">
                <input
                  className="dash-input"
                  placeholder="Quick search students... (Esc to clear)"
                  value={studentQ}
                  onChange={(e) => setStudentQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setStudentQ("");
                  }}
                  style={{ fontWeight: 600 }}
                />
              </div>
            </div>

            {classId && rosterCount === 0 ? (
              <div className="mt-3 text-sm text-slate-600">
                No students are assigned to this class yet. Assign in{" "}
                <Link href="/admin/student-class" className="font-semibold text-slate-900 underline">
                  Admin -> Assign Students -> Classes
                </Link>
                .
              </div>
            ) : null}
          </div>

          <div className="p-5">
            <TeacherStudentTable students={filteredStudents} classId={classId} />
          </div>
        </section>

        {/* SUPPORT SIGNALS */}
        <section className="dash-card p-0 overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <div className="text-lg font-semibold text-slate-900">Support Signals</div>
            <div className="mt-1 text-sm text-slate-600">Evidence-driven signals for quick visibility. (Optional view.)</div>
          </div>
          <div className="p-5">
            <SupportSignalsEvidence classId={classId} limit={25} />
          </div>
        </section>
      </div>
    </main>
  );
}
