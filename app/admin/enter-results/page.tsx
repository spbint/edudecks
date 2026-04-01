"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import TeacherTaskInbox from "@/app/teacher/components/TeacherTaskInbox";
import StudentQuickViewDrawer from "@/app/admin/components/StudentQuickViewDrawer";

/** Minimal shapes */
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
  assessment_id?: string | null;
};

type JoinRowA = { class_id: string; instrument_id: string };
type JoinRowB = { class_id: string; assessment_instrument_id: string };

type RowDraft = {
  score: string;
  note: string;
};

function safe(v: any) {
  return String(v ?? "").trim();
}

export default function EnterResultsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [instruments, setInstruments] = useState<InstrumentRow[]>([]);

  const [classInstrumentIds, setClassInstrumentIds] = useState<Set<string>>(new Set());
  const [hasClassInstrumentJoin, setHasClassInstrumentJoin] = useState<boolean>(false);

  const [classId, setClassId] = useState<string>("");
  const [instrumentId, setInstrumentId] = useState<string>("");

  const [assessedAt, setAssessedAt] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const [search, setSearch] = useState<string>("");
  const [showILPOnly, setShowILPOnly] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});

  const [quickViewStudentId, setQuickViewStudentId] = useState<string | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  /* ───────────────────────── AUTH GUARD ───────────────────────── */

  useEffect(() => {
    const guard = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) window.location.href = "/";
    };
    guard();
  }, []);

  /* ───────────────────────── LOADERS ───────────────────────── */

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
      const list = (cData as ClassRow[]) ?? [];
      setClasses(list);
      if (!classId && list.length > 0) setClassId(list[0].id);
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

    const tryWithAssessmentId = await supabase
      .from("assessment_instruments")
      .select("id, instrument_code, instrument_name, assessment_id")
      .order("instrument_name", { ascending: true });

    if (tryWithAssessmentId.error) {
      const fallback = await supabase
        .from("assessment_instruments")
        .select("id, instrument_code, instrument_name")
        .order("instrument_name", { ascending: true });

      if (fallback.error) {
        setErr(`Load assessment instruments failed: ${fallback.error.message}`);
        setInstruments([]);
      } else {
        const list = (fallback.data as InstrumentRow[]) ?? [];
        setInstruments(list);
        if (!instrumentId && list.length > 0) setInstrumentId(list[0].id);
      }
    } else {
      const list = (tryWithAssessmentId.data as InstrumentRow[]) ?? [];
      setInstruments(list);
      if (!instrumentId && list.length > 0) setInstrumentId(list[0].id);
    }

    const joinA = await supabase.from("class_assessment_instruments").select("class_id, instrument_id");

    if (!joinA.error) {
      setHasClassInstrumentJoin(true);
      const set = new Set<string>();
      for (const r of (joinA.data as JoinRowA[]) ?? []) {
        if (r.class_id === classId && r.instrument_id) set.add(r.instrument_id);
      }
      setClassInstrumentIds(set);
    } else {
      const joinB = await supabase.from("class_assessment_instruments").select("class_id, assessment_instrument_id");

      if (!joinB.error) {
        setHasClassInstrumentJoin(true);
        const set = new Set<string>();
        for (const r of (joinB.data as JoinRowB[]) ?? []) {
          if (r.class_id === classId && r.assessment_instrument_id) set.add(r.assessment_instrument_id);
        }
        setClassInstrumentIds(set);
      } else {
        setHasClassInstrumentJoin(false);
        setClassInstrumentIds(new Set());
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const refreshJoinForClass = async () => {
      if (!classId) return;

      const joinA = await supabase.from("class_assessment_instruments").select("class_id, instrument_id");
      if (!joinA.error) {
        setHasClassInstrumentJoin(true);
        const set = new Set<string>();
        for (const r of (joinA.data as JoinRowA[]) ?? []) {
          if (r.class_id === classId && r.instrument_id) set.add(r.instrument_id);
        }
        setClassInstrumentIds(set);
        return;
      }

      const joinB = await supabase.from("class_assessment_instruments").select("class_id, assessment_instrument_id");
      if (!joinB.error) {
        setHasClassInstrumentJoin(true);
        const set = new Set<string>();
        for (const r of (joinB.data as JoinRowB[]) ?? []) {
          if (r.class_id === classId && r.assessment_instrument_id) set.add(r.assessment_instrument_id);
        }
        setClassInstrumentIds(set);
        return;
      }

      setHasClassInstrumentJoin(false);
      setClassInstrumentIds(new Set());
    };

    refreshJoinForClass();
  }, [classId]);

  /* ───────────────────────── HELPERS ───────────────────────── */

  const classById = useMemo(() => {
    const m = new Map<string, ClassRow>();
    for (const c of classes) m.set(c.id, c);
    return m;
  }, [classes]);

  const studentName = (s: StudentRow) => {
    const pref = safe(s.preferred_name);
    const first = safe(s.first_name);
    return pref || first || "Unnamed student";
  };

  const roster = useMemo(() => {
    const q = search.trim().toLowerCase();

    return students
      .filter((s) => (classId ? s.class_id === classId : true))
      .filter((s) => (!showILPOnly ? true : !!s.is_ilp))
      .filter((s) => {
        if (!q) return true;
        const name = studentName(s).toLowerCase();
        return name.includes(q) || s.id.toLowerCase().includes(q);
      })
      .sort((a, b) => studentName(a).localeCompare(studentName(b)));
  }, [students, classId, search, showILPOnly]);

  const filteredInstruments = useMemo(() => {
    if (!hasClassInstrumentJoin) return instruments;
    if (!classId) return instruments;
    if (classInstrumentIds.size === 0) return instruments;
    return instruments.filter((i) => classInstrumentIds.has(i.id));
  }, [instruments, hasClassInstrumentJoin, classId, classInstrumentIds]);

  const selectedInstrument = useMemo(
    () => instruments.find((i) => i.id === instrumentId) ?? null,
    [instruments, instrumentId]
  );

  const setDraft = (studentId: string, patch: Partial<RowDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        score: prev[studentId]?.score ?? "",
        note: prev[studentId]?.note ?? "",
        ...patch,
      },
    }));
  };

  const clearDrafts = () => setDrafts({});

  const draftCount = useMemo(() => {
    return roster.filter((s) => {
      const d = drafts[s.id];
      return !!d && (safe(d.score) || safe(d.note));
    }).length;
  }, [roster, drafts]);

  const completedCount = useMemo(() => {
    return roster.filter((s) => !!safe(drafts[s.id]?.score)).length;
  }, [roster, drafts]);

  const missingCount = Math.max(0, roster.length - completedCount);

  const scoreStats = useMemo(() => {
    const nums = roster
      .map((s) => Number(drafts[s.id]?.score))
      .filter((n) => Number.isFinite(n));
    if (!nums.length) return { average: "—" };
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return { average: avg.toFixed(1) };
  }, [roster, drafts]);

  const flaggedForFollowUp = useMemo(() => {
    return roster.filter((s) => {
      const d = drafts[s.id];
      const n = Number(d?.score);
      const hasLowScore = Number.isFinite(n) && n < 50;
      const hasConcernNote = /concern|follow|support|intervention|misconception|needs/i.test(safe(d?.note));
      return hasLowScore || hasConcernNote;
    }).length;
  }, [roster, drafts]);

  /* ───────────────────────── SAVE ───────────────────────── */

  const saveAllEntered = async () => {
    setErr("");
    setOk("");

    if (!classId) return setErr("Choose a class first.");
    if (!instrumentId) return setErr("Choose an instrument first.");
    if (!assessedAt) return setErr("Choose an assessed date.");

    const rowsToSave: {
      student_id: string;
      instrument_id: string;
      occurred_on: string;
      score_numeric: number | null;
      note_text: string | null;
      created_by?: string | null;
    }[] = [];

    for (const s of roster) {
      const d = drafts[s.id];
      if (!d) continue;

      const scoreStr = safe(d.score);
      const noteStr = safe(d.note);

      if (!scoreStr && !noteStr) continue;

      let num: number | null = null;
      if (scoreStr) {
        const n = Number(scoreStr);
        if (!Number.isFinite(n)) {
          return setErr(`Invalid score for ${studentName(s)}. Scores must be numeric.`);
        }
        num = n;
      }

      rowsToSave.push({
        student_id: s.id,
        instrument_id: instrumentId,
        occurred_on: assessedAt,
        score_numeric: num,
        note_text: noteStr ? noteStr : null,
      });
    }

    if (rowsToSave.length === 0) {
      return setErr("No scores/notes entered yet. Type at least one score or note first.");
    }

    setSaving(true);

    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id ?? null;
    const payload = rowsToSave.map((r) => ({ ...r, created_by: uid }));

    const { error } = await supabase.from("assessment_results").insert(payload);

    if (error) {
      setErr(
        `Save failed: ${error.message}\n\n` +
          `Make sure you ran the SQL to create "assessment_results" + RLS policies.`
      );
      setSaving(false);
      return;
    }

    setOk(`Saved ${rowsToSave.length} result(s) ✅`);
    setSaving(false);
    clearDrafts();
  };

  /* ───────────────────────── UI ───────────────────────── */

  if (loading) {
    return (
      <div style={shell}>
        <AdminLeftNav />
        <main style={main}>
          <div style={{ paddingTop: 24 }}>Loading…</div>
        </main>
      </div>
    );
  }

  const classTitle =
    classId && classById.get(classId)
      ? `${classById.get(classId)?.name ?? "Class"}${
          classById.get(classId)?.year_level != null ? ` (Year ${classById.get(classId)?.year_level})` : ""
        }`
      : "—";

  return (
    <div style={shell}>
      <AdminLeftNav />

      <main style={main}>
        <section style={hero}>
          <div>
            <div style={subtle}>ADMIN • ENTER RESULTS</div>
            <div style={h1}>Assessment Results Cockpit</div>
            <div style={heroSub}>
              Choose a class, select an instrument, enter results for the roster, and launch evidence or support actions where needed.
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Pill label={`Class: ${classTitle}`} />
              <Pill label={`Roster: ${roster.length}`} />
              <Pill
                label={`Instrument: ${selectedInstrument?.instrument_name ?? selectedInstrument?.instrument_code ?? "—"}`}
              />
              <Pill label={`Drafts: ${draftCount}`} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/admin")} style={btn}>
              ← Back to Admin
            </button>
            <button onClick={() => loadAll()} style={btn}>
              Refresh
            </button>
            <button onClick={saveAllEntered} disabled={saving} style={btnPrimary}>
              {saving ? "Saving…" : "Save entered results"}
            </button>
          </div>
        </section>

        {!!err && (
          <div style={errorBox}>
            <strong style={{ color: "crimson" }}>Error:</strong>{" "}
            <span style={{ whiteSpace: "pre-wrap" }}>{err}</span>
          </div>
        )}
        {!!ok && (
          <div style={okBox}>
            <strong style={{ color: "green" }}>OK:</strong> {ok}
          </div>
        )}

        <div style={tiles}>
          <MetricTile label="Completed" value={completedCount} help="Students with a numeric score entered." />
          <MetricTile label="Missing" value={missingCount} help="Students without a numeric score yet." />
          <MetricTile label="Class average" value={scoreStats.average} help="Average of currently entered numeric scores." />
          <MetricTile label="Follow-up" value={flaggedForFollowUp} help="Students likely needing evidence or support review." />
        </div>

        <div style={{ marginTop: 12 }}>
          <TeacherTaskInbox tasks={[]} classId={classId || null} />
        </div>

        <section style={{ ...panel, marginTop: 12 }}>
          <div style={{ width: "100%" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 12 }}>
              <label style={{ fontSize: 12 }}>
                Class
                <select value={classId} onChange={(e) => setClassId(e.target.value)} style={select}>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name ?? c.id} {c.year_level != null ? `(Year ${c.year_level})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ fontSize: 12 }}>
                Instrument
                <select value={instrumentId} onChange={(e) => setInstrumentId(e.target.value)} style={select}>
                  {filteredInstruments.map((i) => (
                    <option key={i.id} value={i.id}>
                      {(i.instrument_name ?? "Unnamed instrument") + (i.instrument_code ? ` • ${i.instrument_code}` : "")}
                    </option>
                  ))}
                </select>

                {hasClassInstrumentJoin ? (
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                    Showing instruments {classInstrumentIds.size ? "assigned to this class" : "(no assignment rows found — showing all)"}.
                  </div>
                ) : (
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                    Instrument filtering by class assignment is not active. That’s okay.
                  </div>
                )}
              </label>

              <label style={{ fontSize: 12 }}>
                Assessed date
                <input type="date" value={assessedAt} onChange={(e) => setAssessedAt(e.target.value)} style={input} />
              </label>
            </div>

            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
              <label style={{ fontSize: 12 }}>
                Search roster
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type a student name…"
                  style={input}
                />
              </label>

              <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 10, marginTop: 22 }}>
                <input type="checkbox" checked={showILPOnly} onChange={(e) => setShowILPOnly(e.target.checked)} />
                ILP only
              </label>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "flex-end" }}>
                <button onClick={clearDrafts} disabled={Object.keys(drafts).length === 0} style={btn}>
                  Clear entries
                </button>
              </div>
            </div>
          </div>
        </section>

        <section style={{ ...panel, marginTop: 12 }}>
          <div style={{ width: "100%" }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>
              Roster Entry ({roster.length})
              <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>
                Enter numeric scores. Use row actions for student context and follow-up.
              </span>
            </div>

            {roster.length === 0 ? (
              <div style={{ fontSize: 13, opacity: 0.75 }}>No students found for this class or current filters.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1180 }}>
                  <thead>
                    <tr style={{ textAlign: "left", fontSize: 12, opacity: 0.7 }}>
                      <th style={{ padding: "8px 6px" }}>Student</th>
                      <th style={{ padding: "8px 6px" }}>ILP</th>
                      <th style={{ padding: "8px 6px" }}>Score</th>
                      <th style={{ padding: "8px 6px" }}>Note</th>
                      <th style={{ padding: "8px 6px" }}>Status</th>
                      <th style={{ padding: "8px 6px" }}>Actions</th>
                      <th style={{ padding: "8px 6px" }}>ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((s) => {
                      const d = drafts[s.id] ?? { score: "", note: "" };
                      const hasScore = !!safe(d.score);
                      const hasNote = !!safe(d.note);
                      const numeric = Number(d.score);
                      const flagged = Number.isFinite(numeric) && numeric < 50;

                      return (
                        <tr key={s.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "10px 6px", fontWeight: 900 }}>{studentName(s)}</td>
                          <td style={{ padding: "10px 6px" }}>{s.is_ilp ? "Yes" : "No"}</td>

                          <td style={{ padding: "10px 6px", width: 140 }}>
                            <input
                              value={d.score}
                              onChange={(e) => setDraft(s.id, { score: e.target.value })}
                              placeholder="e.g. 15"
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd" }}
                            />
                          </td>

                          <td style={{ padding: "10px 6px" }}>
                            <input
                              value={d.note}
                              onChange={(e) => setDraft(s.id, { note: e.target.value })}
                              placeholder="Optional note…"
                              style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd" }}
                            />
                          </td>

                          <td style={{ padding: "10px 6px" }}>
                            {flagged ? (
                              <StatusPill label="Flagged" tone="warn" />
                            ) : hasScore ? (
                              <StatusPill label="Scored" tone="ok" />
                            ) : hasNote ? (
                              <StatusPill label="Note only" tone="neutral" />
                            ) : (
                              <StatusPill label="Not started" tone="neutral" />
                            )}
                          </td>

                          <td style={{ padding: "10px 6px" }}>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button
                                style={miniBtn}
                                onClick={() => {
                                  setQuickViewStudentId(s.id);
                                  setQuickViewOpen(true);
                                }}
                              >
                                Quick view
                              </button>

                              <button
                                style={miniBtn}
                                onClick={() =>
                                  router.push(
                                    `/admin/evidence-entry?studentId=${encodeURIComponent(s.id)}${s.class_id ? `&classId=${encodeURIComponent(s.class_id)}` : ""}&returnTo=${encodeURIComponent("/admin/enter-results")}`
                                  )
                                }
                              >
                                Add evidence
                              </button>

                              <button
                                style={miniBtn}
                                onClick={() =>
                                  router.push(
                                    `/admin/interventions-entry?studentId=${encodeURIComponent(s.id)}${s.class_id ? `&classId=${encodeURIComponent(s.class_id)}` : ""}&returnTo=${encodeURIComponent("/admin/enter-results")}`
                                  )
                                }
                              >
                                Support plan
                              </button>
                            </div>
                          </td>

                          <td style={{ padding: "10px 6px", fontSize: 12, opacity: 0.8 }}>
                            <code>{s.id}</code>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
          <details>
            <summary>What this writes</summary>
            <div style={{ marginTop: 10, lineHeight: 1.5 }}>
              This page inserts into <code>public.assessment_results</code> with columns:
              <ul>
                <li><code>student_id</code></li>
                <li><code>instrument_id</code> (references <code>assessment_instruments.id</code>)</li>
                <li><code>occurred_on</code> (date)</li>
                <li><code>score_numeric</code> (numeric)</li>
                <li><code>note_text</code> (text)</li>
                <li><code>created_by</code> + <code>created_at</code></li>
              </ul>
            </div>
          </details>
        </section>
      </main>

      <StudentQuickViewDrawer
        studentId={quickViewStudentId}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        returnTo="/admin/enter-results"
      />
    </div>
  );
}

/* ───────────────────────── UI HELPERS ───────────────────────── */

function Pill({ label }: { label: string }) {
  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid #e6e6e6",
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {label}
    </span>
  );
}

function MetricTile({ label, value, help }: { label: string; value: string | number; help: string }) {
  return (
    <div
      style={{
        border: "1px solid #e6e6e6",
        borderRadius: 16,
        background: "white",
        padding: 14,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 950, marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8, lineHeight: 1.35 }}>{help}</div>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "ok" | "warn" | "neutral" }) {
  const style =
    tone === "ok"
      ? { border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534" }
      : tone === "warn"
      ? { border: "1px solid #fed7aa", background: "#fff7ed", color: "#9a3412" }
      : { border: "1px solid #e5e7eb", background: "#fff", color: "#475569" };

  return (
    <span
      style={{
        display: "inline-flex",
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        ...style,
      }}
    >
      {label}
    </span>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */

const shell: React.CSSProperties = {
  display: "flex",
  minHeight: "100vh",
  background: "#f6f7fb",
};

const main: React.CSSProperties = {
  flex: 1,
  paddingTop: 24,
  paddingRight: 24,
  paddingBottom: 24,
  paddingLeft: 24,
  maxWidth: 1320,
  marginLeft: "auto",
  marginRight: "auto",
  width: "100%",
};

const hero: React.CSSProperties = {
  border: "1px solid #e8eaf0",
  borderRadius: 22,
  background: "linear-gradient(135deg, rgba(17,24,39,0.05), rgba(99,102,241,0.08))",
  padding: 18,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const subtle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 0.6,
};

const h1: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 950,
  lineHeight: 1.05,
  marginTop: 6,
  color: "#0f172a",
};

const heroSub: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.8,
  marginTop: 8,
  maxWidth: 900,
  lineHeight: 1.45,
};

const tiles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
  gap: 12,
  marginTop: 12,
};

const panel: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  padding: 16,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  background: "white",
};

const btn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontWeight: 900,
  cursor: "pointer",
  background: "white",
};

const btnPrimary: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #111",
  fontWeight: 900,
  cursor: "pointer",
  background: "#111",
  color: "white",
};

const miniBtn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontWeight: 900,
  cursor: "pointer",
  background: "white",
  fontSize: 12,
};

const select: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: 10,
  borderRadius: 12,
  border: "1px solid #ddd",
};

const input: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: 10,
  borderRadius: 12,
  border: "1px solid #ddd",
};

const errorBox: React.CSSProperties = {
  marginTop: 12,
  marginBottom: 12,
  padding: 10,
  border: "1px solid #f2c1c1",
  borderRadius: 10,
  background: "white",
};

const okBox: React.CSSProperties = {
  marginTop: 12,
  marginBottom: 12,
  padding: 10,
  border: "1px solid #cfe9cf",
  borderRadius: 10,
  background: "white",
};