"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

/**
 * We are locking this to your real FK column name:
 * evidence_entries.instrument_id
 */
const EVIDENCE_INSTRUMENT_FK = "instrument_id" as const;

const EVIDENCE_TABLE = "evidence_entries";
const STUDENTS_TABLE = "students";
const CLASSES_TABLE = "classes";
const INSTRUMENTS_TABLE = "assessment_instruments";

const TERM_OPTIONS = ["T1", "T2", "T3", "T4"] as const;

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

type InstrumentRow = {
  id: string;
  instrument_code: string | null;
  instrument_name: string | null;
  domain: string | null;
  score_type: string | null;
};

type EvidenceRow = {
  id: string;
  student_id: string | null;
  term: string | null;
  assessed_at: string | null;
  score_type: string | null;
  raw_score: number | null;
  stanine: number | null;
  percentile: number | null;
  multi_score: any | null;
  notes: string | null;
  created_at: string;

  instrument_id?: string | null;

  // joined labels
  student_name?: string;
  class_name?: string;
  instrument_name?: string;
  instrument_code?: string;
  instrument_domain?: string;
};

type ScoreType = "raw" | "stanine" | "percentile" | "multi";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function safeName(s: StudentRow) {
  const a = (s.preferred_name || "").trim();
  const b = (s.first_name || "").trim();
  return (a || b || "Unnamed Student").trim();
}

function classLabel(c: ClassRow) {
  const y = c.year_level != null ? `Year ${c.year_level}` : "Year ?";
  const n = (c.name || "").trim();
  return n ? `${n} • ${y}` : y;
}

function normScoreType(v: string | null | undefined): ScoreType {
  const x = (v || "").toLowerCase().trim();
  if (x === "stanine") return "stanine";
  if (x === "percentile") return "percentile";
  if (x === "multi") return "multi";
  return "raw";
}

function domainOrder(domain: string) {
  const d = domain.toLowerCase();
  if (d.includes("reading")) return 1;
  if (d.includes("math")) return 2;
  if (d.includes("writing")) return 3;
  if (d.includes("spelling")) return 4;
  if (d.includes("wellbeing")) return 5;
  return 99;
}

function formatScore(e: EvidenceRow) {
  const t = normScoreType(e.score_type);
  if (t === "stanine") return e.stanine != null ? `Stanine ${e.stanine}` : "—";
  if (t === "percentile") return e.percentile != null ? `${e.percentile}th %ile` : "—";
  if (t === "multi") {
    if (!e.multi_score) return "—";
    try {
      return typeof e.multi_score === "string" ? e.multi_score : JSON.stringify(e.multi_score);
    } catch {
      return "—";
    }
  }
  return e.raw_score != null ? String(e.raw_score) : "—";
}

export default function AssessmentsPage() {
  const router = useRouter();

  // data
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [instruments, setInstruments] = useState<InstrumentRow[]>([]);
  const [recentEvidence, setRecentEvidence] = useState<EvidenceRow[]>([]);

  // status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  // filters / selections
  const [classId, setClassId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [term, setTerm] = useState<(typeof TERM_OPTIONS)[number]>("T1");

  // instrument picker
  const [instrumentSearch, setInstrumentSearch] = useState("");
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>("");

  // entry fields
  const [assessedAt, setAssessedAt] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [scoreType, setScoreType] = useState<ScoreType>("raw");
  const [rawScore, setRawScore] = useState<string>("");
  const [stanine, setStanine] = useState<string>("");
  const [percentile, setPercentile] = useState<string>("");
  const [multiScoreJson, setMultiScoreJson] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // derived
  const classStudents = useMemo(() => {
    if (!classId) return students;
    return students.filter((s) => s.class_id === classId);
  }, [students, classId]);

  const studentMap = useMemo(() => {
    const m = new Map<string, StudentRow>();
    students.forEach((s) => m.set(s.id, s));
    return m;
  }, [students]);

  const classMap = useMemo(() => {
    const m = new Map<string, ClassRow>();
    classes.forEach((c) => m.set(c.id, c));
    return m;
  }, [classes]);

  const instrumentMap = useMemo(() => {
    const m = new Map<string, InstrumentRow>();
    instruments.forEach((i) => m.set(i.id, i));
    return m;
  }, [instruments]);

  const selectedInstrument = useMemo(() => {
    return selectedInstrumentId ? instrumentMap.get(selectedInstrumentId) : undefined;
  }, [selectedInstrumentId, instrumentMap]);

  const filteredInstruments = useMemo(() => {
    const q = instrumentSearch.trim().toLowerCase();
    const list = instruments.slice().sort((a, b) => {
      const da = (a.domain || "General").trim();
      const db = (b.domain || "General").trim();
      const oa = domainOrder(da);
      const ob = domainOrder(db);
      if (oa !== ob) return oa - ob;
      if (da !== db) return da.localeCompare(db);
      const an = (a.instrument_name || "").localeCompare(b.instrument_name || "");
      if (an !== 0) return an;
      return (a.instrument_code || "").localeCompare(b.instrument_code || "");
    });

    if (!q) return list;

    return list.filter((i) => {
      const name = (i.instrument_name || "").toLowerCase();
      const code = (i.instrument_code || "").toLowerCase();
      const domain = (i.domain || "").toLowerCase();
      return name.includes(q) || code.includes(q) || domain.includes(q);
    });
  }, [instruments, instrumentSearch]);

  const instrumentsByDomain = useMemo(() => {
    const groups = new Map<string, InstrumentRow[]>();
    filteredInstruments.forEach((i) => {
      const key = (i.domain || "General").trim() || "General";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(i);
    });
    return Array.from(groups.entries()).sort((a, b) => {
      const oa = domainOrder(a[0]);
      const ob = domainOrder(b[0]);
      if (oa !== ob) return oa - ob;
      return a[0].localeCompare(b[0]);
    });
  }, [filteredInstruments]);

  // Load everything
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");

      try {
        const [
          { data: classData, error: classErr },
          { data: studentData, error: studentErr },
          { data: instData, error: instErr },
        ] = await Promise.all([
          supabase
            .from(CLASSES_TABLE)
            .select("id,name,year_level")
            .order("year_level", { ascending: true })
            .order("name", { ascending: true }),
          supabase
            .from(STUDENTS_TABLE)
            .select("id,first_name,preferred_name,is_ilp,class_id")
            .order("preferred_name", { ascending: true }),
          supabase
            .from(INSTRUMENTS_TABLE)
            .select("id,instrument_code,instrument_name,domain,score_type")
            .order("domain", { ascending: true })
            .order("instrument_name", { ascending: true }),
        ]);

        if (classErr) throw classErr;
        if (studentErr) throw studentErr;
        if (instErr) throw instErr;

        if (cancelled) return;

        setClasses((classData || []) as ClassRow[]);
        setStudents((studentData || []) as StudentRow[]);
        setInstruments((instData || []) as InstrumentRow[]);

        const firstClassId = (classData || [])[0]?.id || "";
        setClassId((prev) => prev || firstClassId);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load evidence when filters change
  useEffect(() => {
    let cancelled = false;

    async function loadEvidence() {
      setError("");

      try {
        let q = supabase
          .from(EVIDENCE_TABLE)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (studentId) q = q.eq("student_id", studentId);

        const { data, error: evErr } = await q;
        if (evErr) throw evErr;

        let rows = (data || []) as EvidenceRow[];

        if (classId && !studentId) {
          const allowed = new Set(students.filter((s) => s.class_id === classId).map((s) => s.id));
          rows = rows.filter((r) => (r.student_id ? allowed.has(r.student_id) : false));
        }

        const enriched = rows.map((r) => {
          const s = r.student_id ? studentMap.get(r.student_id) : undefined;
          const c = s?.class_id ? classMap.get(s.class_id) : undefined;
          const instId = (r as any)[EVIDENCE_INSTRUMENT_FK] as string | undefined;
          const inst = instId ? instrumentMap.get(instId) : undefined;

          return {
            ...r,
            student_name: s ? safeName(s) : "—",
            class_name: c ? classLabel(c) : "—",
            instrument_name: inst?.instrument_name || "—",
            instrument_code: inst?.instrument_code || "",
            instrument_domain: inst?.domain || "General",
          };
        });

        if (!cancelled) setRecentEvidence(enriched);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Load evidence failed");
      }
    }

    if (!loading) loadEvidence();
    return () => {
      cancelled = true;
    };
  }, [loading, classId, studentId, students, studentMap, classMap, instrumentMap]);

  // Sync score type to instrument
  useEffect(() => {
    if (!selectedInstrument) return;
    const st = normScoreType(selectedInstrument.score_type);
    setScoreType(st);
    setRawScore("");
    setStanine("");
    setPercentile("");
    setMultiScoreJson("");
  }, [selectedInstrumentId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveEvidence() {
    setError("");

    if (!studentId) return setError("Select a student first.");
    if (!selectedInstrumentId) return setError("Select an assessment instrument first.");

    const payload: any = {
      student_id: studentId,
      term,
      assessed_at: assessedAt || null,
      score_type: scoreType,
      notes: notes.trim() || null,
      [EVIDENCE_INSTRUMENT_FK]: selectedInstrumentId,
    };

    if (scoreType === "raw") {
      const n = rawScore.trim() === "" ? null : Number(rawScore);
      if (n != null && Number.isNaN(n)) return setError("Raw score must be a number.");
      payload.raw_score = n;
      payload.stanine = null;
      payload.percentile = null;
      payload.multi_score = null;
    } else if (scoreType === "stanine") {
      const n = stanine.trim() === "" ? null : Number(stanine);
      if (n != null && (Number.isNaN(n) || n < 1 || n > 9)) return setError("Stanine must be 1 to 9.");
      payload.raw_score = null;
      payload.stanine = n;
      payload.percentile = null;
      payload.multi_score = null;
    } else if (scoreType === "percentile") {
      const n = percentile.trim() === "" ? null : Number(percentile);
      if (n != null && (Number.isNaN(n) || n < 0 || n > 100)) return setError("Percentile must be 0 to 100.");
      payload.raw_score = null;
      payload.stanine = null;
      payload.percentile = n;
      payload.multi_score = null;
    } else {
      let v: any = null;
      const txt = multiScoreJson.trim();
      if (txt) {
        try {
          v = JSON.parse(txt);
        } catch {
          return setError('Multi-score must be valid JSON (e.g. {"subscaleA": 12, "subscaleB": 18}).');
        }
      }
      payload.raw_score = null;
      payload.stanine = null;
      payload.percentile = null;
      payload.multi_score = v;
    }

    setSaving(true);
    try {
      const { error: insErr } = await supabase.from(EVIDENCE_TABLE).insert(payload);
      if (insErr) throw insErr;

      setNotes("");
      setRawScore("");
      setStanine("");
      setPercentile("");
      setMultiScoreJson("");

      // refresh
      const { data, error: evErr } = await supabase
        .from(EVIDENCE_TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (evErr) throw evErr;

      let rows = (data || []) as EvidenceRow[];

      if (studentId) rows = rows.filter((r) => r.student_id === studentId);
      else if (classId) {
        const allowed = new Set(students.filter((s) => s.class_id === classId).map((s) => s.id));
        rows = rows.filter((r) => (r.student_id ? allowed.has(r.student_id) : false));
      }

      const enriched = rows.map((r) => {
        const s = r.student_id ? studentMap.get(r.student_id) : undefined;
        const c = s?.class_id ? classMap.get(s.class_id) : undefined;
        const instId = (r as any)[EVIDENCE_INSTRUMENT_FK] as string | undefined;
        const inst = instId ? instrumentMap.get(instId) : undefined;

        return {
          ...r,
          student_name: s ? safeName(s) : "—",
          class_name: c ? classLabel(c) : "—",
          instrument_name: inst?.instrument_name || "—",
          instrument_code: inst?.instrument_code || "",
          instrument_domain: inst?.domain || "General",
        };
      });

      setRecentEvidence(enriched.slice(0, 50));
    } catch (e: any) {
      setError("Not saved yet");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-white text-slate-900">
      {/* Top bar (blue, like the dashboards you shared) */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-700">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-white/15 ring-1 ring-white/25" />
            <div className="text-white">
              <div className="text-sm font-semibold tracking-tight">Assessments</div>
              <div className="text-xs text-white/80">Enter evidence • instruments • recent entries</div>
            </div>
          </div>

          <button
            onClick={() => router.push("/app/admin")}
            className="rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/25 hover:bg-white/20"
          >
            Back to Admin
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-5 lg:grid-cols-12">
        {/* Left column */}
        <div className="lg:col-span-4">
          {/* Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-slate-900">Filters</div>

            <label className="mb-1 block text-xs font-medium text-slate-600">Class</label>
            <select
              className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setStudentId("");
              }}
            >
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {classLabel(c)}
                </option>
              ))}
            </select>

            <label className="mb-1 block text-xs font-medium text-slate-600">Student</label>
            <select
              className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">All students</option>
              {classStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {safeName(s)} {s.is_ilp ? "• ILP" : ""}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Term</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={term}
                  onChange={(e) => setTerm(e.target.value as any)}
                >
                  {TERM_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={assessedAt}
                  onChange={(e) => setAssessedAt(e.target.value)}
                />
              </div>
            </div>

            {error ? (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {error}
              </div>
            ) : null}

            {loading ? <div className="mt-3 text-xs text-slate-500">Loading…</div> : null}
          </div>

          {/* Instrument picker */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Assessment instrument</div>
              <div className="text-[11px] text-slate-500">{instruments.length} total</div>
            </div>

            <input
              value={instrumentSearch}
              onChange={(e) => setInstrumentSearch(e.target.value)}
              placeholder="Search instruments (name / code / domain)…"
              className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />

            <div className="max-h-[340px] overflow-auto rounded-xl border border-slate-200 bg-white">
              {instrumentsByDomain.length === 0 ? (
                <div className="p-3 text-xs text-slate-500">No instruments match your search.</div>
              ) : (
                instrumentsByDomain.map(([domain, list]) => (
                  <div key={domain} className="border-b border-slate-100 last:border-b-0">
                    <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700">
                      {domain}
                    </div>
                    <div className="p-2">
                      {list.map((i) => {
                        const active = selectedInstrumentId === i.id;
                        return (
                          <button
                            key={i.id}
                            onClick={() => setSelectedInstrumentId(i.id)}
                            className={cx(
                              "mb-1 w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                              active
                                ? "border-blue-300 bg-blue-50"
                                : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                            )}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate font-semibold text-slate-900">
                                  {i.instrument_name || "Unnamed instrument"}
                                </div>
                                <div className="truncate text-[11px] text-slate-500">
                                  {(i.instrument_code || "—")} • score: {normScoreType(i.score_type)}
                                </div>
                              </div>
                              {active ? (
                                <div className="rounded-lg bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white">
                                  Selected
                                </div>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedInstrument ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <div className="font-semibold">Selected</div>
                <div className="text-slate-600">
                  {(selectedInstrument.domain || "General")} • {(selectedInstrument.instrument_code || "—")} •{" "}
                  {(selectedInstrument.instrument_name || "—")}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-xs text-slate-500">Select an instrument to enable score entry.</div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-8">
          {/* Entry card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Add evidence entry</div>
                <div className="text-xs text-slate-500">Choose student + instrument, then enter a score and save.</div>
              </div>

              <button
                onClick={saveEvidence}
                disabled={saving || loading}
                className={cx(
                  "rounded-xl px-4 py-2 text-sm font-semibold",
                  saving || loading
                    ? "cursor-not-allowed bg-slate-200 text-slate-500"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                {saving ? "Saving…" : "Save evidence"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <label className="mb-1 block text-xs font-medium text-slate-600">Student</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                >
                  <option value="">Select a student…</option>
                  {classStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {safeName(s)} {s.is_ilp ? "• ILP" : ""}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-[11px] text-slate-500">Tip: filter by class on the left first.</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <label className="mb-1 block text-xs font-medium text-slate-600">Score type</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={scoreType}
                  onChange={(e) => setScoreType(e.target.value as ScoreType)}
                  disabled={!selectedInstrumentId}
                >
                  <option value="raw">Raw</option>
                  <option value="stanine">Stanine</option>
                  <option value="percentile">Percentile</option>
                  <option value="multi">Multi</option>
                </select>

                <div className="mt-3">
                  {scoreType === "raw" ? (
                    <>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Raw score</label>
                      <input
                        value={rawScore}
                        onChange={(e) => setRawScore(e.target.value)}
                        placeholder="e.g. 24"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        disabled={!selectedInstrumentId}
                      />
                    </>
                  ) : null}

                  {scoreType === "stanine" ? (
                    <>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Stanine (1–9)</label>
                      <input
                        value={stanine}
                        onChange={(e) => setStanine(e.target.value)}
                        placeholder="e.g. 6"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        disabled={!selectedInstrumentId}
                      />
                    </>
                  ) : null}

                  {scoreType === "percentile" ? (
                    <>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Percentile (0–100)</label>
                      <input
                        value={percentile}
                        onChange={(e) => setPercentile(e.target.value)}
                        placeholder="e.g. 72"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        disabled={!selectedInstrumentId}
                      />
                    </>
                  ) : null}

                  {scoreType === "multi" ? (
                    <>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Multi-score JSON</label>
                      <textarea
                        value={multiScoreJson}
                        onChange={(e) => setMultiScoreJson(e.target.value)}
                        placeholder='e.g. {"subscaleA": 12, "subscaleB": 18}'
                        className="h-[92px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        disabled={!selectedInstrumentId}
                      />
                      <div className="mt-1 text-[11px] text-slate-500">Use JSON for tests with multiple subscales.</div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
              <label className="mb-1 block text-xs font-medium text-slate-600">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Context, adjustments, observations…"
                className="h-[88px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <div className="mt-2 text-[11px] text-slate-500">
                Saved into <span className="font-semibold text-slate-700">{EVIDENCE_TABLE}</span>.
              </div>
            </div>
          </div>

          {/* Recent entries */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2">
              <div className="text-sm font-semibold text-slate-900">Recent evidence</div>
              <div className="text-xs text-slate-500">Showing up to 50 (filtered by class/student where possible)</div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="grid grid-cols-12 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700">
                <div className="col-span-3">Student</div>
                <div className="col-span-3">Instrument</div>
                <div className="col-span-2">Domain</div>
                <div className="col-span-2">Score</div>
                <div className="col-span-2 text-right">Date</div>
              </div>

              <div className="max-h-[420px] overflow-auto bg-white">
                {recentEvidence.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500">No entries yet.</div>
                ) : (
                  recentEvidence.map((r) => (
                    <div key={r.id} className="grid grid-cols-12 gap-2 border-t border-slate-100 px-3 py-2 text-sm">
                      <div className="col-span-3 min-w-0">
                        <div className="truncate font-semibold text-slate-900">{r.student_name || "—"}</div>
                        <div className="truncate text-[11px] text-slate-500">{r.class_name || "—"}</div>
                      </div>

                      <div className="col-span-3 min-w-0">
                        <div className="truncate font-semibold text-slate-900">{r.instrument_name || "—"}</div>
                        <div className="truncate text-[11px] text-slate-500">{r.instrument_code || ""}</div>
                      </div>

                      <div className="col-span-2 truncate text-slate-700">{r.instrument_domain || "General"}</div>

                      <div className="col-span-2 truncate text-slate-900">{formatScore(r)}</div>

                      <div className="col-span-2 text-right text-slate-600">
                        {(r.assessed_at || r.created_at || "").slice(0, 10) || "—"}
                      </div>

                      {r.notes ? (
                        <div className="col-span-12 mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-700">
                          {r.notes}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-2 text-[11px] text-slate-500">
              If you want row-click → student profile, tell me your route pattern (e.g.{" "}
              <span className="font-semibold text-slate-700">/app/admin/students/[id]</span>) and I’ll wire it in.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
