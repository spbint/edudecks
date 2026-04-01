"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import ModeSwitcher from "@/app/admin/components/ModeSwitcher";
import AdminQuickActionsBar from "@/app/admin/components/AdminQuickActionsBar";
import AdminRecentActivityPanel from "@/app/admin/components/AdminRecentActivityPanel";
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
  year_level?: number | null;
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
  return `${safe(s.preferred_name || s.first_name)} ${safe(
    s.surname || s.family_name
  )}`.trim() || "Student";
}

function classLabel(c: ClassRow | null | undefined) {
  if (!c) return "Class";
  const bits = [c.year_level ? `Year ${c.year_level}` : "", safe(c.name)].filter(Boolean);
  return bits.join(" • ") || "Class";
}

function shortDate(v: string | null | undefined) {
  return safe(v).slice(0, 10) || "—";
}

function daysSince(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return 999;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return 999;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
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
    background: "#f8fafc",
  } as React.CSSProperties,

  main: {
    flex: 1,
    padding: 28,
    color: "#0f172a",
    maxWidth: 1500,
    width: "100%",
  } as React.CSSProperties,

  hero: {
    background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 50%, #eef2ff 100%)",
    border: "1px solid #dbeafe",
    borderRadius: 22,
    padding: 24,
    marginBottom: 18,
  } as React.CSSProperties,

  subtle: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  } as React.CSSProperties,

  h1: {
    margin: "8px 0 0 0",
    fontSize: 34,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  sub: {
    marginTop: 10,
    color: "#475569",
    fontWeight: 700,
    lineHeight: 1.6,
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
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
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
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 14,
  } as React.CSSProperties,

  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  } as React.CSSProperties,

  statValue: {
    fontSize: 28,
    fontWeight: 950,
    marginTop: 6,
    color: "#0f172a",
  } as React.CSSProperties,

  statHelp: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
  } as React.CSSProperties,

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 16,
    marginTop: 16,
    alignItems: "start",
  } as React.CSSProperties,

  leftStack: {
    display: "grid",
    gap: 16,
  } as React.CSSProperties,

  rightStack: {
    display: "grid",
    gap: 16,
  } as React.CSSProperties,

  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 16,
  } as React.CSSProperties,

  title: {
    fontSize: 18,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 10,
  } as React.CSSProperties,

  sectionText: {
    color: "#475569",
    fontWeight: 700,
    lineHeight: 1.5,
    fontSize: 14,
    marginBottom: 12,
  } as React.CSSProperties,

  launchGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: 12,
  } as React.CSSProperties,

  launchCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 14,
    display: "grid",
    gap: 10,
  } as React.CSSProperties,

  launchTitle: {
    fontWeight: 900,
    fontSize: 16,
    color: "#0f172a",
  } as React.CSSProperties,

  launchText: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 1.5,
    fontWeight: 700,
  } as React.CSSProperties,

  launchActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  } as React.CSSProperties,

  smallBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 10px",
    borderRadius: 10,
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    fontWeight: 900,
    textDecoration: "none",
    fontSize: 13,
  } as React.CSSProperties,

  list: {
    display: "grid",
    gap: 10,
  } as React.CSSProperties,

  item: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 12,
  } as React.CSSProperties,

  itemTitle: {
    fontWeight: 850,
    fontSize: 14,
    color: "#0f172a",
  } as React.CSSProperties,

  itemMeta: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
  } as React.CSSProperties,

  chipRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 10,
  } as React.CSSProperties,

  pill: (level: "low" | "watch" | "high"): React.CSSProperties => {
    const t = riskTone(level);
    return {
      display: "inline-flex",
      alignItems: "center",
      padding: "5px 9px",
      borderRadius: 999,
      background: t.bg,
      border: `1px solid ${t.bd}`,
      color: t.fg,
      fontSize: 12,
      fontWeight: 900,
    };
  },

  empty: {
    background: "#ffffff",
    borderRadius: 14,
    padding: 20,
    border: "1px solid #e2e8f0",
    color: "#64748b",
    fontWeight: 700,
  } as React.CSSProperties,
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function AdminHomePage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);
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
          supabase.from("students").select("id,class_id,preferred_name,first_name,surname,family_name,is_ilp,year_level"),
          supabase.from("students").select("id,class_id,preferred_name,first_name,surname,is_ilp,year_level"),
          supabase.from("students").select("id,class_id,preferred_name,first_name,is_ilp,year_level"),
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

  const stats = useMemo(() => {
    const totalClasses = classes.length;
    const totalStudents = students.length;
    const totalEvidence = evidence.length;
    const totalILP = students.filter((s) => s.is_ilp).length;

    const invisibleStudents = students.filter(
      (s) => !evidence.some((e) => safe(e.student_id) === safe(s.id))
    ).length;

    const overdueReviews = interventions.filter((i) => {
      const due = safe(i.review_due_on || i.review_date || i.due_on);
      if (!due) return false;
      return new Date(due).getTime() < Date.now() &&
        !["completed", "cancelled"].includes(safe(i.status).toLowerCase());
    }).length;

    return {
      totalClasses,
      totalStudents,
      totalEvidence,
      totalILP,
      invisibleStudents,
      overdueReviews,
    };
  }, [classes, students, evidence, interventions]);

  const schoolReadiness = useMemo(() => {
    if (stats.totalStudents === 0) return "watch";
    const visiblePct = Math.round(((stats.totalStudents - stats.invisibleStudents) / stats.totalStudents) * 100);
    if (visiblePct >= 85 && stats.overdueReviews === 0) return "low" as const;
    if (visiblePct >= 60) return "watch" as const;
    return "high" as const;
  }, [stats]);

  const familyReadiness = useMemo(() => {
    const latestEvidence = evidence
      .map((e) => safe(e.occurred_on || e.created_at))
      .filter(Boolean)
      .sort()
      .reverse()[0] || null;

    const days = daysSince(latestEvidence);
    if (stats.totalEvidence >= 20 && days <= 14) return "low" as const;
    if (stats.totalEvidence >= 8 && days <= 30) return "watch" as const;
    return "high" as const;
  }, [evidence, stats]);

  const recentStudents = useMemo(() => students.slice(0, 6), [students]);

  const recentEvidence = useMemo(() => {
    return evidence
      .slice()
      .sort((a, b) => {
        const ad = safe(a.occurred_on || a.created_at);
        const bd = safe(b.occurred_on || b.created_at);
        return bd.localeCompare(ad);
      })
      .slice(0, 8);
  }, [evidence]);

  const launchCards = useMemo(() => {
    return [
      {
        title: "School Mode",
        text: "Leadership, class heatmaps, student hubs, interventions, and report workflows.",
        links: [
          { label: "Leadership", href: "/admin/leadership" },
          { label: "Leadership Heatmap", href: "/admin/leadership/heatmap" },
          { label: "Evidence Feed", href: "/admin/evidence-feed" },
        ],
      },
      {
        title: "Family Mode",
        text: "Parent dashboard, homeschool reporting, print centre, and family-friendly evidence views.",
        links: [
          { label: "Parent Dashboard", href: "/admin/parent-dashboard" },
          { label: "Homeschool Reporting", href: "/admin/homeschool-reporting" },
          { label: "Family Print Centre", href: "/admin/family-print-centre" },
        ],
      },
      {
        title: "Capture & Input",
        text: "Fast pathways for adding evidence and driving all downstream analytics and reporting.",
        links: [
          { label: "Add Evidence", href: "/admin/evidence-entry" },
          { label: "Evidence Feed", href: "/admin/evidence-feed" },
        ],
      },
      {
        title: "Outputs & Reports",
        text: "Portfolio, print, and report-generation surfaces for meetings, moderation, and submissions.",
        links: [
          { label: "Reporting", href: "/admin/reporting" },
          { label: "Family Print Centre", href: "/admin/family-print-centre" },
        ],
      },
    ];
  }, []);

  const classHotspots = useMemo(() => {
    return classes
      .map((c) => {
        const classStudents = students.filter((s) => safe(s.class_id) === safe(c.id));
        const classEvidence = evidence.filter((e) => safe(e.class_id) === safe(c.id));
        const visible = new Set(classEvidence.map((e) => safe(e.student_id)).filter(Boolean)).size;
        const coverage = classStudents.length ? Math.round((visible / classStudents.length) * 100) : 0;

        let risk: "low" | "watch" | "high" = "low";
        if (coverage < 40) risk = "high";
        else if (coverage < 70) risk = "watch";

        return {
          klass: c,
          studentCount: classStudents.length,
          evidenceCount: classEvidence.length,
          coverage,
          risk,
        };
      })
      .sort((a, b) => {
        const m = { high: 3, watch: 2, low: 1 };
        return m[b.risk] - m[a.risk] || a.coverage - b.coverage;
      })
      .slice(0, 6);
  }, [classes, students, evidence]);

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <ModeSwitcher mode="school" />
        <AdminQuickActionsBar />

        <section style={S.hero}>
          <div style={S.subtle}>Unified Landing / Command Home</div>
          <h1 style={S.h1}>MAX Command Home</h1>
          <div style={S.sub}>
            This is the front door for EduDecks. Use it to move quickly between school and family modes, monitor platform readiness, and launch the most important workflows from one place.
          </div>

          <div style={S.heroActions}>
            <Link href="/admin/leadership" style={S.btn}>
              Open School Mode
            </Link>
            <Link href="/admin/parent-dashboard" style={S.btnGhost}>
              Open Family Mode
            </Link>
            <button style={S.btnGhost} onClick={() => window.location.reload()}>
              {busy ? "Refreshing..." : "Refresh data"}
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
              <div style={S.statHelp}>Visible learners in platform</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statLabel}>Evidence</div>
              <div style={S.statValue}>{stats.totalEvidence}</div>
              <div style={S.statHelp}>Recorded evidence items</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statLabel}>ILP</div>
              <div style={S.statValue}>{stats.totalILP}</div>
              <div style={S.statHelp}>Students with support profile</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statLabel}>Invisible students</div>
              <div style={S.statValue}>{stats.invisibleStudents}</div>
              <div style={S.statHelp}>No evidence recorded yet</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statLabel}>Overdue reviews</div>
              <div style={S.statValue}>{stats.overdueReviews}</div>
              <div style={S.statHelp}>Support reviews past due</div>
            </div>
          </div>
        </section>

        <section style={S.contentGrid}>
          <div style={S.leftStack}>
            <section style={S.card}>
              <div style={S.title}>Launch surfaces</div>
              <div style={S.sectionText}>
                Choose a mode or workflow and move straight into the operational surface you need.
              </div>

              <div style={S.launchGrid}>
                {launchCards.map((card) => (
                  <div key={card.title} style={S.launchCard}>
                    <div style={S.launchTitle}>{card.title}</div>
                    <div style={S.launchText}>{card.text}</div>
                    <div style={S.launchActions}>
                      {card.links.map((l) => (
                        <Link key={l.href} href={l.href} style={S.smallBtn}>
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={S.title}>Mode readiness</div>
                <div style={S.chipRow}>
                  <span style={S.pill(schoolReadiness)}>
                    School Mode: {schoolReadiness === "low" ? "Strong" : schoolReadiness === "watch" ? "Watch" : "Attention"}
                  </span>
                  <span style={S.pill(familyReadiness)}>
                    Family Mode: {familyReadiness === "low" ? "Strong" : familyReadiness === "watch" ? "Watch" : "Attention"}
                  </span>
                </div>
              </div>
            </section>

            <AdminRecentActivityPanel />
          </div>

          <div style={S.rightStack}>
            <section style={S.card}>
              <div style={S.title}>Class hotspots</div>
              <div style={S.list}>
                {classHotspots.map((c) => (
                  <div key={safe(c.klass.id)} style={S.item}>
                    <div style={S.itemTitle}>{classLabel(c.klass)}</div>
                    <div style={S.itemMeta}>
                      Students {c.studentCount} • Evidence {c.evidenceCount} • Coverage {c.coverage}%
                    </div>
                    <div style={S.chipRow}>
                      <span style={S.pill(c.risk)}>
                        {c.risk === "high" ? "High" : c.risk === "watch" ? "Watch" : "Low"}
                      </span>
                      <Link href={`/admin/classes/${encodeURIComponent(safe(c.klass.id))}`} style={S.smallBtn}>
                        Open class
                      </Link>
                    </div>
                  </div>
                ))}
                {classHotspots.length === 0 ? (
                  <div style={S.empty}>No classes available yet.</div>
                ) : null}
              </div>
            </section>

            <section style={S.card}>
              <div style={S.title}>Recent evidence activity</div>
              <div style={S.list}>
                {recentEvidence.map((e) => {
                  const student = students.find((s) => safe(s.id) === safe(e.student_id));
                  return (
                    <div key={safe(e.id)} style={S.item}>
                      <div style={S.itemTitle}>{safe(e.title) || "Evidence entry"}</div>
                      <div style={S.itemMeta}>
                        {studentName(student)} • {shortDate(e.occurred_on || e.created_at)} • {safe(e.learning_area) || "General"}
                      </div>
                    </div>
                  );
                })}
                {recentEvidence.length === 0 ? (
                  <div style={S.empty}>No evidence activity recorded yet.</div>
                ) : null}
              </div>
            </section>

            <section style={S.card}>
              <div style={S.title}>Recent student roster</div>
              <div style={S.list}>
                {recentStudents.map((s) => (
                  <div key={safe(s.id)} style={S.item}>
                    <div style={S.itemTitle}>{studentName(s)}</div>
                    <div style={S.itemMeta}>
                      {s.year_level != null ? `Year ${s.year_level}` : "Year level not set"}
                      {s.is_ilp ? " • ILP" : ""}
                    </div>
                    <div style={S.chipRow}>
                      <Link href={`/admin/students/${encodeURIComponent(safe(s.id))}`} style={S.smallBtn}>
                        Profile
                      </Link>
                      <Link href={`/admin/students/${encodeURIComponent(safe(s.id))}/portfolio`} style={S.smallBtn}>
                        Portfolio
                      </Link>
                    </div>
                  </div>
                ))}
                {recentStudents.length === 0 ? (
                  <div style={S.empty}>No students available yet.</div>
                ) : null}
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}