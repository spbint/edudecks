"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Scope = "class" | "year" | "keystage";

type ClassRow = {
  id: string;
  name: string | null;
  year_level: number | null;
};

type StudentRow = {
  id: string;
  first_name: string | null;
  preferred_name: string | null;
  class_id: string | null;
};

type Signal = {
  student_id: string;
  student_name: string;
  class_id: string;
  signal_type: string;
  signal_detail: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function safe(s: string | null | undefined, fallback = "") {
  const x = (s ?? "").trim();
  return x ? x : fallback;
}
function safeClassName(name: string | null) {
  const s = (name ?? "").trim();
  return s ? s : "Unnamed class";
}
function fmtYear(y: number | null) {
  if (y == null) return "Y?";
  return `Y${y}`;
}
function studentName(s: StudentRow) {
  const pref = (s.preferred_name ?? "").trim();
  const first = (s.first_name ?? "").trim();
  return (pref || first || "Unnamed student").trim();
}

function Pill({
  text,
  tone = "muted",
}: {
  text: string;
  tone?: "muted" | "warn" | "ok";
}) {
  const cls =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={cx("inline-flex items-center rounded-full border px-3 py-1 text-[13px] font-semibold", cls)}>
      {text}
    </span>
  );
}

const LAST_CLASS_KEY = "fm_dashboard_last_class_v1";
function readLastClassId(): string | null {
  try {
    return localStorage.getItem(LAST_CLASS_KEY);
  } catch {
    return null;
  }
}
function writeLastClassId(id: string) {
  try {
    localStorage.setItem(LAST_CLASS_KEY, id);
  } catch {}
}

export default function DashboardPage() {
  // scope + filters
  const [scope, setScope] = useState<Scope>("class");
  const [classId, setClassId] = useState<string>("");
  const [yearLevel, setYearLevel] = useState<number>(4);
  const [keyStage, setKeyStage] = useState<string>("KS2");

  // core data
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);

  // optional signals
  const [signals, setSignals] = useState<Signal[]>([]);
  const [signalsErr, setSignalsErr] = useState<string>("");

  // page state
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // messages
  const [toast, setToast] = useState<string>("");
  const [err, setErr] = useState<string>("");

  // Evidence / Note modal state
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [activeStudentName, setActiveStudentName] = useState<string>("");

  // Form fields
  const [evidenceText, setEvidenceText] = useState("");
  const [noteText, setNoteText] = useState("");

  // student search
  const [studentQ, setStudentQ] = useState("");

  const selectedClass = useMemo(() => {
    if (!classId) return null;
    return classes.find((c) => c.id === classId) ?? null;
  }, [classes, classId]);

  const scopeLabel = useMemo(() => {
    if (scope === "class") {
      if (!selectedClass) return "Class (not selected)";
      return `${safeClassName(selectedClass.name)} (${fmtYear(selectedClass.year_level)})`;
    }
    if (scope === "year") return `Year ${yearLevel}`;
    return `${keyStage}`;
  }, [scope, selectedClass, yearLevel, keyStage]);

  const loadCore = async () => {
    setLoading(true);
    setErr("");
    setToast("");

    const [cRes, sRes] = await Promise.all([
      supabase
        .from("classes")
        .select("id,name,year_level")
        .order("year_level", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("students")
        .select("id,first_name,preferred_name,class_id")
        .order("first_name", { ascending: true }),
    ]);

    if (cRes.error) setErr(`Load classes failed: ${cRes.error.message}`);
    if (sRes.error) setErr((prev) => prev || `Load students failed: ${sRes.error?.message}`);

    const cData = (cRes.data as ClassRow[]) ?? [];
    const sData = (sRes.data as StudentRow[]) ?? [];

    setClasses(cData);
    setStudents(sData);

    // pick class selection safely
    const last = readLastClassId();
    const counts: Record<string, number> = {};
    for (const s of sData) {
      if (!s.class_id) continue;
      counts[s.class_id] = (counts[s.class_id] ?? 0) + 1;
    }
    const mostPopulated = cData.slice().sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))[0]?.id;

    setClassId((prev) => {
      const preferred = prev || last || mostPopulated || cData[0]?.id || "";
      return cData.some((c) => c.id === preferred) ? preferred : cData[0]?.id || "";
    });

    setLoading(false);
  };

  const fetchSignalsOptional = async () => {
    setSignalsErr("");

    const { data, error } = await supabase
      .from("v_support_signals")
      .select("student_id, student_name, class_id, signal_type, signal_detail")
      .limit(500);

    if (error) {
      setSignals([]);
      setSignalsErr(`Support signals not configured (optional). ${error.message}`);
      return;
    }

    setSignals((data as Signal[]) ?? []);
  };

  useEffect(() => {
    loadCore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (classId) writeLastClassId(classId);
  }, [classId]);

  useEffect(() => {
    fetchSignalsOptional();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const studentsInClass = useMemo(() => {
    if (!classId) return [];
    const query = studentQ.trim().toLowerCase();

    return students
      .filter((s) => s.class_id === classId)
      .filter((s) => {
        if (!query) return true;
        const hay = `${studentName(s)} ${s.id}`.toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => studentName(a).localeCompare(studentName(b)));
  }, [students, classId, studentQ]);

  const visibleSignals = useMemo(() => {
    if (!signals.length) return [];
    if (scope === "class" && classId) return signals.filter((s) => s.class_id === classId);
    return signals;
  }, [signals, scope, classId]);

  const openEvidenceFor = (studentId: string, nameHint?: string) => {
    setErr("");
    setToast("");
    setActiveStudentId(studentId);
    setActiveStudentName(nameHint ?? "");
    setEvidenceText("");
    setEvidenceOpen(true);
  };

  const openNoteFor = (studentId: string, nameHint?: string) => {
    setErr("");
    setToast("");
    setActiveStudentId(studentId);
    setActiveStudentName(nameHint ?? "");
    setNoteText("");
    setNoteOpen(true);
  };

  const closeEvidence = () => setEvidenceOpen(false);
  const closeNote = () => setNoteOpen(false);

  const saveEvidence = async () => {
    if (!activeStudentId) return;

    const note = evidenceText.trim();
    if (!note) {
      setErr("Evidence cannot be blank.");
      return;
    }

    setBusy(true);
    setErr("");
    setToast("");

    try {
      const nowIso = new Date().toISOString();

      const { error } = await supabase.from("evidence_entries").insert({
        student_id: activeStudentId,
        note,
        occurred_on: nowIso,
        created_at: nowIso,
      });

      if (error) {
        setErr(`Save evidence failed: ${error.message}`);
        setBusy(false);
        return;
      }

      setEvidenceOpen(false);
      setEvidenceText("");
      setToast("Evidence saved ✅");
      setTimeout(() => setToast(""), 1400);
    } catch (e: any) {
      setErr(`Save evidence failed: ${e?.message ?? "Unknown error"}`);
    }

    setBusy(false);
  };

  const saveNote = async () => {
    if (!activeStudentId) return;
    setNoteOpen(false);
    setToast("Note saved (placeholder) ✅");
    setTimeout(() => setToast(""), 1200);
  };

  if (loading) {
    return (
      <div className="dash-page">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="dash-card p-5">
            <div className="text-[12px] font-semibold tracking-widest text-slate-500">DASHBOARD</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">Loading…</div>
            <div className="mt-3 text-sm text-slate-600">Fetching classes + students.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        {/* HERO */}
        <section className="dash-card overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[12px] font-semibold tracking-widest text-slate-500">DASHBOARD</div>
                <div className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Admin Overview</div>
                <div className="mt-2 text-sm text-slate-600">
                  Scope: <span className="font-semibold text-slate-900">{scopeLabel}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill text={`Classes: ${classes.length}`} />
                  <Pill text={`Students: ${students.length}`} />
                  <Pill text={`Signals: ${visibleSignals.length}`} tone={visibleSignals.length ? "warn" : "muted"} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <select
                  className="dash-input"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as Scope)}
                  disabled={busy}
                  style={{ width: 180 }}
                >
                  <option value="class">Class</option>
                  <option value="year">Year</option>
                  <option value="keystage">Key Stage</option>
                </select>

                <select
                  className={cx("dash-input", scope !== "class" && "opacity-50")}
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  disabled={busy || scope !== "class"}
                  style={{ width: 320 }}
                  title="Select a class"
                >
                  {classes.length === 0 ? <option value="">No classes</option> : null}
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {safeClassName(c.name)} ({fmtYear(c.year_level)})
                    </option>
                  ))}
                </select>

                <input
                  className={cx("dash-input", scope !== "year" && "opacity-50")}
                  value={String(yearLevel)}
                  onChange={(e) => setYearLevel(Number(e.target.value || 0))}
                  disabled={busy || scope !== "year"}
                  placeholder="Year"
                  style={{ width: 120 }}
                />

                <input
                  className={cx("dash-input", scope !== "keystage" && "opacity-50")}
                  value={keyStage}
                  onChange={(e) => setKeyStage(e.target.value)}
                  disabled={busy || scope !== "keystage"}
                  placeholder="Key stage"
                  style={{ width: 140 }}
                />

                <button className="dash-btn dash-btn-muted" onClick={loadCore} disabled={busy} type="button">
                  Refresh
                </button>
              </div>
            </div>

            {err ? <div className="mt-4 dash-alert">{err}</div> : null}
            {toast ? <div className="mt-4 text-sm font-semibold text-emerald-700">{toast}</div> : null}
          </div>
        </section>

        {/* QUICK EVIDENCE: class roster */}
        <section className="dash-card">
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-lg font-semibold text-slate-900">Class roster (quick evidence)</div>
                <div className="mt-1 text-sm text-slate-600">
                  Fast evidence entry without leaving the dashboard.
                </div>
              </div>

              <div className="text-sm text-slate-600">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {scope !== "class" ? 0 : studentsInClass.length}
                </span>
              </div>
            </div>

            <input
              className="dash-input mt-4"
              placeholder="Search students in this class…"
              value={studentQ}
              onChange={(e) => setStudentQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setStudentQ("");
              }}
              disabled={busy || scope !== "class"}
              style={{ fontSize: 15, fontWeight: 600 }}
            />

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="max-h-[460px] overflow-auto">
                {scope !== "class" ? (
                  <div className="p-4 text-sm text-slate-600">
                    Switch scope to <span className="font-semibold text-slate-900">Class</span> to use quick evidence.
                  </div>
                ) : !classId ? (
                  <div className="p-4 text-sm text-slate-600">Select a class first.</div>
                ) : studentsInClass.length === 0 ? (
                  <div className="p-4 text-sm text-slate-600">No students assigned to this class.</div>
                ) : (
                  <table className="w-full border-collapse text-left">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-[12px] font-semibold tracking-widest text-slate-500">STUDENT</th>
                        <th className="px-4 py-3 text-right text-[12px] font-semibold tracking-widest text-slate-500">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsInClass.map((s) => (
                        <tr key={s.id} className="border-b border-slate-100">
                          <td className="px-4 py-3">
                            <div className="text-sm font-semibold text-slate-900">{studentName(s)}</div>
                            <div className="mt-1 text-[12px] text-slate-500">
                              <code className="text-[11px]">{s.id}</code>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                className="dash-btn dash-btn-primary"
                                onClick={() => openEvidenceFor(s.id, studentName(s))}
                                disabled={busy}
                                type="button"
                              >
                                Evidence
                              </button>
                              <button
                                className="dash-btn dash-btn-muted"
                                onClick={() => openNoteFor(s.id, studentName(s))}
                                disabled={busy}
                                type="button"
                              >
                                Note
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="mt-3 text-sm text-slate-500">
              Tip: press <span className="font-semibold text-slate-700">Esc</span> in search to clear quickly.
            </div>
          </div>
        </section>

        {/* OPTIONAL: SUPPORT SIGNALS */}
        <section className="dash-card">
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-lg font-semibold text-slate-900">Support Signals (optional)</div>
                <div className="mt-1 text-sm text-slate-600">
                  If <code>v_support_signals</code> doesn’t exist, we’ll show a polite info message.
                </div>
              </div>

              <div className="text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-900">{visibleSignals.length}</span>
              </div>
            </div>

            {signalsErr ? <div className="mt-4 dash-alert">{signalsErr}</div> : null}

            {visibleSignals.length === 0 ? (
              <div className="mt-4 text-sm text-slate-600">No signals right now. (That’s fine.)</div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="max-h-[520px] overflow-auto">
                  <table className="w-full border-collapse text-left">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-[12px] font-semibold tracking-widest text-slate-500">STUDENT</th>
                        <th className="px-4 py-3 text-[12px] font-semibold tracking-widest text-slate-500">SIGNAL</th>
                        <th className="px-4 py-3 text-[12px] font-semibold tracking-widest text-slate-500">DETAIL</th>
                        <th className="px-4 py-3 text-right text-[12px] font-semibold tracking-widest text-slate-500">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleSignals.map((s) => (
                        <tr key={`${s.student_id}-${s.signal_type}`} className="border-b border-slate-100">
                          <td className="px-4 py-3">
                            <div className="text-sm font-semibold text-slate-900">{s.student_name}</div>
                            <div className="mt-1 text-[12px] text-slate-500">
                              <code className="text-[11px]">{s.student_id}</code>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[13px] font-semibold text-slate-700">
                              {safe(s.signal_type, "Signal")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">
                            {safe(s.signal_detail, "—")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                className="dash-btn dash-btn-muted"
                                onClick={() => openEvidenceFor(s.student_id, s.student_name)}
                                disabled={busy}
                                type="button"
                              >
                                Evidence
                              </button>
                              <button
                                className="dash-btn dash-btn-muted"
                                onClick={() => openNoteFor(s.student_id, s.student_name)}
                                disabled={busy}
                                type="button"
                              >
                                Note
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Evidence Modal */}
        {evidenceOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="border-b border-slate-100 p-5">
                <div className="text-[12px] font-semibold tracking-widest text-slate-500">ADD EVIDENCE</div>
                <div className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{activeStudentName || "Student"}</div>
              </div>

              <div className="p-5">
                <textarea
                  className="dash-textarea"
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  placeholder="Evidence note…"
                  style={{ minHeight: 160, fontSize: 15, fontWeight: 600 }}
                  disabled={busy}
                />
                <div className="mt-2 text-sm text-slate-500">
                  Saves to <code>evidence_entries.note</code> with <code>occurred_on</code> = now.
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 p-5">
                <button className="dash-btn dash-btn-muted" onClick={closeEvidence} disabled={busy} type="button">
                  Cancel
                </button>
                <button className="dash-btn dash-btn-primary" onClick={saveEvidence} disabled={busy} type="button">
                  {busy ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Note Modal (placeholder) */}
        {noteOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="border-b border-slate-100 p-5">
                <div className="text-[12px] font-semibold tracking-widest text-slate-500">ADD NOTE</div>
                <div className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{activeStudentName || "Student"}</div>
              </div>

              <div className="p-5">
                <textarea
                  className="dash-textarea"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Teacher note…"
                  style={{ minHeight: 160, fontSize: 15, fontWeight: 600 }}
                  disabled={busy}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 p-5">
                <button className="dash-btn dash-btn-muted" onClick={closeNote} disabled={busy} type="button">
                  Cancel
                </button>
                <button className="dash-btn dash-btn-primary" onClick={saveNote} disabled={busy} type="button">
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
