"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────────── TYPES ───────────────────────────── */

type ClassRow = { id: string; name: string | null; year_level: number | null };

type StudentRow = {
  id: string;
  first_name: string | null;
  preferred_name: string | null;
  class_id: string | null;
  [k: string]: any;
};

type CoverageByTermRow = {
  class_id: string;
  term_key: string;
  domain: string;
  students_in_class: number;
  students_with_any_evidence_in_domain: number;
  coverage_pct: number | null;
};

type TargetRow = {
  id: string;
  class_id: string;
  term_key: string;
  domain: string;
  target_pct: number;
};

type EvidenceEntryLiteRow = {
  student_id: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  learning_area?: string | null;
  is_deleted?: boolean | null;
};

type DomainKey = "Reading" | "Maths" | "Writing" | "Spelling" | "Wellbeing" | "General" | "Other";
const DOMAINS: DomainKey[] = ["Reading", "Maths", "Writing", "Spelling", "Wellbeing", "General", "Other"];

/* ───────────────────────────── STYLE ───────────────────────────── */

const S: Record<string, React.CSSProperties> = {
  shell: { display: "flex", minHeight: "100vh", background: "#f6f7fb" },
  main: { flex: 1, padding: 22, maxWidth: 1400, margin: "0 auto" },

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(17,24,39,0.06), rgba(99,102,241,0.08))",
    padding: 18,
  },
  subtle: { color: "#6b7280", fontSize: 12, fontWeight: 900, letterSpacing: 0.6 },
  h1: { fontSize: 38, fontWeight: 950, lineHeight: 1.05, marginTop: 8, color: "#0f172a" },
  row: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" },

  card: { border: "1px solid #e8eaf0", borderRadius: 18, background: "#fff" },

  btn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontWeight: 900,
    cursor: "pointer",
    background: "#fff",
    color: "#0f172a",
  },
  btnPrimary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #0f172a",
    fontWeight: 900,
    cursor: "pointer",
    background: "#0f172a",
    color: "#fff",
  },

  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontSize: 12,
    fontWeight: 900,
    color: "#0f172a",
    whiteSpace: "nowrap",
    gap: 8,
  },

  input: {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    width: "100%",
    fontWeight: 900,
    background: "#fff",
    outline: "none",
    color: "#0f172a",
  },
  select: {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    width: "100%",
    fontWeight: 900,
    background: "#fff",
    outline: "none",
    color: "#0f172a",
  },

  alert: {
    marginTop: 10,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    padding: 12,
    color: "#9f1239",
    fontWeight: 900,
    whiteSpace: "pre-wrap",
  },
  ok: {
    marginTop: 10,
    borderRadius: 14,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    padding: 12,
    color: "#14532d",
    fontWeight: 900,
  },

  grid4: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 },
  tile: { border: "1px solid #e8eaf0", borderRadius: 18, background: "#fff", padding: 14 },
  kpiLabel: { fontSize: 12, color: "#64748b", fontWeight: 950, letterSpacing: 0.4 },
  kpiValue: { marginTop: 6, fontSize: 24, fontWeight: 950, color: "#0f172a" },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  th: {
    position: "sticky",
    top: 0,
    background: "#fff",
    zIndex: 1,
    textAlign: "left",
    fontSize: 12,
    color: "#64748b",
    fontWeight: 950,
    padding: "10px 10px",
    borderBottom: "1px solid #e8eaf0",
    whiteSpace: "nowrap",
  },
  td: { padding: "10px 10px", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" },
};

/* ───────────────────────────── HELPERS ───────────────────────────── */

function safe(v: string | null | undefined) {
  return (v ?? "").trim();
}

function fmtYear(y: number | null) {
  if (y == null) return "Year ?";
  return `Y${y}`;
}

function classLabel(c: ClassRow | null) {
  if (!c) return "Class";
  const name = safe(c.name) || "Unnamed class";
  const y = c.year_level == null ? "" : ` (${fmtYear(c.year_level)})`;
  return `${name}${y}`;
}

function displayStudent(s: StudentRow) {
  const first = safe(s.preferred_name) || safe(s.first_name);
  const sur = safe((s as any).surname) || safe((s as any).last_name) || safe((s as any).family_name) || "";
  return `${first}${sur ? " " + sur : ""}`.trim() || "Unnamed student";
}

function pctColor(pct: number | null, target: number) {
  const v = pct ?? 0;
  if (v >= target) return { border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#14532d" };
  if (v >= target * 0.75) return { border: "1px solid #fde68a", background: "#fffbeb", color: "#92400e" };
  return { border: "1px solid #fecaca", background: "#fff1f2", color: "#9f1239" };
}

function defaultTargetPct() {
  return 70;
}

function deriveTermKeyFromDate(input?: string | null) {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const term = m <= 3 ? 1 : m <= 6 ? 2 : m <= 9 ? 3 : 4;
  return `${y}T${term}`;
}

/* ───────────────────────────── PAGE ───────────────────────────── */

export default function ClassPage() {
  return (
    <Suspense fallback={null}>
      <ClassPageContent />
    </Suspense>
  );
}

function ClassPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const classId = String((params as any)?.id ?? "");
  const tab = safe(searchParams?.get("tab") ?? "coverage");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [clazz, setClazz] = useState<ClassRow | null>(null);

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [covByTerm, setCovByTerm] = useState<CoverageByTermRow[]>([]);
  const [targets, setTargets] = useState<TargetRow[]>([]);

  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedDomain, setSelectedDomain] = useState<DomainKey>("Reading");
  const [missingMode, setMissingMode] = useState(false);
  const [missingStudentsState, setMissingStudentsState] = useState<StudentRow[]>([]);

  const terms = useMemo(() => {
    const set = new Set<string>();
    covByTerm.forEach((r) => {
      if (safe(r.term_key)) set.add(r.term_key);
    });
    return Array.from(set).sort().reverse();
  }, [covByTerm]);

  useEffect(() => {
    if (!selectedTerm && terms.length) setSelectedTerm(terms[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terms.join("|")]);

  const rosterCount = students.length;

  const targetMap = useMemo(() => {
    const m = new Map<string, number>();
    targets.forEach((t) => m.set(`${t.term_key}::${t.domain}`, Number(t.target_pct)));
    return m;
  }, [targets]);

  function getTarget(termKey: string, domain: string) {
    return targetMap.get(`${termKey}::${domain}`) ?? defaultTargetPct();
  }

  const heatmap = useMemo(() => {
    const byKey = new Map<string, CoverageByTermRow>();
    covByTerm.forEach((r) => byKey.set(`${r.term_key}::${r.domain}`, r));
    return { byKey };
  }, [covByTerm]);

  const coverageThisTerm = useMemo(() => {
    if (!selectedTerm) return [];
    return DOMAINS.map((d) => {
      const r = heatmap.byKey.get(`${selectedTerm}::${d}`) ?? null;
      const pct = r?.coverage_pct ?? null;
      const withEv = r?.students_with_any_evidence_in_domain ?? 0;
      return { domain: d, pct, withEv };
    });
  }, [selectedTerm, heatmap.byKey]);

  async function loadAll() {
    if (!classId) return;
    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      const { data: cls, error: cErr } = await supabase
        .from("classes")
        .select("id,name,year_level")
        .order("year_level", { ascending: true });

      if (cErr) throw cErr;
      setClasses((cls ?? []) as ClassRow[]);
      setClazz(((cls ?? []) as ClassRow[]).find((c) => c.id === classId) ?? null);

      const { data: stu, error: sErr } = await supabase
        .from("students")
        .select("id,first_name,preferred_name,surname,last_name,family_name,class_id")
        .eq("class_id", classId)
        .order("preferred_name", { ascending: true });

      if (sErr) throw sErr;
      setStudents((stu ?? []) as StudentRow[]);

      const { data: cov, error: covErr } = await supabase
        .from("v_class_domain_coverage_by_term")
        .select("class_id,term_key,domain,students_in_class,students_with_any_evidence_in_domain,coverage_pct")
        .eq("class_id", classId);

      if (covErr) throw covErr;
      setCovByTerm((cov ?? []) as CoverageByTermRow[]);

      const { data: tgt, error: tErr } = await supabase
        .from("class_domain_targets")
        .select("id,class_id,term_key,domain,target_pct")
        .eq("class_id", classId);

      const tMsg = String(tErr?.message ?? "").toLowerCase();
      if (!tErr || !(tMsg.includes("relation") && tMsg.includes("does not exist"))) {
        if (tErr) throw tErr;
        setTargets((tgt ?? []) as TargetRow[]);
      } else {
        setTargets([]);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load class dashboard.");
    } finally {
      setBusy(false);
    }
  }

  async function loadMissingStudents(termKey: string, domain: string) {
    if (!termKey || !domain) return;
    setBusy(true);
    setErr(null);

    try {
      const studentIds = students.map((s) => s.id);
      if (studentIds.length === 0) {
        setMissingStudentsState([]);
        return;
      }

      const { data: ev, error: evErr } = await supabase
        .from("evidence_entries")
        .select("student_id, occurred_on, created_at, learning_area, is_deleted")
        .in("student_id", studentIds)
        .limit(5000);

      if (evErr) throw evErr;

      const has = new Set<string>();

      for (const row of (ev ?? []) as EvidenceEntryLiteRow[]) {
        if (row.is_deleted) continue;

        const sid = String(row.student_id ?? "");
        if (!sid) continue;

        const d = safe(row.learning_area) || "General";
        const tk = deriveTermKeyFromDate(row.occurred_on || row.created_at);
        if (!tk) continue;

        if (tk === termKey && d === domain) {
          has.add(sid);
        }
      }

      const missing = students.filter((s) => !has.has(s.id));
      setMissingStudentsState(missing);
      setMsg(`Missing list updated (${missing.length}).`);
      setTimeout(() => setMsg(null), 900);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to compute missing-domain list.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    if (!missingMode) {
      setMissingStudentsState([]);
      return;
    }
    if (!selectedTerm) return;
    if (!students.length) return;
    loadMissingStudents(selectedTerm, selectedDomain);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingMode, selectedTerm, selectedDomain, students.length]);

  async function saveTarget(termKey: string, domain: string, targetPct: number) {
    setErr(null);
    setMsg(null);
    setBusy(true);

    try {
      const payload = { class_id: classId, term_key: termKey, domain, target_pct: targetPct };
      const { error } = await supabase
        .from("class_domain_targets")
        .upsert(payload, { onConflict: "class_id,term_key,domain" });

      if (error) throw error;

      setMsg("Target saved.");
      setTimeout(() => setMsg(null), 900);

      const { data: tgt, error: tErr } = await supabase
        .from("class_domain_targets")
        .select("id,class_id,term_key,domain,target_pct")
        .eq("class_id", classId);

      if (tErr) throw tErr;
      setTargets((tgt ?? []) as TargetRow[]);
    } catch (e: any) {
      const m = String(e?.message ?? "");
      setErr(
        m.includes("relation") && m.includes("does not exist")
          ? "Targets table not found. Create class_domain_targets first."
          : m || "Failed to save target."
      );
    } finally {
      setBusy(false);
    }
  }

  function setTab(next: string) {
    router.replace(`/admin/classes/${classId}?tab=${encodeURIComponent(next)}`);
  }

  return (
    <div style={S.shell}>
      <AdminLeftNav />
      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.subtle}>CLASS DASHBOARD</div>
          <div style={S.h1}>{classLabel(clazz)}</div>

          <div style={{ ...S.row, marginTop: 10 }}>
            <div style={{ color: "#334155", fontSize: 14, fontWeight: 850 }}>
              Evidence coverage + missing-domain mode + per-term targets heatmap.
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button style={S.btn} onClick={() => router.back()} disabled={busy}>
                ← Back
              </button>

              <select
                style={{ ...S.select, width: 320 }}
                value={classId}
                onChange={(e) =>
                  router.push(`/admin/classes/${e.target.value}?tab=${encodeURIComponent(tab || "coverage")}`)
                }
                disabled={busy}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {classLabel(c)}
                  </option>
                ))}
              </select>

              <button style={S.btn} onClick={loadAll} disabled={busy}>
                Refresh
              </button>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={tab === "coverage" ? S.btnPrimary : S.btn} onClick={() => setTab("coverage")} disabled={busy}>
              Coverage
            </button>
            <button style={tab === "heatmap" ? S.btnPrimary : S.btn} onClick={() => setTab("heatmap")} disabled={busy}>
              Heatmap + targets
            </button>
            <button style={tab === "missing" ? S.btnPrimary : S.btn} onClick={() => setTab("missing")} disabled={busy}>
              Missing-domain mode
            </button>
          </div>

          {err ? <div style={S.alert}>{err}</div> : null}
          {msg ? <div style={S.ok}>{msg}</div> : null}
        </section>

        <section style={{ marginTop: 14, ...S.grid4 }}>
          <div style={S.tile}>
            <div style={S.kpiLabel}>ROSTER</div>
            <div style={S.kpiValue}>{rosterCount}</div>
            <div style={{ marginTop: 8, color: "#64748b", fontWeight: 850, fontSize: 12 }}>
              Students assigned to this class.
            </div>
          </div>
          <div style={S.tile}>
            <div style={S.kpiLabel}>TERMS FOUND</div>
            <div style={S.kpiValue}>{terms.length}</div>
            <div style={{ marginTop: 8, color: "#64748b", fontWeight: 850, fontSize: 12 }}>
              From evidence dates / created_at.
            </div>
          </div>
          <div style={S.tile}>
            <div style={S.kpiLabel}>SELECTED TERM</div>
            <div style={S.kpiValue}>{selectedTerm || "—"}</div>
            <div style={{ marginTop: 8, color: "#64748b", fontWeight: 850, fontSize: 12 }}>
              Used for tiles + heatmap.
            </div>
          </div>
          <div style={S.tile}>
            <div style={S.kpiLabel}>MODE</div>
            <div style={S.kpiValue}>
              {tab === "missing" ? "Missing" : tab === "heatmap" ? "Heatmap" : "Coverage"}
            </div>
            <div style={{ marginTop: 8, color: "#64748b", fontWeight: 850, fontSize: 12 }}>
              Switch tabs above.
            </div>
          </div>
        </section>

        {tab === "coverage" ? (
          <section style={{ marginTop: 14, ...S.card, padding: 14 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={S.chip}>Domain coverage</span>
              <div style={{ width: 220 }}>
                <select style={S.select} value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} disabled={busy}>
                  {terms.length === 0 ? <option value="">No terms</option> : null}
                  {terms.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <span style={{ color: "#64748b", fontWeight: 850, fontSize: 12 }}>
                Coverage = students with ≥1 evidence entry in domain this term.
              </span>
            </div>

            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
              {coverageThisTerm.map((r) => {
                const target = getTarget(selectedTerm, r.domain);
                const style = pctColor(r.pct, target);
                return (
                  <div key={r.domain} style={{ borderRadius: 18, padding: 14, ...style }}>
                    <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: 0.4 }}>{r.domain.toUpperCase()}</div>
                    <div style={{ marginTop: 6, fontSize: 28, fontWeight: 950 }}>
                      {typeof r.pct === "number" ? `${r.pct}%` : "—"}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, opacity: 0.9 }}>
                      {r.withEv} / {rosterCount} students · Target {target}%
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {tab === "heatmap" ? (
          <section style={{ marginTop: 14, ...S.card, padding: 14 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={S.chip}>Heatmap</span>
              <span style={{ color: "#64748b", fontWeight: 850, fontSize: 12 }}>
                Terms (columns) × Domains (rows). Cell shows coverage%. Press Enter in target box to save.
              </span>
            </div>

            <div style={{ marginTop: 12, ...S.tableWrap }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Domain</th>
                    {terms.map((t) => (
                      <th key={t} style={S.th}>
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DOMAINS.map((d) => (
                    <tr key={d}>
                      <td style={S.td}>
                        <span style={S.chip}>{d}</span>
                      </td>
                      {terms.map((t) => {
                        const r = heatmap.byKey.get(`${t}::${d}`) ?? null;
                        const pct = r?.coverage_pct ?? null;
                        const withEv = r?.students_with_any_evidence_in_domain ?? 0;
                        const target = getTarget(t, d);
                        const style = pctColor(pct, target);

                        return (
                          <td key={`${t}-${d}`} style={S.td}>
                            <div style={{ borderRadius: 14, padding: 10, ...style }}>
                              <div style={{ fontWeight: 950, fontSize: 16 }}>{typeof pct === "number" ? `${pct}%` : "—"}</div>
                              <div style={{ marginTop: 6, fontWeight: 900, fontSize: 12, opacity: 0.9 }}>
                                {withEv}/{rosterCount}
                              </div>

                              <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                                <span style={{ fontSize: 12, fontWeight: 950 }}>Target</span>
                                <input
                                  style={{ ...S.input, width: 90, padding: "6px 8px", borderRadius: 10 }}
                                  type="number"
                                  min={0}
                                  max={100}
                                  defaultValue={target}
                                  disabled={busy}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      const v = Number((e.target as HTMLInputElement).value);
                                      if (!Number.isFinite(v)) return;
                                      saveTarget(t, d, Math.max(0, Math.min(100, v)));
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 10, color: "#64748b", fontWeight: 850, fontSize: 12 }}>
              Tip: If targets don’t save, create the <code>class_domain_targets</code> table.
            </div>
          </section>
        ) : null}

        {tab === "missing" ? (
          <section style={{ marginTop: 14, ...S.card, padding: 14 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={S.chip}>Missing-domain mode</span>

              <div style={{ width: 220 }}>
                <select style={S.select} value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} disabled={busy}>
                  {terms.length === 0 ? <option value="">No terms</option> : null}
                  {terms.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ width: 220 }}>
                <select
                  style={S.select}
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value as DomainKey)}
                  disabled={busy}
                >
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <button style={missingMode ? S.btnPrimary : S.btn} onClick={() => setMissingMode((v) => !v)} disabled={busy}>
                {missingMode ? "Missing mode ON" : "Enable missing mode"}
              </button>

              <button
                style={S.btn}
                onClick={() => {
                  if (!selectedTerm) return;
                  loadMissingStudents(selectedTerm, selectedDomain);
                }}
                disabled={busy || !selectedTerm}
              >
                Recompute
              </button>

              <div style={{ marginLeft: "auto", color: "#64748b", fontWeight: 900, fontSize: 12 }}>
                Students without evidence in <b>{selectedDomain}</b> for <b>{selectedTerm || "—"}</b>.
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              {!missingMode ? (
                <div style={{ color: "#64748b", fontWeight: 900 }}>
                  Turn missing mode on to compute the list from <code>evidence_entries.learning_area</code>.
                </div>
              ) : (
                <div style={{ ...S.tableWrap }}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Student</th>
                        <th style={S.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missingStudentsState.map((s) => (
                        <tr key={s.id}>
                          <td style={S.td}>
                            <div style={{ fontWeight: 950, color: "#0f172a" }}>{displayStudent(s)}</div>
                            <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8", fontWeight: 850 }}>
                              ID: {s.id.slice(0, 8)}…
                            </div>
                          </td>
                          <td style={S.td}>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <button
                                style={S.btnPrimary}
                                onClick={() =>
                                  router.push(
                                    `/admin/evidence-entry?studentId=${encodeURIComponent(s.id)}&classId=${encodeURIComponent(classId)}`
                                  )
                                }
                                disabled={busy}
                              >
                                Add evidence →
                              </button>
                              <button
                                style={S.btn}
                                onClick={() => router.push(`/admin/students/${encodeURIComponent(s.id)}`)}
                                disabled={busy}
                              >
                                Open profile →
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {missingMode && missingStudentsState.length === 0 ? (
                        <tr>
                          <td colSpan={2} style={{ ...S.td, padding: 16, color: "#14532d", fontWeight: 950 }}>
                            🎉 No missing students for this domain/term.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : null}

        <div style={{ marginTop: 14, fontSize: 12, color: "#94a3b8", fontWeight: 800 }}>
          Next upgrade: make domain come from templates reliably, and move missing-list logic into a dedicated SQL view/RPC for scale.
        </div>
      </main>
    </div>
  );
}
