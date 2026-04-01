"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import ModeSwitcher from "@/app/admin/components/ModeSwitcher";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type ClassRow = {
  id: string;
  name?: string | null;
  year_level?: number | null;
  teacher_name?: string | null;
  room?: string | null;
  [k: string]: any;
};

type StudentRow = {
  id: string;
  class_id?: string | null;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  is_ilp?: boolean | null;
  [k: string]: any;
};

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  learning_area?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

type InterventionRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  status?: string | null;
  review_date?: string | null;
  review_due_on?: string | null;
  due_on?: string | null;
  created_at?: string | null;
  [k: string]: any;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function studentName(s: StudentRow | null | undefined) {
  if (!s) return "Student";
  return `${safe(s.preferred_name || s.first_name)} ${safe(s.surname || s.family_name)}`.trim() || "Student";
}

function shortDate(v: string | null | undefined) {
  return safe(v).slice(0, 10) || "—";
}

function classLabel(c: ClassRow | null | undefined) {
  if (!c) return "Class";
  const bits = [c.year_level ? `Year ${c.year_level}` : "", safe(c.name)].filter(Boolean);
  return bits.join(" • ") || "Class";
}

function daysSince(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return 999;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return 999;
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function riskTone(level: "low" | "watch" | "high") {
  if (level === "high") return { bg: "#7f1d1d", bd: "#b91c1c", fg: "#fecaca" };
  if (level === "watch") return { bg: "#78350f", bd: "#d97706", fg: "#fde68a" };
  return { bg: "#14532d", bd: "#16a34a", fg: "#bbf7d0" };
}

/* ───────────────────────── STYLES ───────────────────────── */

const S = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#0f172a",
  } as React.CSSProperties,

  main: {
    flex: 1,
    padding: 28,
    color: "#e5e7eb",
    maxWidth: 1440,
    width: "100%",
  } as React.CSSProperties,

  hero: {
    background: "linear-gradient(135deg, #111827 0%, #0f172a 100%)",
    border: "1px solid #1f2937",
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
  } as React.CSSProperties,

  subtle: {
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  } as React.CSSProperties,

  h1: {
    margin: "8px 0 0 0",
    fontSize: 30,
    fontWeight: 950,
  } as React.CSSProperties,

  sub: {
    marginTop: 10,
    color: "#94a3b8",
    fontWeight: 700,
    lineHeight: 1.5,
    maxWidth: 980,
  } as React.CSSProperties,

  heroActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 16,
  } as React.CSSProperties,

  btn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 10,
    background: "#2563eb",
    border: "none",
    color: "#fff",
    fontWeight: 900,
    textDecoration: "none",
    cursor: "pointer",
  } as React.CSSProperties,

  btnGhost: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 10,
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#e5e7eb",
    fontWeight: 900,
    textDecoration: "none",
    cursor: "pointer",
  } as React.CSSProperties,

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: 12,
    marginTop: 18,
  } as React.CSSProperties,

  statCard: {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: 14,
    padding: 14,
  } as React.CSSProperties,

  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  } as React.CSSProperties,

  statValue: {
    fontSize: 28,
    fontWeight: 950,
    marginTop: 6,
  } as React.CSSProperties,

  statHelp: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
  } as React.CSSProperties,

  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 16,
    marginTop: 16,
    alignItems: "start",
  } as React.CSSProperties,

  card: {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: 16,
    padding: 16,
  } as React.CSSProperties,

  title: {
    fontSize: 18,
    fontWeight: 900,
    marginBottom: 10,
  } as React.CSSProperties,

  controls: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 12,
  } as React.CSSProperties,

  input: {
    minWidth: 240,
    padding: "10px 12px",
    borderRadius: 10,
    background: "#0b1220",
    border: "1px solid #334155",
    color: "#e5e7eb",
    fontWeight: 800,
  } as React.CSSProperties,

  select: {
    minWidth: 200,
    padding: "10px 12px",
    borderRadius: 10,
    background: "#0b1220",
    border: "1px solid #334155",
    color: "#e5e7eb",
    fontWeight: 800,
  } as React.CSSProperties,

  tableWrap: {
    overflow: "auto",
    border: "1px solid #1f2937",
    borderRadius: 14,
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 820,
  } as React.CSSProperties,

  th: {
    textAlign: "left",
    padding: "12px 12px",
    fontSize: 12,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    borderBottom: "1px solid #1f2937",
    background: "#0b1220",
  } as React.CSSProperties,

  td: {
    padding: "12px 12px",
    borderBottom: "1px solid #1f2937",
    verticalAlign: "top",
    fontSize: 14,
  } as React.CSSProperties,

  classLink: {
    color: "#e5e7eb",
    fontWeight: 900,
    textDecoration: "none",
  } as React.CSSProperties,

  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: 999,
    background: "#1e293b",
    border: "1px solid #334155",
    fontSize: 12,
    fontWeight: 900,
    color: "#e5e7eb",
  } as React.CSSProperties,

  list: {
    display: "grid",
    gap: 10,
  } as React.CSSProperties,

  item: {
    background: "#0b1220",
    border: "1px solid #1f2937",
    borderRadius: 12,
    padding: 12,
  } as React.CSSProperties,

  itemTitle: {
    fontWeight: 850,
    fontSize: 14,
  } as React.CSSProperties,

  itemMeta: {
    marginTop: 4,
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 700,
  } as React.CSSProperties,

  empty: {
    background: "#111827",
    borderRadius: 14,
    padding: 20,
    border: "1px solid #1f2937",
    color: "#94a3b8",
    fontWeight: 700,
  } as React.CSSProperties,

  pill: (level: "low" | "watch" | "high"): React.CSSProperties => {
    const t = riskTone(level);
    return {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      borderRadius: 999,
      background: t.bg,
      border: `1px solid ${t.bd}`,
      color: t.fg,
      fontSize: 12,
      fontWeight: 900,
    };
  },
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function LeadershipCommandCentrePage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      setBusy(true);
      try {
        const classQueries = [
          supabase.from("classes").select("id,name,year_level,teacher_name,room").order("year_level", { ascending: true }).order("name"),
          supabase.from("classes").select("id,name,year_level,room").order("year_level", { ascending: true }).order("name"),
          supabase.from("classes").select("id,name").order("name"),
        ];

        let loadedClasses: ClassRow[] = [];
        for (const q of classQueries) {
          const r = await q;
          if (!r.error) {
            loadedClasses = (r.data as ClassRow[]) ?? [];
            break;
          }
          if (!isMissingRelationOrColumn(r.error)) throw r.error;
        }

        const studentQueries = [
          supabase.from("students").select("id,class_id,preferred_name,first_name,surname,family_name,is_ilp"),
          supabase.from("students").select("id,class_id,preferred_name,first_name,surname,is_ilp"),
          supabase.from("students").select("id,class_id,preferred_name,first_name,is_ilp"),
        ];

        let loadedStudents: StudentRow[] = [];
        for (const q of studentQueries) {
          const r = await q;
          if (!r.error) {
            loadedStudents = (r.data as StudentRow[]) ?? [];
            break;
          }
          if (!isMissingRelationOrColumn(r.error)) throw r.error;
        }

        const evidenceQueries = [
          supabase.from("evidence_entries").select("id,student_id,class_id,title,learning_area,occurred_on,created_at,is_deleted").eq("is_deleted", false),
          supabase.from("evidence_entries").select("id,student_id,class_id,title,learning_area,occurred_on,created_at"),
        ];

        let loadedEvidence: EvidenceRow[] = [];
        for (const q of evidenceQueries) {
          const r = await q;
          if (!r.error) {
            loadedEvidence = ((r.data as EvidenceRow[]) ?? []).filter((x) => x.is_deleted !== true);
            break;
          }
          if (!isMissingRelationOrColumn(r.error)) throw r.error;
        }

        const interventionQueries = [
          supabase.from("interventions").select("id,student_id,class_id,title,status,review_date,review_due_on,due_on,created_at").order("created_at", { ascending: false }),
          supabase.from("interventions").select("id,student_id,class_id,title,status,created_at").order("created_at", { ascending: false }),
        ];

        let loadedInterventions: InterventionRow[] = [];
        for (const q of interventionQueries) {
          const r = await q;
          if (!r.error) {
            loadedInterventions = (r.data as InterventionRow[]) ?? [];
            break;
          }
          if (!isMissingRelationOrColumn(r.error)) throw r.error;
        }

        setClasses(loadedClasses);
        setStudents(loadedStudents);
        setEvidence(loadedEvidence);
        setInterventions(loadedInterventions);
      } catch (e) {
        console.error(e);
      } finally {
        setBusy(false);
      }
    }

    load();
  }, []);

  const classRows = useMemo(() => {
    const evidenceByClass: Record<string, EvidenceRow[]> = {};
    evidence.forEach((e) => {
      const key = safe(e.class_id);
      if (!key) return;
      if (!evidenceByClass[key]) evidenceByClass[key] = [];
      evidenceByClass[key].push(e);
    });

    const studentsByClass: Record<string, StudentRow[]> = {};
    students.forEach((s) => {
      const key = safe(s.class_id);
      if (!key) return;
      if (!studentsByClass[key]) studentsByClass[key] = [];
      studentsByClass[key].push(s);
    });

    const interventionsByClass: Record<string, InterventionRow[]> = {};
    interventions.forEach((i) => {
      const key = safe(i.class_id);
      if (!key) return;
      if (!interventionsByClass[key]) interventionsByClass[key] = [];
      interventionsByClass[key].push(i);
    });

    return classes.map((c) => {
      const classStudents = studentsByClass[safe(c.id)] || [];
      const classEvidence = evidenceByClass[safe(c.id)] || [];
      const classInterventions = interventionsByClass[safe(c.id)] || [];

      const latestEvidenceDate = classEvidence
        .map((e) => safe(e.occurred_on || e.created_at))
        .filter(Boolean)
        .sort()
        .reverse()[0] || null;

      const days = daysSince(latestEvidenceDate);

      const studentsWithEvidence = new Set(classEvidence.map((e) => safe(e.student_id)).filter(Boolean)).size;
      const coveragePct = classStudents.length
        ? Math.round((studentsWithEvidence / classStudents.length) * 100)
        : 0;

      const openInterventions = classInterventions.filter(
        (i) => !["completed", "cancelled"].includes(safe(i.status).toLowerCase())
      ).length;

      const overdueReviews = classInterventions.filter((i) => {
        const review = safe(i.review_due_on || i.review_date || i.due_on);
        if (!review) return false;
        return new Date(review).getTime() < Date.now() &&
          !["completed", "cancelled"].includes(safe(i.status).toLowerCase());
      }).length;

      let risk: "low" | "watch" | "high" = "low";
      if (coveragePct < 40 || overdueReviews >= 3 || days > 30) risk = "high";
      else if (coveragePct < 70 || overdueReviews >= 1 || days > 14) risk = "watch";

      return {
        klass: c,
        studentCount: classStudents.length,
        ilpCount: classStudents.filter((s) => s.is_ilp).length,
        evidenceCount: classEvidence.length,
        coveragePct,
        latestEvidenceDate,
        daysSinceEvidence: days,
        openInterventions,
        overdueReviews,
        risk,
      };
    });
  }, [classes, students, evidence, interventions]);

  const filteredClassRows = useMemo(() => {
    const q = search.toLowerCase().trim();

    return classRows
      .filter((r) => {
        if (riskFilter !== "All" && r.risk !== riskFilter.toLowerCase()) return false;
        if (!q) return true;
        return [
          classLabel(r.klass),
          safe(r.klass.teacher_name),
          safe(r.klass.room),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        const riskScore = { high: 3, watch: 2, low: 1 };
        return riskScore[b.risk] - riskScore[a.risk] || a.daysSinceEvidence - b.daysSinceEvidence;
      });
  }, [classRows, search, riskFilter]);

  const invisibleStudents = useMemo(() => {
    const evidenceByStudent = new Set(evidence.map((e) => safe(e.student_id)).filter(Boolean));
    return students
      .filter((s) => !evidenceByStudent.has(safe(s.id)))
      .slice(0, 10);
  }, [students, evidence]);

  const overdueItems = useMemo(() => {
    return interventions
      .filter((i) => {
        const review = safe(i.review_due_on || i.review_date || i.due_on);
        if (!review) return false;
        return new Date(review).getTime() < Date.now() &&
          !["completed", "cancelled"].includes(safe(i.status).toLowerCase());
      })
      .slice(0, 10);
  }, [interventions]);

  const stats = useMemo(() => {
    const totalClasses = classRows.length;
    const totalStudents = students.length;
    const totalEvidence = evidence.length;
    const totalILP = students.filter((s) => s.is_ilp).length;
    const classesAtRisk = classRows.filter((r) => r.risk === "high").length;
    const reviewOverdue = overdueItems.length;

    return {
      totalClasses,
      totalStudents,
      totalEvidence,
      totalILP,
      classesAtRisk,
      reviewOverdue,
    };
  }, [classRows, students, evidence, overdueItems]);

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <ModeSwitcher mode="school" />

        <section style={S.hero}>
          <div style={S.subtle}>Leadership • Command Centre</div>
          <h1 style={S.h1}>MAX Leadership Command Centre</h1>
          <div style={S.sub}>
            Whole-school oversight for class coverage, intervention pressure, visibility risk, and next leadership actions. This page is designed to feel like a premium command surface rather than a static dashboard.
          </div>

          <div style={S.heroActions}>
            <Link href="/admin/leadership/heatmap" style={S.btn}>
              Open Leadership Heatmap
            </Link>
            <Link href="/admin/reporting" style={S.btnGhost}>
              Open Reporting Centre
            </Link>
            <button style={S.btnGhost} onClick={() => window.location.reload()}>
              {busy ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div style={S.statGrid}>
            <div style={S.statCard}>
              <div style={S.statLabel}>Classes</div>
              <div style={S.statValue}>{stats.totalClasses}</div>
              <div style={S.statHelp}>Active learning groups</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statLabel}>Students</div>
              <div style={S.statValue}>{stats.totalStudents}</div>
              <div style={S.statHelp}>Total visible learners</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statLabel}>Evidence</div>
              <div style={S.statValue}>{stats.totalEvidence}</div>
              <div style={S.statHelp}>Recorded evidence items</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statLabel}>ILP</div>
              <div style={S.statValue}>{stats.totalILP}</div>
              <div style={S.statHelp}>Students with ILP flag</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statLabel}>Classes at risk</div>
              <div style={{ ...S.statValue, color: stats.classesAtRisk > 0 ? "#fca5a5" : "#bbf7d0" }}>
                {stats.classesAtRisk}
              </div>
              <div style={S.statHelp}>High-priority leadership watch</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statLabel}>Overdue reviews</div>
              <div style={{ ...S.statValue, color: stats.reviewOverdue > 0 ? "#fdba74" : "#bbf7d0" }}>
                {stats.reviewOverdue}
              </div>
              <div style={S.statHelp}>Open intervention reviews</div>
            </div>
          </div>
        </section>

        <section style={S.sectionGrid}>
          <section style={S.card}>
            <div style={S.title}>Class oversight</div>

            <div style={S.controls}>
              <input
                style={S.input}
                placeholder="Search class, teacher, room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                style={S.select}
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
              >
                <option value="All">All risk levels</option>
                <option value="High">High</option>
                <option value="Watch">Watch</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Class</th>
                    <th style={S.th}>Students</th>
                    <th style={S.th}>Coverage</th>
                    <th style={S.th}>Latest evidence</th>
                    <th style={S.th}>Interventions</th>
                    <th style={S.th}>Risk</th>
                    <th style={S.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClassRows.map((row) => (
                    <tr key={safe(row.klass.id)}>
                      <td style={S.td}>
                        <div>
                          <Link
                            href={`/admin/classes/${encodeURIComponent(safe(row.klass.id))}`}
                            style={S.classLink}
                          >
                            {classLabel(row.klass)}
                          </Link>
                        </div>
                        <div style={{ marginTop: 4, color: "#94a3b8", fontSize: 12 }}>
                          {safe(row.klass.teacher_name) || "No teacher"}{safe(row.klass.room) ? ` • ${safe(row.klass.room)}` : ""}
                        </div>
                      </td>

                      <td style={S.td}>
                        <div>{row.studentCount}</div>
                        <div style={{ marginTop: 4 }}>
                          <span style={S.chip}>ILP {row.ilpCount}</span>
                        </div>
                      </td>

                      <td style={S.td}>
                        <div style={{ fontWeight: 900 }}>{row.coveragePct}%</div>
                        <div style={{ marginTop: 4, color: "#94a3b8", fontSize: 12 }}>
                          {row.evidenceCount} evidence items
                        </div>
                      </td>

                      <td style={S.td}>
                        <div>{shortDate(row.latestEvidenceDate)}</div>
                        <div style={{ marginTop: 4, color: "#94a3b8", fontSize: 12 }}>
                          {row.daysSinceEvidence >= 999 ? "No evidence" : `${row.daysSinceEvidence}d ago`}
                        </div>
                      </td>

                      <td style={S.td}>
                        <div>Open {row.openInterventions}</div>
                        <div style={{ marginTop: 4, color: "#94a3b8", fontSize: 12 }}>
                          Overdue {row.overdueReviews}
                        </div>
                      </td>

                      <td style={S.td}>
                        <span style={S.pill(row.risk)}>
                          {row.risk === "high" ? "High" : row.risk === "watch" ? "Watch" : "Low"}
                        </span>
                      </td>

                      <td style={S.td}>
                        <div style={{ ...S.row, gap: 8 }}>
                          <Link
                            href={`/admin/classes/${encodeURIComponent(safe(row.klass.id))}`}
                            style={S.btnGhost}
                          >
                            Hub
                          </Link>
                          <Link
                            href={`/admin/classes/${encodeURIComponent(safe(row.klass.id))}/heatmap`}
                            style={S.btn}
                          >
                            Heatmap
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredClassRows.length === 0 ? (
                    <tr>
                      <td style={S.td} colSpan={7}>
                        <div style={S.empty}>No classes match the current filters.</div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ display: "grid", gap: 16 }}>
            <section style={S.card}>
              <div style={S.title}>Invisible students</div>
              <div style={S.list}>
                {invisibleStudents.map((s) => (
                  <div key={safe(s.id)} style={S.item}>
                    <div style={S.itemTitle}>{studentName(s)}</div>
                    <div style={S.itemMeta}>
                      {classLabel(classes.find((c) => safe(c.id) === safe(s.class_id)) || null)}
                      {s.is_ilp ? " • ILP" : ""}
                    </div>
                  </div>
                ))}
                {invisibleStudents.length === 0 ? (
                  <div style={S.empty}>All students currently have at least one evidence item.</div>
                ) : null}
              </div>
            </section>

            <section style={S.card}>
              <div style={S.title}>Overdue intervention reviews</div>
              <div style={S.list}>
                {overdueItems.map((i) => {
                  const student = students.find((s) => safe(s.id) === safe(i.student_id));
                  return (
                    <div key={safe(i.id)} style={S.item}>
                      <div style={S.itemTitle}>{safe(i.title) || "Intervention"}</div>
                      <div style={S.itemMeta}>
                        {studentName(student)} • Due {shortDate(i.review_due_on || i.review_date || i.due_on)}
                      </div>
                    </div>
                  );
                })}
                {overdueItems.length === 0 ? (
                  <div style={S.empty}>No overdue intervention reviews found.</div>
                ) : null}
              </div>
            </section>
          </section>
        </section>
      </main>
    </div>
  );
}