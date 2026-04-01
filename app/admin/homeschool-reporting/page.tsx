"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
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
  if (!s) return "Child";
  return `${safe(s.preferred_name || s.first_name)} ${safe(s.surname || s.family_name)}`.trim() || "Child";
}

function shortDate(v: string | null | undefined) {
  return safe(v).slice(0, 10) || "—";
}

function clip(v: string | null | undefined, max = 180) {
  const s = safe(v);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function joinNatural(items: string[]) {
  const arr = items.filter(Boolean);
  if (arr.length === 0) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(", ")}, and ${arr[arr.length - 1]}`;
}

function startOfCurrentYear() {
  const d = new Date();
  return `${d.getFullYear()}-01-01`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function readinessLabel(count: number) {
  if (count >= 6) return "Strong";
  if (count >= 3) return "Building";
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
    gridTemplateColumns: "1.1fr 0.9fr",
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

  chipRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 10,
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

  itemText: {
    marginTop: 8,
    color: "#334155",
    fontSize: 13,
    lineHeight: 1.45,
    fontWeight: 700,
  } as React.CSSProperties,

  groupedArea: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 14,
    background: "#f8fafc",
  } as React.CSSProperties,

  areaTitle: {
    fontWeight: 900,
    color: "#0f172a",
    fontSize: 16,
  } as React.CSSProperties,

  textarea: {
    width: "100%",
    minHeight: 220,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    resize: "vertical",
    lineHeight: 1.55,
    fontSize: 14,
  } as React.CSSProperties,

  preview: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.7,
    fontSize: 14,
    color: "#0f172a",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 14,
    minHeight: 220,
  } as React.CSSProperties,

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

export default function HomeschoolReportingPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [periodStart, setPeriodStart] = useState(startOfCurrentYear());
  const [periodEnd, setPeriodEnd] = useState(todayIso());
  const [editableDraft, setEditableDraft] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
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

      const evidenceQueries = [
        supabase
          .from("evidence_entries")
          .select("id,student_id,title,summary,body,learning_area,evidence_type,occurred_on,created_at,is_deleted")
          .eq("is_deleted", false)
          .order("occurred_on", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("evidence_entries")
          .select("id,student_id,title,summary,learning_area,evidence_type,occurred_on,created_at")
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

      const interventionQueries = [
        supabase
          .from("interventions")
          .select("id,student_id,title,status,review_date,review_due_on,due_on,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("interventions")
          .select("id,student_id,title,status,created_at")
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

  const groupedByArea = useMemo(() => {
    const map = new Map<string, EvidenceRow[]>();
    filteredEvidence.forEach((e) => {
      const area = safe(e.learning_area) || "General";
      const arr = map.get(area) ?? [];
      arr.push(e);
      map.set(area, arr);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredEvidence]);

  const selectedInterventions = useMemo(() => {
    return interventions.filter((i) => safe(i.student_id) === selectedStudentId);
  }, [interventions, selectedStudentId]);

  const stats = useMemo(() => {
    const totalEvidence = filteredEvidence.length;
    const learningAreas = groupedByArea.length;
    const lastDate = filteredEvidence[0]?.occurred_on || filteredEvidence[0]?.created_at || null;
    const readiness = readinessLabel(totalEvidence);

    return [
      {
        label: "Child",
        value: studentName(selectedStudent),
        help: selectedStudent?.year_level != null ? `Year ${selectedStudent.year_level}` : "Year level not set",
      },
      {
        label: "Evidence items",
        value: totalEvidence,
        help: "Recorded learning moments in this period",
      },
      {
        label: "Learning areas",
        value: learningAreas,
        help: "Areas with recorded evidence",
      },
      {
        label: "Readiness",
        value: readiness,
        help: `Last evidence ${shortDate(lastDate)}`,
      },
    ];
  }, [filteredEvidence, groupedByArea, selectedStudent]);

  const generatedNarrative = useMemo(() => {
    const name = studentName(selectedStudent);
    const first = safe(selectedStudent?.preferred_name || selectedStudent?.first_name) || "The learner";

    const areas = groupedByArea.map(([area]) => area);
    const evidenceHighlights = groupedByArea
      .flatMap(([area, items]) =>
        items.slice(0, 2).map((e) => {
          const detail = safe(e.summary || e.body || e.title);
          return detail ? `${area}: ${clip(detail, 120)}` : `${area}: learning evidence recorded`;
        })
      )
      .slice(0, 4);

    const supportTitles = selectedInterventions
      .filter((i) => !["completed", "cancelled"].includes(safe(i.status).toLowerCase()))
      .map((i) => safe(i.title))
      .filter(Boolean)
      .slice(0, 3);

    const intro =
      `${name} has ${filteredEvidence.length} recorded learning evidence item${
        filteredEvidence.length === 1 ? "" : "s"
      } in the selected reporting period.`;

    const areaSentence = areas.length
      ? `${first} has shown learning activity across ${joinNatural(areas)}.`
      : `${first} currently has limited recorded evidence for this reporting period.`;

    const evidenceSentence = evidenceHighlights.length
      ? `Examples of recent learning include: ${evidenceHighlights.join("; ")}.`
      : `There are not yet enough detailed evidence notes to generate stronger examples for this reporting window.`;

    const supportSentence = supportTitles.length
      ? `${first} also has support plans or interventions in place, including ${joinNatural(supportTitles)}.`
      : `${first} does not currently have active support plans recorded for this reporting period.`;

    const nextStepSentence =
      `A sensible next step is to continue collecting specific, dated evidence that shows progress, independence, and application over time.`;

    return [intro, areaSentence, evidenceSentence, supportSentence, nextStepSentence]
      .filter(Boolean)
      .join("\n\n");
  }, [selectedStudent, filteredEvidence, groupedByArea, selectedInterventions]);

  useEffect(() => {
    setEditableDraft(generatedNarrative);
  }, [generatedNarrative]);

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(editableDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <FamilyShell
          title="MAX Homeschool Reporting Mode"
          subtitle="Build a family-friendly reporting view from stored evidence. This page helps turn everyday learning records into a clearer submission, portfolio, or narrative summary for home education contexts."
          selectedChildId={selectedStudentId}
          onChildChange={setSelectedStudentId}
          childrenOptions={childOptions}
          stats={stats}
          primaryHref={selectedStudentId ? `/admin/students/${encodeURIComponent(selectedStudentId)}/portfolio-print` : "/admin/homeschool-reporting"}
          primaryLabel="Open print portfolio"
          secondaryHref={selectedStudentId ? `/admin/students/${encodeURIComponent(selectedStudentId)}/reports` : "/admin/homeschool-reporting"}
          secondaryLabel="Open report generator"
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

            <button style={S.btnGhost} onClick={() => setEditableDraft(generatedNarrative)}>
              Reset summary
            </button>

            <button style={S.btn} onClick={copyDraft}>
              {copied ? "Copied" : "Copy summary"}
            </button>
          </div>

          <section style={S.grid}>
            <section style={S.card}>
              <div style={S.title}>Evidence by learning area</div>
              <div style={S.sectionText}>
                This section groups the selected child’s evidence into broad learning areas for a portfolio-style view.
              </div>

              {groupedByArea.length === 0 ? (
                <div style={S.empty}>No evidence was found for this child in the selected reporting period.</div>
              ) : (
                <div style={S.list}>
                  {groupedByArea.map(([area, items]) => (
                    <div key={area} style={S.groupedArea}>
                      <div style={S.areaTitle}>{area}</div>
                      <div style={S.chipRow}>
                        <span style={S.chip}>{items.length} evidence items</span>
                        <span style={S.pill(readinessLabel(items.length))}>
                          {readinessLabel(items.length)}
                        </span>
                      </div>

                      <div style={{ ...S.list, marginTop: 12 }}>
                        {items.map((e) => (
                          <div key={safe(e.id)} style={S.item}>
                            <div style={S.itemTitle}>{safe(e.title) || "Evidence entry"}</div>
                            <div style={S.itemMeta}>
                              {shortDate(e.occurred_on || e.created_at)} • {safe(e.evidence_type) || "Evidence"}
                            </div>
                            {safe(e.summary || e.body) ? (
                              <div style={S.itemText}>{clip(e.summary || e.body, 160)}</div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section style={{ display: "grid", gap: 16 }}>
              <section style={S.card}>
                <div style={S.title}>Narrative summary builder</div>
                <div style={S.sectionText}>
                  This editable summary is generated from recorded evidence and support notes. It is designed to be a safe first-step draft for family reporting.
                </div>

                <textarea
                  style={S.textarea}
                  value={editableDraft}
                  onChange={(e) => setEditableDraft(e.target.value)}
                />

                <div style={{ marginTop: 14 }}>
                  <div style={S.title}>Preview</div>
                  <div style={S.preview}>{editableDraft}</div>
                </div>
              </section>

              <section style={S.card}>
                <div style={S.title}>Support notes</div>
                <div style={S.list}>
                  {selectedInterventions.map((i) => (
                    <div key={safe(i.id)} style={S.item}>
                      <div style={S.itemTitle}>{safe(i.title) || "Support plan"}</div>
                      <div style={S.itemMeta}>
                        {safe(i.status) || "Unknown"} • Review {shortDate(i.review_due_on || i.review_date || i.due_on)}
                      </div>
                    </div>
                  ))}
                  {selectedInterventions.length === 0 ? (
                    <div style={S.empty}>No support notes or interventions were found for this child.</div>
                  ) : null}
                </div>
              </section>
            </section>
          </section>
        </FamilyShell>
      </main>
    </div>
  );
}