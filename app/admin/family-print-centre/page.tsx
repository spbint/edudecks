"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import FamilyShell from "@/app/admin/components/FamilyShell";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type StudentRow = {
  id: string;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  year_level?: number | null;
  is_ilp?: boolean | null;
  [k: string]: any;
};

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  learning_area?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

type InterventionRow = {
  id: string;
  student_id?: string | null;
  title?: string | null;
  status?: string | null;
  review_date?: string | null;
  review_due_on?: string | null;
  due_on?: string | null;
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
  if (!s) return "Child";
  return `${safe(s.preferred_name || s.first_name)} ${safe(s.surname || s.family_name)}`.trim() || "Child";
}

function shortDate(v: string | null | undefined) {
  return safe(v).slice(0, 10) || "—";
}

function startOfCurrentYear() {
  const d = new Date();
  return `${d.getFullYear()}-01-01`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysSince(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return 999;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return 999;
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function readinessLabel(evidenceCount: number, lastDate: string | null | undefined) {
  const days = daysSince(lastDate);
  if (evidenceCount >= 6 && days <= 14) return "Strong";
  if (evidenceCount >= 3 && days <= 30) return "Building";
  return "Needs attention";
}

function readinessTone(label: string) {
  if (label === "Strong") return { bg: "#14532d", bd: "#16a34a", fg: "#bbf7d0" };
  if (label === "Building") return { bg: "#78350f", bd: "#d97706", fg: "#fde68a" };
  return { bg: "#7f1d1d", bd: "#b91c1c", fg: "#fecaca" };
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
    maxWidth: 1440,
    width: "100%",
  } as React.CSSProperties,

  periodControls: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 16,
  } as React.CSSProperties,

  input: {
    minWidth: 180,
    padding: "10px 12px",
    borderRadius: 10,
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    fontWeight: 800,
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
    cursor: "pointer",
  } as React.CSSProperties,

  btnGhost: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 10,
    background: "#fff",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginTop: 16,
    alignItems: "start",
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

  outputsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 12,
  } as React.CSSProperties,

  outputCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 14,
    display: "grid",
    gap: 10,
  } as React.CSSProperties,

  outputTitle: {
    fontWeight: 900,
    fontSize: 16,
    color: "#0f172a",
  } as React.CSSProperties,

  outputText: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 1.5,
    fontWeight: 700,
  } as React.CSSProperties,

  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 4,
  } as React.CSSProperties,

  actionBtn: {
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

  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: 999,
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    fontSize: 12,
    fontWeight: 900,
    color: "#4338ca",
  } as React.CSSProperties,

  pill: (label: string): React.CSSProperties => {
    const t = readinessTone(label);
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

export default function FamilyPrintCentrePage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [periodStart, setPeriodStart] = useState(startOfCurrentYear());
  const [periodEnd, setPeriodEnd] = useState(todayIso());

  useEffect(() => {
    async function load() {
      /* students */
      const studentQueries = [
        supabase.from("students").select("id,preferred_name,first_name,surname,family_name,is_ilp,year_level"),
        supabase.from("students").select("id,preferred_name,first_name,surname,is_ilp,year_level"),
        supabase.from("students").select("id,preferred_name,first_name,is_ilp,year_level"),
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

      /* evidence */
      const evidenceQueries = [
        supabase
          .from("evidence_entries")
          .select("id,student_id,learning_area,occurred_on,created_at,is_deleted")
          .eq("is_deleted", false)
          .order("occurred_on", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("evidence_entries")
          .select("id,student_id,learning_area,occurred_on,created_at")
          .order("occurred_on", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false }),
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

      /* interventions */
      const interventionQueries = [
        supabase
          .from("interventions")
          .select("id,student_id,title,status,review_date,review_due_on,due_on")
          .order("created_at", { ascending: false }),
        supabase
          .from("interventions")
          .select("id,student_id,title,status")
          .order("created_at", { ascending: false }),
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

      setStudents(loadedStudents);
      setEvidence(loadedEvidence);
      setInterventions(loadedInterventions);

      if (loadedStudents.length && !selectedStudentId) {
        setSelectedStudentId(safe(loadedStudents[0].id));
      }
    }

    load().catch((e) => console.error(e));
  }, [selectedStudentId]);

  const childOptions = useMemo(
    () =>
      students.map((s) => ({
        id: safe(s.id),
        label: studentName(s),
      })),
    [students]
  );

  const selectedStudent = useMemo(
    () => students.find((s) => safe(s.id) === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const filteredEvidence = useMemo(() => {
    return evidence.filter((e) => {
      if (safe(e.student_id) !== selectedStudentId) return false;
      const date = safe(e.occurred_on || e.created_at).slice(0, 10);
      if (periodStart && date < periodStart) return false;
      if (periodEnd && date > periodEnd) return false;
      return true;
    });
  }, [evidence, selectedStudentId, periodStart, periodEnd]);

  const groupedAreas = useMemo(() => {
    const map = new Map<string, number>();
    filteredEvidence.forEach((e) => {
      const area = safe(e.learning_area) || "General";
      map.set(area, (map.get(area) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredEvidence]);

  const selectedInterventions = useMemo(() => {
    return interventions.filter((i) => safe(i.student_id) === selectedStudentId);
  }, [interventions, selectedStudentId]);

  const openSupport = useMemo(() => {
    return selectedInterventions.filter(
      (i) => !["completed", "cancelled"].includes(safe(i.status).toLowerCase())
    );
  }, [selectedInterventions]);

  const latestEvidenceDate =
    filteredEvidence[0]?.occurred_on || filteredEvidence[0]?.created_at || null;

  const readiness = readinessLabel(filteredEvidence.length, latestEvidenceDate);

  const stats = useMemo(
    () => [
      {
        label: "Child",
        value: studentName(selectedStudent),
        help: selectedStudent?.year_level != null ? `Year ${selectedStudent.year_level}` : "Year level not set",
      },
      {
        label: "Evidence items",
        value: filteredEvidence.length,
        help: "Items in the selected period",
      },
      {
        label: "Learning areas",
        value: groupedAreas.length,
        help: "Areas represented in this pack",
      },
      {
        label: "Readiness",
        value: readiness,
        help: `Latest evidence ${shortDate(latestEvidenceDate)}`,
      },
    ],
    [selectedStudent, filteredEvidence, groupedAreas, readiness, latestEvidenceDate]
  );

  const outputLinks = useMemo(() => {
    if (!selectedStudentId) return [];

    const baseStudent = `/admin/students/${encodeURIComponent(selectedStudentId)}`;

    return [
      {
        title: "Print Portfolio",
        description:
          "Clean portfolio output for parent meetings, moderation, and PDF export from the browser.",
        href: `${baseStudent}/portfolio-print`,
        action: "Open print view",
      },
      {
        title: "Working Portfolio",
        description:
          "The standard portfolio page for browsing evidence before printing or exporting.",
        href: `${baseStudent}/portfolio`,
        action: "Open portfolio",
      },
      {
        title: "Report Draft",
        description:
          "Narrative-style summary builder using stored evidence to help prepare reports or family summaries.",
        href: `${baseStudent}/reports`,
        action: "Open report draft",
      },
      {
        title: "Learning Timeline",
        description:
          "Chronological evidence stream showing how learning has developed over time.",
        href: `${baseStudent}/timeline`,
        action: "Open timeline",
      },
      {
        title: "Homeschool Reporting Mode",
        description:
          "Family-facing evidence grouping and reporting workspace for home education contexts.",
        href: `/admin/homeschool-reporting`,
        action: "Open reporting mode",
      },
      {
        title: "Add New Evidence",
        description:
          "Quick route to capture another learning record before printing or exporting.",
        href: `/admin/evidence-entry?studentId=${encodeURIComponent(selectedStudentId)}`,
        action: "Add evidence",
      },
    ];
  }, [selectedStudentId]);

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <FamilyShell
          title="MAX Family Print Centre"
          subtitle="Choose the best output view for meetings, submissions, or family records. This page brings your main printable and export-ready surfaces together in one clear place."
          selectedChildId={selectedStudentId}
          onChildChange={setSelectedStudentId}
          childrenOptions={childOptions}
          stats={stats}
          primaryHref={selectedStudentId ? `/admin/students/${encodeURIComponent(selectedStudentId)}/portfolio-print` : "/admin/family-print-centre"}
          primaryLabel="Open print portfolio"
          secondaryHref="/admin/homeschool-reporting"
          secondaryLabel="Open homeschool reporting"
        >
          <div style={S.periodControls}>
            <input
              style={S.input}
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
            <input
              style={S.input}
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
            <button
              style={S.btnGhost}
              onClick={() => {
                setPeriodStart(startOfCurrentYear());
                setPeriodEnd(todayIso());
              }}
            >
              Reset period
            </button>
          </div>

          <section style={S.grid}>
            <section style={S.card}>
              <div style={S.title}>Output surfaces</div>
              <div style={S.sectionText}>
                Pick the most suitable view for printing, saving to PDF, preparing a meeting handout, or reviewing a child’s learning evidence.
              </div>

              {outputLinks.length === 0 ? (
                <div style={S.empty}>Choose a child first to unlock output views.</div>
              ) : (
                <div style={S.outputsGrid}>
                  {outputLinks.map((o) => (
                    <div key={o.title} style={S.outputCard}>
                      <div style={S.outputTitle}>{o.title}</div>
                      <div style={S.outputText}>{o.description}</div>
                      <div style={S.actions}>
                        <Link href={o.href} style={S.actionBtn}>
                          {o.action}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section style={{ display: "grid", gap: 16 }}>
              <section style={S.card}>
                <div style={S.title}>Selected child snapshot</div>

                {selectedStudent ? (
                  <>
                    <div style={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>
                      {studentName(selectedStudent)}
                    </div>

                    <div style={S.chipRow}>
                      {selectedStudent.year_level != null ? (
                        <span style={S.chip}>Year {selectedStudent.year_level}</span>
                      ) : null}
                      {selectedStudent.is_ilp ? <span style={S.chip}>Support profile</span> : null}
                      <span style={S.pill(readiness)}>{readiness}</span>
                    </div>

                    <div style={S.list}>
                      <div style={S.item}>
                        <div style={S.itemTitle}>Evidence in selected period</div>
                        <div style={S.itemMeta}>{filteredEvidence.length} items</div>
                      </div>

                      <div style={S.item}>
                        <div style={S.itemTitle}>Latest evidence</div>
                        <div style={S.itemMeta}>{shortDate(latestEvidenceDate)}</div>
                      </div>

                      <div style={S.item}>
                        <div style={S.itemTitle}>Open support items</div>
                        <div style={S.itemMeta}>{openSupport.length}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={S.empty}>No child selected.</div>
                )}
              </section>

              <section style={S.card}>
                <div style={S.title}>Learning areas in this pack</div>
                {groupedAreas.length ? (
                  <div style={S.list}>
                    {groupedAreas.map(([area, count]) => (
                      <div key={area} style={S.item}>
                        <div style={S.itemTitle}>{area}</div>
                        <div style={S.itemMeta}>{count} evidence items</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={S.empty}>No evidence in the selected period.</div>
                )}
              </section>

              <section style={S.card}>
                <div style={S.title}>Support reminders</div>
                {openSupport.length ? (
                  <div style={S.list}>
                    {openSupport.slice(0, 6).map((i) => (
                      <div key={safe(i.id)} style={S.item}>
                        <div style={S.itemTitle}>{safe(i.title) || "Support plan"}</div>
                        <div style={S.itemMeta}>
                          {safe(i.status) || "Unknown"} • Review {shortDate(i.review_due_on || i.review_date || i.due_on)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={S.empty}>No open support reminders for the selected child.</div>
                )}
              </section>
            </section>
          </section>
        </FamilyShell>
      </main>
    </div>
  );
}