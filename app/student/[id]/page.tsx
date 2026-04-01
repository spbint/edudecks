"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type StudentRow = {
  id: string;
  first_name: string | null;
  preferred_name: string | null;
  is_ilp: boolean | null;
  class_id: string | null;
};

type ClassRow = {
  id: string;
  name: string | null;
  year_level: number | null;
};

type EvidenceRow = {
  id: string;
  student_id: string;
  note: string | null;
  occurred_on: string | null;
  created_at: string;
};

type EvidenceMeta = EvidenceRow & {
  note_clean: string;
  score: number | null;
  code: string | null;
  when: Date;
};

type InstrumentSummary = {
  code: string; // "NAP-NUM" or "—"
  latest_score: number | null;
  last_date: Date; // most recent evidence date for this code
  count: number; // total evidence entries for this code
  scored_count: number; // entries with a detected score
};

export default function StudentProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const studentId = (params?.id as string) ?? "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [student, setStudent] = useState<StudentRow | null>(null);
  const [klass, setKlass] = useState<ClassRow | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);

  // Add-note form
  const [noteText, setNoteText] = useState("");
  const [occurredOn, setOccurredOn] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  });

  // Filters
  const [search, setSearch] = useState(() => searchParams?.get("search") ?? "");
  const [showScoresOnly, setShowScoresOnly] = useState(false);

  // ✅ v4: instrument drill-down state
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

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

  // ─────────────────────────────
  // PARSERS
  // ─────────────────────────────
  const parseScoreFromNote = (note: string) => {
    // "Score: 237" (case-insensitive)
    const m = note.match(/score\s*:\s*([0-9]+(\.[0-9]+)?)/i);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  };

  const parseInstrumentCodeFromNote = (note: string) => {
    // first (...) group e.g. (NAP-NUM)
    const m = note.match(/\(([A-Za-z0-9\-_]+)\)/);
    return m ? m[1] : null;
  };

  const formatCodeDisplay = (code: string) => (code === "—" ? "—" : code);

  // ─────────────────────────────
  // LOAD PROFILE
  // ─────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    setErr("");
    setOk("");

    if (!studentId) {
      setErr("No student id provided in the URL.");
      setLoading(false);
      return;
    }

    // 1) student
    const { data: sData, error: sErr } = await supabase
      .from("students")
      .select("id, first_name, preferred_name, is_ilp, class_id")
      .eq("id", studentId)
      .maybeSingle();

    if (sErr) {
      setErr(`Load student failed: ${sErr.message}`);
      setStudent(null);
      setKlass(null);
      setEvidence([]);
      setLoading(false);
      return;
    }

    const s = (sData as StudentRow) ?? null;
    setStudent(s);

    // 2) class (optional)
    if (s?.class_id) {
      const { data: cData, error: cErr } = await supabase
        .from("classes")
        .select("id, name, year_level")
        .eq("id", s.class_id)
        .maybeSingle();

      if (!cErr) setKlass((cData as ClassRow) ?? null);
      else setKlass(null);
    } else {
      setKlass(null);
    }

    // 3) evidence entries
    const { data: eData, error: eErr } = await supabase
      .from("evidence_entries")
      .select("id, student_id, note, occurred_on, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(800);

    if (eErr) {
      setErr(`Load evidence failed: ${eErr.message}`);
      setEvidence([]);
    } else {
      setEvidence((eData as EvidenceRow[]) ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // ─────────────────────────────
  // DERIVED (display)
  // ─────────────────────────────
  const displayName = useMemo(() => {
    if (!student) return "Student";
    const pref = (student.preferred_name ?? "").trim();
    const first = (student.first_name ?? "").trim();
    return pref || first || "Unnamed student";
  }, [student]);

  const classLabel = useMemo(() => {
    if (!student) return "—";
    if (!student.class_id) return "Unassigned";
    if (!klass) return "Assigned (class not loaded)";
    const yr = klass.year_level != null ? `Year ${klass.year_level}` : "Year —";
    return `${klass.name ?? "Class"} • ${yr}`;
  }, [student, klass]);

  // ✅ INTEGRATED: class interventions link
  const interventionsHref = useMemo(() => {
    if (!student?.class_id) return null;
    const q = encodeURIComponent(displayName);
    return `/classes/${student.class_id}/interventions?search=${q}`;
  }, [student?.class_id, displayName]);

  const now = useMemo(() => new Date(), []);
  const daysAgo = (d: Date, n: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() - n);
    return x;
  };

  const evidenceWithMeta = useMemo<EvidenceMeta[]>(() => {
    return evidence.map((e) => {
      const note_clean = (e.note ?? "").trim();
      const score = note_clean ? parseScoreFromNote(note_clean) : null;
      const code = note_clean ? parseInstrumentCodeFromNote(note_clean) : null;
      const when = e.occurred_on ? new Date(e.occurred_on) : new Date(e.created_at);
      return { ...e, note_clean, score, code, when };
    });
  }, [evidence]);

  const snapshot = useMemo(() => {
    const total = evidenceWithMeta.length;

    const since7 = daysAgo(now, 7).getTime();
    const since30 = daysAgo(now, 30).getTime();

    const last7 = evidenceWithMeta.filter((e) => e.when.getTime() >= since7).length;
    const last30 = evidenceWithMeta.filter((e) => e.when.getTime() >= since30).length;

    const scored = evidenceWithMeta.filter((e) => e.score != null);
    const scoredCount = scored.length;

    const latestScored =
      [...scored].sort((a, b) => b.when.getTime() - a.when.getTime())[0] ?? null;

    const byInstrument: Record<string, number> = {};
    for (const e of evidenceWithMeta) {
      const key = e.code ?? "—";
      byInstrument[key] = (byInstrument[key] ?? 0) + 1;
    }
    const top = Object.entries(byInstrument)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([k, v]) => ({ code: k, count: v }));

    return { total, last7, last30, scoredCount, latestScored, top };
  }, [evidenceWithMeta, now]);

  // Summary by instrument code
  const instrumentSummary = useMemo<InstrumentSummary[]>(() => {
    const groups = new Map<string, EvidenceMeta[]>();

    for (const e of evidenceWithMeta) {
      const key = e.code ?? "—";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    }

    const summaries: InstrumentSummary[] = [];

    for (const [code, rows] of groups.entries()) {
      const sortedByWhen = [...rows].sort((a, b) => b.when.getTime() - a.when.getTime());
      const last_date = sortedByWhen[0]?.when ?? new Date(0);

      const scored = sortedByWhen.filter((r) => r.score != null);
      const latest_score = scored.length ? (scored[0].score as number) : null;

      summaries.push({
        code,
        latest_score,
        last_date,
        count: rows.length,
        scored_count: scored.length,
      });
    }

    return summaries.sort((a, b) => {
      const d = b.last_date.getTime() - a.last_date.getTime();
      if (d !== 0) return d;
      return b.count - a.count;
    });
  }, [evidenceWithMeta]);

  // ✅ v4 drill-down: evidence rows for selected instrument code
  const selectedEvidence = useMemo(() => {
    if (!selectedCode) return [];
    const key = selectedCode === "—" ? null : selectedCode;

    return evidenceWithMeta
      .filter((e) => {
        if (selectedCode === "—") return e.code == null;
        return e.code === key;
      })
      .sort((a, b) => b.when.getTime() - a.when.getTime())
      .slice(0, 60); // keep it snappy
  }, [evidenceWithMeta, selectedCode]);

  const filteredTimeline = useMemo(() => {
    const q = search.trim().toLowerCase();

    return evidenceWithMeta
      .filter((e) => (showScoresOnly ? e.score != null : true))
      .filter((e) => {
        if (!q) return true;
        const n = (e.note_clean ?? "").toLowerCase();
        const c = (e.code ?? "").toLowerCase();
        return n.includes(q) || c.includes(q) || e.id.toLowerCase().includes(q);
      })
      .sort((a, b) => b.when.getTime() - a.when.getTime());
  }, [evidenceWithMeta, search, showScoresOnly]);

  // ─────────────────────────────
  // ACTIONS
  // ─────────────────────────────
  const addEvidence = async () => {
    setErr("");
    setOk("");

    if (!studentId) return setErr("Missing student id.");
    const text = noteText.trim();
    if (!text) return setErr("Type a note first.");

    setSaving(true);

    const occurred = occurredOn ? `${occurredOn}T00:00:00` : null;

    const { error } = await supabase.from("evidence_entries").insert([
      {
        student_id: studentId,
        note: text,
        occurred_on: occurred,
      },
    ]);

    if (error) {
      setErr(`Add note failed: ${error.message}`);
      setSaving(false);
      return;
    }

    setOk("Saved ✅");
    setNoteText("");
    setSaving(false);
    await loadAll();
  };

  const toggleSelectedCode = (code: string) => {
    setSelectedCode((prev) => (prev === code ? null : code));
  };

  const startNoteForCode = (code: string) => {
    // Prefill note with "(CODE)" unless code is "—"
    const prefix = code === "—" ? "" : `(${code}) `;
    setNoteText((prev) => (prev.trim() ? prev : prefix));
    // Scroll the user to Add Evidence area (best-effort)
    const el = document.getElementById("add-evidence");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  if (loading) return <main style={{ padding: 24 }}>Loading…</main>;

  if (!student) {
    return (
      <main style={{ padding: 24, maxWidth: 1100 }}>
        <section style={panel}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>STUDENT PROFILE</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>
              Student not found
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
              ID: <code>{studentId}</code>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => router.back()} style={btn}>
              ← Back
            </button>
            <button onClick={() => router.push("/admin")} style={btn}>
              Admin
            </button>
          </div>
        </section>

        {!!err && (
          <div style={errorBox}>
            <strong style={{ color: "crimson" }}>Error:</strong>{" "}
            <span style={{ whiteSpace: "pre-wrap" }}>{err}</span>
          </div>
        )}
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 1100 }}>
      {/* Header */}
      <section style={panel}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>STUDENT PROFILE</div>
          <div style={{ fontSize: 26, fontWeight: 900, marginTop: 4 }}>
            {displayName}
          </div>

          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill label={classLabel} />
            <Pill label={`ILP: ${student.is_ilp ? "Yes" : "No"}`} />
            <Pill label={`Evidence: ${snapshot.total}`} />
            <Pill label={`Last 7 days: ${snapshot.last7}`} />
            <Pill label={`Last 30 days: ${snapshot.last30}`} />
            <Pill label={`Scored entries: ${snapshot.scoredCount}`} />
          </div>

          {snapshot.latestScored ? (
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
              Latest score:{" "}
              <strong>
                {snapshot.latestScored.score}
                {snapshot.latestScored.code ? ` (${snapshot.latestScored.code})` : ""}
              </strong>{" "}
              • {snapshot.latestScored.when.toLocaleString()}
            </div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
              Latest score: <strong>—</strong> (no scored evidence found yet)
            </div>
          )}

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            Student ID: <code>{student.id}</code>
          </div>
        </div>

        {/* ✅ ACTION BAR (Interventions integrated) */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => router.back()} style={btn}>
            ← Back
          </button>

          {interventionsHref ? (
            <Link
              href={interventionsHref}
              style={{
                ...btn,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
              title="Go to class interventions (prefilled search)"
            >
              📋 Interventions
            </Link>
          ) : (
            <span
              style={{ fontSize: 12, opacity: 0.65, fontWeight: 800 }}
              title="Student is not assigned to a class yet"
            >
              📋 Interventions (needs class)
            </span>
          )}

          <button onClick={() => router.push("/admin")} style={btn}>
            Admin
          </button>
          <button onClick={() => loadAll()} style={btn}>
            Refresh
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

      {/* Snapshot cards */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginTop: 12,
        }}
      >
        <div style={card}>
          <div style={cardKicker}>Evidence</div>
          <div style={cardValue}>{snapshot.total}</div>
          <div style={cardHint}>Total evidence entries recorded.</div>
        </div>

        <div style={card}>
          <div style={cardKicker}>Recency</div>
          <div style={cardValue}>
            {snapshot.last7} <span style={{ fontSize: 12, opacity: 0.7 }}>/ 7d</span>
          </div>
          <div style={cardHint}>{snapshot.last30} entries in the last 30 days.</div>
        </div>

        <div style={card}>
          <div style={cardKicker}>Scored</div>
          <div style={cardValue}>{snapshot.scoredCount}</div>
          <div style={cardHint}>Entries with “Score:” detected in note text.</div>
        </div>
      </section>

      {/* Summary by instrument */}
      <section style={{ ...panel, marginTop: 12 }}>
        <div style={{ width: "100%" }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>
            Assessment Summary by Instrument
          </div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Click a row to drill down. Codes are detected from <code>(CODE)</code>. Scores
            from <code>Score: 123</code>.
          </div>

          {instrumentSummary.length === 0 ? (
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
              No evidence recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto", marginTop: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                <thead>
                  <tr style={{ textAlign: "left", fontSize: 12, opacity: 0.7 }}>
                    <th style={{ padding: "8px 6px" }}>Code</th>
                    <th style={{ padding: "8px 6px" }}>Latest score</th>
                    <th style={{ padding: "8px 6px" }}>Count</th>
                    <th style={{ padding: "8px 6px" }}>Last date</th>
                    <th style={{ padding: "8px 6px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {instrumentSummary.map((s) => {
                    const isSelected = selectedCode === s.code;
                    return (
                      <tr
                        key={s.code}
                        onClick={() => toggleSelectedCode(s.code)}
                        style={{
                          borderTop: "1px solid #f0f0f0",
                          cursor: "pointer",
                          background: isSelected ? "#fafafa" : "transparent",
                        }}
                        title="Click to drill down"
                      >
                        <td style={{ padding: "10px 6px", fontWeight: 900 }}>
                          {formatCodeDisplay(s.code)}
                        </td>
                        <td style={{ padding: "10px 6px" }}>
                          {s.latest_score != null ? (
                            <strong>{s.latest_score}</strong>
                          ) : (
                            <span style={{ opacity: 0.7 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 6px" }}>
                          <strong>{s.count}</strong>
                          <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>
                            ({s.scored_count} scored)
                          </span>
                        </td>
                        <td style={{ padding: "10px 6px", whiteSpace: "nowrap" }}>
                          {s.last_date.toLocaleString()}
                        </td>
                        <td style={{ padding: "10px 6px", textAlign: "right" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startNoteForCode(s.code);
                            }}
                            style={{ ...btnTiny }}
                            title="Prefill a new note with this code"
                          >
                            + Add note
                          </button>
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

      {/* ✅ v4 Drill-down Panel */}
      {selectedCode && (
        <section style={{ ...panel, marginTop: 12 }}>
          <div style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900 }}>DRILL DOWN</div>
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>
                  {selectedCode === "—"
                    ? "No code / uncategorised evidence"
                    : `Instrument: ${selectedCode}`}
                </div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                  Showing latest {selectedEvidence.length} entries for this instrument.
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => startNoteForCode(selectedCode)}
                  style={{ ...btn, background: "#111", color: "white" }}
                >
                  Add note for {selectedCode === "—" ? "this group" : selectedCode}
                </button>
                <button onClick={() => setSelectedCode(null)} style={btn}>
                  Close
                </button>
              </div>
            </div>

            {selectedEvidence.length === 0 ? (
              <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>No entries found.</div>
            ) : (
              <div style={{ overflowX: "auto", marginTop: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
                  <thead>
                    <tr style={{ textAlign: "left", fontSize: 12, opacity: 0.7 }}>
                      <th style={{ padding: "8px 6px" }}>When</th>
                      <th style={{ padding: "8px 6px" }}>Score</th>
                      <th style={{ padding: "8px 6px" }}>Note</th>
                      <th style={{ padding: "8px 6px" }}>ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEvidence.map((e) => (
                      <tr key={e.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "10px 6px", whiteSpace: "nowrap" }}>
                          {e.when.toLocaleString()}
                        </td>
                        <td style={{ padding: "10px 6px", width: 140 }}>
                          {e.score != null ? <strong>{e.score}</strong> : <span style={{ opacity: 0.7 }}>—</span>}
                        </td>
                        <td style={{ padding: "10px 6px" }}>
                          <span style={{ whiteSpace: "pre-wrap" }}>{e.note_clean || "—"}</span>
                        </td>
                        <td style={{ padding: "10px 6px", fontSize: 12, opacity: 0.8 }}>
                          <code>{e.id}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                  Tip: if you want a stricter assessment model later, we’ll replace this with a proper{" "}
                  <code>assessment_results</code> table — but this gets the UX working right now.
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Add evidence */}
      <section id="add-evidence" style={{ ...panel, marginTop: 12 }}>
        <div style={{ width: "100%" }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Add Evidence</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Notes can include an instrument code like <code>(NAP-NUM)</code> and a score like <code>Score: 237</code>.
          </div>

          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 3fr 1fr", gap: 12 }}>
            <label style={{ fontSize: 12 }}>
              Occurred on
              <input type="date" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} style={input} />
            </label>

            <label style={{ fontSize: 12 }}>
              Note
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder='e.g. NAPLAN Numeracy (NAP-NUM) — Score: 237 — first test'
                style={input}
              />
            </label>

            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                onClick={addEvidence}
                disabled={saving}
                style={{ ...btn, width: "100%", background: "#111", color: "white" }}
              >
                {saving ? "Saving…" : "Save note"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline controls */}
      <section style={{ ...panel, marginTop: 12 }}>
        <div style={{ width: "100%" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
            <label style={{ fontSize: 12 }}>
              Search evidence
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search note text or instrument code…"
                style={input}
              />
            </label>

            <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 10, marginTop: 22 }}>
              <input type="checkbox" checked={showScoresOnly} onChange={(e) => setShowScoresOnly(e.target.checked)} />
              Scores only
            </label>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setSearch("");
                  setShowScoresOnly(false);
                }}
                style={btn}
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section style={{ ...panel, marginTop: 12 }}>
        <div style={{ width: "100%" }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>
            Recent Evidence
            <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>
              ({filteredTimeline.length} shown)
            </span>
          </div>

          {filteredTimeline.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.75 }}>No evidence matches the current filters.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
                <thead>
                  <tr style={{ textAlign: "left", fontSize: 12, opacity: 0.7 }}>
                    <th style={{ padding: "8px 6px" }}>When</th>
                    <th style={{ padding: "8px 6px" }}>Instrument</th>
                    <th style={{ padding: "8px 6px" }}>Score</th>
                    <th style={{ padding: "8px 6px" }}>Note</th>
                    <th style={{ padding: "8px 6px" }}>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTimeline.map((e) => (
                    <tr key={e.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "10px 6px", whiteSpace: "nowrap" }}>{e.when.toLocaleString()}</td>
                      <td style={{ padding: "10px 6px" }}>
                        {e.code ? <strong>{e.code}</strong> : <span style={{ opacity: 0.7 }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 6px" }}>
                        {e.score != null ? <strong>{e.score}</strong> : <span style={{ opacity: 0.7 }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 6px" }}>
                        <span style={{ whiteSpace: "pre-wrap" }}>{e.note_clean || "—"}</span>
                      </td>
                      <td style={{ padding: "10px 6px", fontSize: 12, opacity: 0.8 }}>
                        <code>{e.id}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <details style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
            <summary>How “scores” and “instrument codes” are detected</summary>
            <div style={{ marginTop: 10, lineHeight: 1.5 }}>
              This page reads from <code>public.evidence_entries</code> and extracts:
              <ul>
                <li>Instrument code from the first parentheses group, e.g. <code>(NAP-NUM)</code></li>
                <li>Score from text like <code>Score: 237</code> (case-insensitive)</li>
              </ul>
            </div>
          </details>
        </div>
      </section>
    </main>
  );
}

/* ─────────────────────────────
   UI Helpers
───────────────────────────── */
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

const panel: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  padding: 16,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const btn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontWeight: 900,
  cursor: "pointer",
};

const btnTiny: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12,
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
};

const okBox: React.CSSProperties = {
  marginTop: 12,
  marginBottom: 12,
  padding: 10,
  border: "1px solid #cfe9cf",
  borderRadius: 10,
};

const card: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 14,
};

const cardKicker: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  fontWeight: 900,
};

const cardValue: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  marginTop: 6,
};

const cardHint: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.75,
  marginTop: 6,
};
