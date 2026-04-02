"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type StudentRow = {
  id: string;
  class_id?: string | null;
  first_name?: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  last_name?: string | null;
  is_ilp?: boolean | null;
  year_level?: number | null;
  [k: string]: any;
};

type Klass = {
  id?: string | null;
  name?: string | null;
  year_level?: number | null;
  teacher_name?: string | null;
  room?: string | null;
  [k: string]: any;
} | null;

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  learning_area?: string | null;
  summary?: string | null;
  body?: string | null;
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
  notes?: string | null;
  note?: string | null;
  status?: string | null;
  priority?: string | null;
  due_on?: string | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  next_review_on?: string | null;
  created_at?: string | null;
  [k: string]: any;
};

type StudentQuickViewDrawerProps = {
  open: boolean;
  onClose: () => void;
  studentId: string | null;
  returnTo?: string;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function fmtYear(y: number | null | undefined) {
  return y == null ? "" : `Year ${y}`;
}

function toDate(v: string | null | undefined) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function shortDate(v: string | null | undefined) {
  const d = toDate(v);
  if (!d) return "—";
  return d.toISOString().slice(0, 10);
}

function daysSince(v: string | null | undefined) {
  const d = toDate(v);
  if (!d) return null;
  return Math.max(
    0,
    Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function studentDisplayName(student: StudentRow | null | undefined) {
  if (!student) return "Student";
  const first = safe(student.preferred_name) || safe(student.first_name);
  const sur = safe(student.surname || student.family_name || student.last_name);
  return `${first}${sur ? ` ${sur}` : ""}`.trim() || "Student";
}

function effectiveEvidenceDate(e: EvidenceRow) {
  return safe(e.occurred_on) || safe(e.created_at);
}

function reviewDate(i: InterventionRow) {
  return (
    safe(i.review_due_on) ||
    safe(i.review_due_date) ||
    safe(i.next_review_on) ||
    safe(i.due_on) ||
    safe(i.created_at)
  );
}

function isClosedStatus(status: string | null | undefined) {
  return ["closed", "done", "archived", "completed", "resolved", "cancelled"].includes(
    safe(status).toLowerCase()
  );
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function clip(text: string | null | undefined, max = 120) {
  const s = safe(text);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/* ───────────────────────── COMPONENT ───────────────────────── */

export default function StudentQuickViewDrawer({
  open,
  onClose,
  studentId,
  returnTo = "/admin",
}: StudentQuickViewDrawerProps) {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [student, setStudent] = useState<StudentRow | null>(null);
  const [klass, setKlass] = useState<Klass>(null);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);

  useEffect(() => {
    if (!open || !studentId) return;

    async function load() {
      setBusy(true);
      setError(null);

      try {
        const loadedStudent = await loadStudent(studentId);
        setStudent(loadedStudent);

        if (safe(loadedStudent?.class_id)) {
          const loadedKlass = await loadClass(safe(loadedStudent?.class_id));
          setKlass(loadedKlass);
        } else {
          setKlass(null);
        }

        const [loadedEvidence, loadedInterventions] = await Promise.all([
          loadEvidence(studentId),
          loadInterventions(studentId),
        ]);

        setEvidence(loadedEvidence);
        setInterventions(loadedInterventions);
      } catch (e: any) {
        setError(String(e?.message ?? e));
      } finally {
        setBusy(false);
      }
    }

    load();
  }, [open, studentId]);

  async function loadStudent(id: string) {
    const tries = [
      "id,class_id,first_name,preferred_name,surname,family_name,last_name,is_ilp,year_level",
      "id,class_id,first_name,preferred_name,surname,family_name,is_ilp,year_level",
      "id,class_id,first_name,preferred_name,surname,is_ilp,year_level",
      "id,class_id,first_name,preferred_name,is_ilp,year_level",
    ];

    for (const sel of tries) {
      const r = await supabase.from("students").select(sel).eq("id", id).maybeSingle();
      if (!r.error) return (r.data as StudentRow | null) ?? null;
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    return null;
  }

  async function loadClass(id: string) {
    const tries = [
      "id,name,year_level,teacher_name,room",
      "id,name,year_level,room",
      "id,name,year_level",
      "id,name",
    ];

    for (const sel of tries) {
      const r = await supabase.from("classes").select(sel).eq("id", id).maybeSingle();
      if (!r.error) return (r.data as Klass) ?? null;
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    return null;
  }

  async function loadEvidence(id: string) {
    const tries = [
      "id,student_id,class_id,title,learning_area,summary,body,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,title,learning_area,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,title,occurred_on,created_at,is_deleted",
    ];

    for (const sel of tries) {
      const r = await supabase
        .from("evidence_entries")
        .select(sel)
        .eq("student_id", id)
        .limit(50);

      if (!r.error) {
        return (((r.data as any[]) ?? []) as EvidenceRow[])
          .filter((x) => x.is_deleted !== true)
          .sort(
            (a, b) =>
              (toDate(effectiveEvidenceDate(b))?.getTime() ?? 0) -
              (toDate(effectiveEvidenceDate(a))?.getTime() ?? 0)
          );
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    return [];
  }

  async function loadInterventions(id: string) {
    const tries = [
      "id,student_id,class_id,title,notes,note,status,priority,due_on,review_due_on,review_due_date,next_review_on,created_at",
      "id,student_id,class_id,title,status,priority,due_on,review_due_on,review_due_date,next_review_on,created_at",
      "id,student_id,class_id,title,status,created_at",
    ];

    for (const sel of tries) {
      const r = await supabase
        .from("interventions")
        .select(sel)
        .eq("student_id", id)
        .limit(50);

      if (!r.error) {
        return (((r.data as any[]) ?? []) as InterventionRow[]).sort(
          (a, b) =>
            (toDate(reviewDate(a))?.getTime() ?? 0) -
            (toDate(reviewDate(b))?.getTime() ?? 0)
        );
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    return [];
  }

  const summary = useMemo(() => {
    const lastEvidenceDays = evidence.length
      ? daysSince(effectiveEvidenceDate(evidence[0]))
      : null;

    const evidence30d = evidence.filter((e) => {
      const d = daysSince(effectiveEvidenceDate(e));
      return d != null && d <= 30;
    }).length;

    const openInterventions = interventions.filter((i) => !isClosedStatus(i.status)).length;

    const overdueReviews = interventions.filter((i) => {
      if (isClosedStatus(i.status)) return false;
      const d = daysSince(reviewDate(i));
      return d != null && d > 0;
    }).length;

    return {
      lastEvidenceDays,
      evidence30d,
      openInterventions,
      overdueReviews,
    };
  }, [evidence, interventions]);

  if (!open) return null;

  return (
    <div style={S.overlay} onClick={onClose}>
      <aside style={S.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={S.header}>
          <div>
            <div style={S.eyebrow}>Student quick view</div>
            <div style={S.title}>{studentDisplayName(student)}</div>
            <div style={S.metaText}>
              {klass
                ? `${safe(klass?.name) || "Class"}${
                    klass?.year_level != null ? ` • ${fmtYear(klass?.year_level)}` : ""
                  }`
                : "No class assigned"}
              {safe(klass?.teacher_name) ? ` • ${safe(klass?.teacher_name)}` : ""}
            </div>
          </div>

          <button type="button" onClick={onClose} style={S.closeBtn}>
            Close
          </button>
        </div>

        <div style={S.topActions}>
          {studentId ? (
            <>
              <button
                type="button"
                style={S.btnPrimary}
                onClick={() =>
                  router.push(`/admin/students/${encodeURIComponent(studentId)}`)
                }
              >
                Open profile
              </button>

              <button
                type="button"
                style={S.btnGhost}
                onClick={() =>
                  router.push(
                    `/admin/evidence-entry?studentId=${encodeURIComponent(studentId)}${
                      safe(student?.class_id)
                        ? `&classId=${encodeURIComponent(safe(student?.class_id))}`
                        : ""
                    }&returnTo=${encodeURIComponent(returnTo)}`
                  )
                }
              >
                Add evidence
              </button>

              <button
                type="button"
                style={S.btnGhost}
                onClick={() =>
                  router.push(
                    `/admin/interventions-entry?studentId=${encodeURIComponent(studentId)}${
                      safe(student?.class_id)
                        ? `&classId=${encodeURIComponent(safe(student?.class_id))}`
                        : ""
                    }&returnTo=${encodeURIComponent(returnTo)}`
                  )
                }
              >
                Support plan
              </button>
            </>
          ) : null}
        </div>

        <div style={S.metricsGrid}>
          <Metric
            label="Evidence 30d"
            value={summary.evidence30d}
            help="Recent evidence count"
          />
          <Metric
            label="Last evidence"
            value={
              summary.lastEvidenceDays == null ? "—" : `${summary.lastEvidenceDays}d`
            }
            help="Days since latest evidence"
          />
          <Metric
            label="Open supports"
            value={summary.openInterventions}
            help="Active intervention count"
          />
          <Metric
            label="Overdue reviews"
            value={summary.overdueReviews}
            help="Support reviews past due"
          />
        </div>

        {busy ? <div style={S.notice}>Loading student quick view…</div> : null}
        {error ? <div style={S.error}>{error}</div> : null}

        <section style={S.section}>
          <div style={S.sectionTitle}>Latest evidence</div>
          <div style={S.list}>
            {evidence.slice(0, 6).map((e) => (
              <div key={safe(e.id)} style={S.item}>
                <div style={S.itemTop}>
                  <div style={S.itemTitle}>
                    {safe(e.title) || safe(e.learning_area) || "Evidence entry"}
                  </div>
                  <span style={S.chip}>{shortDate(effectiveEvidenceDate(e))}</span>
                </div>
                <div style={S.itemMeta}>
                  {safe(e.learning_area) || "General"}
                </div>
                {safe(e.summary) || safe(e.body) ? (
                  <div style={S.itemText}>
                    {clip(e.summary || e.body, 140)}
                  </div>
                ) : null}
              </div>
            ))}

            {!busy && evidence.length === 0 ? (
              <div style={S.empty}>No evidence recorded yet.</div>
            ) : null}
          </div>
        </section>

        <section style={S.section}>
          <div style={S.sectionTitle}>Support & interventions</div>
          <div style={S.list}>
            {interventions
              .filter((i) => !isClosedStatus(i.status) || safe(i.title))
              .slice(0, 6)
              .map((i) => (
                <div key={safe(i.id)} style={S.item}>
                  <div style={S.itemTop}>
                    <div style={S.itemTitle}>
                      {safe(i.title) || "Support item"}
                    </div>
                    <span style={S.chipAlt}>
                      {safe(i.status) || "open"}
                    </span>
                  </div>
                  <div style={S.itemMeta}>
                    Review {shortDate(reviewDate(i))}
                  </div>
                  {safe(i.notes) || safe(i.note) ? (
                    <div style={S.itemText}>{clip(i.notes || i.note, 140)}</div>
                  ) : null}
                </div>
              ))}

            {!busy && interventions.length === 0 ? (
              <div style={S.empty}>No support items found.</div>
            ) : null}
          </div>
        </section>
      </aside>
    </div>
  );
}

function Metric({
  label,
  value,
  help,
}: {
  label: string;
  value: React.ReactNode;
  help: string;
}) {
  return (
    <div style={S.metricCard}>
      <div style={S.metricLabel}>{label}</div>
      <div style={S.metricValue}>{value}</div>
      <div style={S.metricHelp}>{help}</div>
    </div>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.48)",
    display: "flex",
    justifyContent: "flex-end",
    zIndex: 1000,
  },

  drawer: {
    width: "min(680px, 100vw)",
    height: "100vh",
    overflowY: "auto",
    background: "#ffffff",
    boxShadow: "-20px 0 60px rgba(15,23,42,0.18)",
    padding: 20,
    display: "grid",
    alignContent: "start",
    gap: 16,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },

  eyebrow: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  title: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: 950,
    color: "#0f172a",
    lineHeight: 1.05,
  },

  metaText: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.45,
  },

  closeBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 10,
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
  },

  topActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 10,
    background: "#2563eb",
    border: "1px solid #2563eb",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },

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
    cursor: "pointer",
  },

  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
  },

  metricCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 12,
  },

  metricLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  metricValue: {
    marginTop: 6,
    fontSize: 24,
    color: "#0f172a",
    fontWeight: 950,
    lineHeight: 1.05,
  },

  metricHelp: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
    lineHeight: 1.35,
  },

  notice: {
    borderRadius: 12,
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: 12,
    fontWeight: 800,
    fontSize: 13,
  },

  error: {
    borderRadius: 12,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#9f1239",
    padding: 12,
    fontWeight: 800,
    fontSize: 13,
    lineHeight: 1.45,
  },

  section: {
    display: "grid",
    gap: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: "#0f172a",
  },

  list: {
    display: "grid",
    gap: 10,
  },

  item: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 12,
  },

  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },

  itemTitle: {
    fontWeight: 900,
    fontSize: 14,
    color: "#0f172a",
    lineHeight: 1.35,
  },

  itemMeta: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
  },

  itemText: {
    marginTop: 8,
    color: "#475569",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.45,
  },

  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: 999,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: 900,
  },

  chipAlt: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: 999,
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    fontSize: 12,
    fontWeight: 900,
  },

  empty: {
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
    padding: 14,
    background: "#f8fafc",
    color: "#64748b",
    fontWeight: 700,
  },
};