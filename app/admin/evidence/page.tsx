"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import StudentQuickOpen from "@/app/admin/components/StudentQuickOpen";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type ClassRow = {
  id: string;
  name: string | null;
  year_level?: number | null;
  teacher_name?: string | null;
  room?: string | null;
  [k: string]: any;
};

type StudentRow = {
  id: string;
  class_id: string | null;
  first_name: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  is_ilp?: boolean | null;
  [k: string]: any;
};

type EvidenceRow = {
  id: string;
  student_id: string | null;
  class_id?: string | null;
  created_at?: string | null;
  occurred_on?: string | null;
  domain?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  visibility?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

type StudentProfileOverviewRow = {
  student_id: string;
  class_id: string | null;
  student_name: string | null;
  is_ilp: boolean | null;
  last_evidence_at: string | null;
  open_interventions_count: number | null;
  overdue_reviews_count: number | null;
  evidence_count_30d: number | null;
  attention_status: "Ready" | "Watch" | "Attention" | string | null;
  next_action: string | null;
  [k: string]: any;
};

type EvidenceListRow = {
  evidence: EvidenceRow;
  student: StudentRow | null;
  klass: ClassRow | null;
  overview: StudentProfileOverviewRow | null;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("column") || msg.includes("relation"));
}

function studentDisplayName(s: StudentRow | null | undefined) {
  if (!s) return "Student";
  const first = safe(s.preferred_name || s.first_name);
  const sur = safe(s.surname || s.family_name);
  const full = `${first}${sur ? " " + sur : ""}`.trim();
  return full || "Student";
}

function fmtYear(y?: number | null) {
  return y == null ? "" : `Year ${y}`;
}

function isoShort(v: string | null | undefined) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch {
    return String(v).slice(0, 10);
  }
}

function clip(text: string | null | undefined, max = 180) {
  const s = safe(text);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function evidenceDate(e: EvidenceRow) {
  return safe(e.occurred_on) || safe(e.created_at);
}

function dateSortValue(v: string | null | undefined) {
  if (!v) return 0;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 0;
  return d.getTime();
}

function attentionTone(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  if (s === "attention") return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
  if (s === "watch") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
}

/* ───────────────────────── STYLES ───────────────────────── */

const S = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f6f7fb",
  } as React.CSSProperties,

  main: {
    flex: 1,
    width: "100%",
    maxWidth: 1450,
    margin: "0 auto",
    padding: 22,
  } as React.CSSProperties,

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(17,24,39,0.06), rgba(99,102,241,0.08))",
    padding: 18,
  } as React.CSSProperties,

  subtle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  } as React.CSSProperties,

  h1: {
    fontSize: 34,
    fontWeight: 950,
    lineHeight: 1.05,
    marginTop: 8,
    color: "#0f172a",
  } as React.CSSProperties,

  sub: {
    marginTop: 8,
    color: "#475569",
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.45,
  } as React.CSSProperties,

  row: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  } as React.CSSProperties,

  row4: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr 1fr 1fr",
    gap: 12,
  } as React.CSSProperties,

  tiles: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  tile: {
    border: "1px solid #e8eaf0",
    borderRadius: 16,
    background: "#fff",
    padding: 14,
    minHeight: 88,
  } as React.CSSProperties,

  tileK: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  } as React.CSSProperties,

  tileV: {
    marginTop: 6,
    fontSize: 28,
    color: "#0f172a",
    fontWeight: 950,
    lineHeight: 1.05,
  } as React.CSSProperties,

  tileS: {
    marginTop: 8,
    fontSize: 12,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.35,
  } as React.CSSProperties,

  card: {
    border: "1px solid #e8eaf0",
    borderRadius: 18,
    background: "#fff",
    marginTop: 14,
  } as React.CSSProperties,

  sectionPad: {
    padding: 16,
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  sectionHelp: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 1.45,
    color: "#64748b",
    fontWeight: 800,
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    outline: "none",
  } as React.CSSProperties,

  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    outline: "none",
  } as React.CSSProperties,

  btn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  btnPrimary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
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

  chipMuted: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: 12,
    fontWeight: 900,
    color: "#475569",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  list: {
    display: "grid",
    gap: 12,
    marginTop: 12,
  } as React.CSSProperties,

  item: {
    border: "1px solid #edf2f7",
    borderRadius: 14,
    background: "#fff",
    padding: 14,
  } as React.CSSProperties,

  itemTitle: {
    fontWeight: 950,
    color: "#0f172a",
    fontSize: 16,
    lineHeight: 1.3,
  } as React.CSSProperties,

  itemText: {
    marginTop: 8,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.45,
    whiteSpace: "pre-wrap",
  } as React.CSSProperties,

  ok: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #a7f3d0",
    background: "#ecfdf5",
    padding: 12,
    color: "#065f46",
    fontWeight: 900,
    fontSize: 13,
  } as React.CSSProperties,

  err: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    padding: 12,
    color: "#9f1239",
    fontWeight: 900,
    fontSize: 13,
  } as React.CSSProperties,
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function EvidencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const classIdFromUrl = safe(searchParams.get("classId"));

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [studentOverviewRows, setStudentOverviewRows] = useState<StudentProfileOverviewRow[]>([]);

  const [classId, setClassId] = useState(classIdFromUrl);
  const [areaFilter, setAreaFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const returnTo = `/admin/evidence${classId ? `?classId=${encodeURIComponent(classId)}` : ""}`;

  useEffect(() => {
    setClassId(classIdFromUrl);
  }, [classIdFromUrl]);

  useEffect(() => {
    const next = classId ? `/admin/evidence?classId=${encodeURIComponent(classId)}` : `/admin/evidence`;
    router.replace(next);
  }, [classId, router]);

  async function loadClasses() {
    const tries = [
      "id,name,year_level,teacher_name,room",
      "id,name,year_level",
      "id,name",
    ];

    for (const sel of tries) {
      const r = await supabase
        .from("classes")
        .select(sel)
        .order("year_level", { ascending: true })
        .order("name", { ascending: true });

      if (!r.error) {
        setClasses(((r.data as any[]) ?? []) as ClassRow[]);
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setClasses([]);
  }

  async function loadStudents() {
    const tries = [
      "id,class_id,first_name,preferred_name,surname,family_name,is_ilp",
      "id,class_id,first_name,preferred_name,surname,is_ilp",
      "id,class_id,first_name,preferred_name,family_name,is_ilp",
      "id,class_id,first_name,preferred_name,is_ilp",
    ];

    for (const sel of tries) {
      let query = supabase
        .from("students")
        .select(sel)
        .order("preferred_name", { ascending: true })
        .order("first_name", { ascending: true });

      if (classId) query = query.eq("class_id", classId);

      const r = await query;
      if (!r.error) {
        setStudents(((r.data as any[]) ?? []) as StudentRow[]);
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setStudents([]);
  }

  async function loadEvidence() {
    const tries: Array<{ select: string; withDeletedFilter: boolean }> = [
      {
        select:
          "id,student_id,class_id,created_at,occurred_on,domain,learning_area,evidence_type,title,summary,body,visibility,is_deleted",
        withDeletedFilter: true,
      },
      {
        select:
          "id,student_id,class_id,created_at,occurred_on,domain,learning_area,evidence_type,title,summary,body,visibility",
        withDeletedFilter: false,
      },
      {
        select:
          "id,student_id,class_id,created_at,occurred_on,learning_area,title,summary,body",
        withDeletedFilter: false,
      },
    ];

    for (const attempt of tries) {
      let query = supabase
        .from("evidence_entries")
        .select(attempt.select)
        .order("occurred_on", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(300);

      if (classId) query = query.eq("class_id", classId);
      if (attempt.withDeletedFilter) query = query.eq("is_deleted", false);

      const r = await query;

      if (!r.error) {
        let rows = (((r.data as any[]) ?? []) as EvidenceRow[]).slice();
        if (!attempt.withDeletedFilter) rows = rows.filter((x) => x.is_deleted !== true);
        setEvidence(rows);
        return;
      }

      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setEvidence([]);
  }

  async function loadStudentOverview() {
    let query = supabase.from("v_student_profile_overview_v1").select("*");
    if (classId) query = query.eq("class_id", classId);

    const r = await query;

    if (r.error) {
      if (isMissingRelationOrColumn(r.error)) {
        setStudentOverviewRows([]);
        return;
      }
      throw r.error;
    }

    setStudentOverviewRows(((r.data as any[]) ?? []) as StudentProfileOverviewRow[]);
  }

  async function loadAll() {
    setBusy(true);
    setErr(null);

    try {
      await Promise.all([loadClasses(), loadStudents(), loadEvidence(), loadStudentOverview()]);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const classMap = useMemo(() => {
    const map = new Map<string, ClassRow>();
    for (const c of classes) map.set(c.id, c);
    return map;
  }, [classes]);

  const studentMap = useMemo(() => {
    const map = new Map<string, StudentRow>();
    for (const s of students) map.set(s.id, s);
    return map;
  }, [students]);

  const overviewMap = useMemo(() => {
    const map = new Map<string, StudentProfileOverviewRow>();
    for (const row of studentOverviewRows) {
      if (row.student_id) map.set(row.student_id, row);
    }
    return map;
  }, [studentOverviewRows]);

  const areaOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of evidence) {
      const label = safe(e.learning_area || e.domain);
      if (label) set.add(label);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [evidence]);

  const rows = useMemo<EvidenceListRow[]>(() => {
    return evidence
      .map((e) => ({
        evidence: e,
        student: e.student_id ? studentMap.get(e.student_id) ?? null : null,
        klass: e.class_id ? classMap.get(e.class_id) ?? null : null,
        overview: e.student_id ? overviewMap.get(e.student_id) ?? null : null,
      }))
      .filter((row) => {
        const area = safe(row.evidence.learning_area || row.evidence.domain) || "General";
        if (areaFilter !== "ALL" && area !== areaFilter) return false;

        const hay = [
          safe(row.evidence.title),
          safe(row.evidence.summary),
          safe(row.evidence.body),
          area,
          studentDisplayName(row.student),
          safe(row.klass?.name),
          safe(row.overview?.attention_status),
        ]
          .join(" ")
          .toLowerCase();

        if (q && !hay.includes(q.toLowerCase())) return false;
        return true;
      })
      .sort(
        (a, b) =>
          dateSortValue(evidenceDate(b.evidence)) - dateSortValue(evidenceDate(a.evidence))
      );
  }, [evidence, studentMap, classMap, overviewMap, areaFilter, q]);

  const summary = useMemo(() => {
    return {
      total: rows.length,
      classes: new Set(rows.map((r) => safe(r.klass?.id)).filter(Boolean)).size,
      students: new Set(rows.map((r) => safe(r.student?.id)).filter(Boolean)).size,
      attention: rows.filter((r) => safe(r.overview?.attention_status) === "Attention").length,
    };
  }, [rows]);

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.subtle}>Evidence</div>
          <div style={S.h1}>Evidence feed</div>
          <div style={S.sub}>
            Review evidence quickly, jump into student mini profiles, and move straight into evidence entry or full learner pages.
          </div>

          <div style={{ ...S.row, marginTop: 12 }}>
            <span style={S.chip}>Visible entries: {summary.total}</span>
            <span style={S.chipMuted}>Students: {summary.students}</span>
            <span style={S.chipMuted}>Classes: {summary.classes}</span>
            <span style={S.chipMuted}>Attention-linked: {summary.attention}</span>

            <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                style={S.btnPrimary}
                onClick={() =>
                  router.push(
                    `/admin/evidence-entry${classId ? `?classId=${encodeURIComponent(classId)}` : ""}`
                  )
                }
              >
                + Add evidence
              </button>
              <button style={S.btn} onClick={loadAll} disabled={busy}>
                Refresh
              </button>
            </div>
          </div>

          {busy ? <div style={S.ok}>Loading evidence…</div> : null}
          {err ? <div style={S.err}>Error: {err}</div> : null}
        </section>

        <div style={S.tiles}>
          <div style={S.tile}>
            <div style={S.tileK}>Entries</div>
            <div style={S.tileV}>{summary.total}</div>
            <div style={S.tileS}>Evidence currently visible in the filtered feed.</div>
          </div>

          <div style={S.tile}>
            <div style={S.tileK}>Students</div>
            <div style={S.tileV}>{summary.students}</div>
            <div style={S.tileS}>Students represented in the current evidence view.</div>
          </div>

          <div style={S.tile}>
            <div style={S.tileK}>Classes</div>
            <div style={S.tileV}>{summary.classes}</div>
            <div style={S.tileS}>Distinct classes represented in the feed.</div>
          </div>

          <div style={S.tile}>
            <div style={S.tileK}>Attention-linked</div>
            <div style={S.tileV}>{summary.attention}</div>
            <div style={S.tileS}>Entries linked to students currently marked Attention.</div>
          </div>
        </div>

        <section style={S.card}>
          <div style={S.sectionPad}>
            <div style={S.sectionTitle}>Filters</div>
            <div style={S.sectionHelp}>
              Narrow the feed by class, area, or search.
            </div>

            <div style={{ ...S.row4, marginTop: 12 }}>
              <div>
                <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>Class</label>
                <select value={classId} onChange={(e) => setClassId(e.target.value)} style={S.select}>
                  <option value="">All classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {safe(c.name) || "Class"} {c.year_level != null ? `(${fmtYear(c.year_level)})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>Area</label>
                <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} style={S.select}>
                  <option value="ALL">All areas</option>
                  {areaOptions.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>Search</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Student, title, summary, learning area..."
                  style={S.input}
                />
              </div>
            </div>
          </div>
        </section>

        <section style={S.card}>
          <div style={S.sectionPad}>
            <div style={S.sectionTitle}>Feed</div>
            <div style={S.sectionHelp}>
              Click a student name to open the right-side mini profile.
            </div>

            <div style={S.list}>
              {rows.length === 0 ? (
                <div style={S.item}>No evidence entries match the current filters.</div>
              ) : (
                rows.map((row) => {
                  const area = safe(row.evidence.learning_area || row.evidence.domain) || "General";
                  const tone = attentionTone(row.overview?.attention_status);

                  return (
                    <div key={row.evidence.id} style={S.item}>
                      <div style={{ ...S.row, justifyContent: "space-between" }}>
                        <div style={S.itemTitle}>{safe(row.evidence.title) || "Evidence entry"}</div>
                        <span style={S.chip}>{isoShort(evidenceDate(row.evidence))}</span>
                      </div>

                      <div style={{ ...S.row, marginTop: 8 }}>
                        {row.student ? (
                          <StudentQuickOpen
                            studentId={row.student.id}
                            label={studentDisplayName(row.student)}
                            ilp={!!row.student.is_ilp}
                            returnTo={returnTo}
                            fullHref={`/admin/students/${encodeURIComponent(row.student.id)}`}
                            size="sm"
                            muted
                          />
                        ) : (
                          <span style={S.chipMuted}>Student</span>
                        )}

                        {row.klass ? (
                          <span style={S.chipMuted}>
                            {safe(row.klass.name) || "Class"}{" "}
                            {row.klass.year_level != null ? fmtYear(row.klass.year_level) : ""}
                          </span>
                        ) : null}

                        <span style={S.chipMuted}>{area}</span>

                        {safe(row.evidence.evidence_type) ? (
                          <span style={S.chipMuted}>{safe(row.evidence.evidence_type)}</span>
                        ) : null}

                        {row.overview ? (
                          <span
                            style={{
                              ...S.chip,
                              background: tone.bg,
                              border: `1px solid ${tone.bd}`,
                              color: tone.fg,
                            }}
                          >
                            {safe(row.overview.attention_status) || "Ready"}
                          </span>
                        ) : null}
                      </div>

                      {safe(row.evidence.summary) ? (
                        <div style={S.itemText}>{clip(row.evidence.summary, 200)}</div>
                      ) : safe(row.evidence.body) ? (
                        <div style={S.itemText}>{clip(row.evidence.body, 200)}</div>
                      ) : null}

                      <div style={{ ...S.row, marginTop: 12 }}>
                        {row.student ? (
                          <button
                            style={S.btn}
                            onClick={() =>
                              router.push(`/admin/students/${encodeURIComponent(row.student.id)}`)
                            }
                          >
                            Student
                          </button>
                        ) : null}

                        {row.klass ? (
                          <button
                            style={S.btn}
                            onClick={() =>
                              router.push(`/admin/classes/${encodeURIComponent(row.klass!.id)}`)
                            }
                          >
                            Class
                          </button>
                        ) : null}

                        <button
                          style={S.btn}
                          onClick={() =>
                            router.push(
                              `/admin/evidence-entry?id=${encodeURIComponent(row.evidence.id)}${
                                row.student ? `&studentId=${encodeURIComponent(row.student.id)}` : ""
                              }${
                                row.evidence.class_id ? `&classId=${encodeURIComponent(row.evidence.class_id)}` : ""
                              }&returnTo=${encodeURIComponent(returnTo)}`
                            )
                          }
                        >
                          Edit evidence
                        </button>

                        {row.student ? (
                          <button
                            style={S.btn}
                            onClick={() =>
                              router.push(
                                `/admin/interventions-entry?studentId=${encodeURIComponent(row.student.id)}${
                                  row.student.class_id
                                    ? `&classId=${encodeURIComponent(row.student.class_id)}`
                                    : ""
                                }&returnTo=${encodeURIComponent(returnTo)}`
                              )
                            }
                          >
                            Add support
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}