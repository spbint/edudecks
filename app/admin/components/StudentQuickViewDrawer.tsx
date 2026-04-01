"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { buildStudentProfilePath } from "@/lib/studentRoutes";

/* ───────────────────────── TYPES ───────────────────────── */

type StudentRow = {
  id: string;
  class_id: string | null;
  first_name: string | null;
  preferred_name: string | null;
  surname?: string | null;
  family_name?: string | null;
  last_name?: string | null;
  is_ilp?: boolean | null;
  created_at?: string | null;
  [k: string]: any;
};

type ClassRow = {
  id: string;
  name: string | null;
  year_level?: number | null;
  teacher_name?: string | null;
  room?: string | null;
  [k: string]: any;
};

type EvidenceEntryRow = {
  id: string;
  student_id: string | null;
  class_id: string | null;
  title: string | null;
  summary: string | null;
  body: string | null;
  learning_area: string | null;
  occurred_on: string | null;
  created_at: string | null;
  visibility?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

type InterventionRow = {
  id: string;
  student_id: string | null;
  class_id: string | null;
  title?: string | null;
  notes?: string | null;
  note?: string | null;
  status?: string | null;
  priority?: string | null;
  tier?: any;
  strategy?: string | null;
  due_on?: string | null;
  next_review_on?: string | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [k: string]: any;
};

type StudentQuickViewDrawerProps = {
  studentId: string | null;
  open: boolean;
  onClose: () => void;
  returnTo?: string;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function studentDisplayName(s: StudentRow | null | undefined) {
  if (!s) return "Student";
  const first = safe(s.preferred_name) || safe(s.first_name);
  const last = safe(s.surname || s.family_name || s.last_name);
  return `${first}${last ? ` ${last}` : ""}`.trim() || "Student";
}

function fmtYear(y: number | null | undefined) {
  return y == null ? "" : `Year ${y}`;
}

function isoShort(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function evidenceDate(ev: EvidenceEntryRow) {
  return safe(ev.occurred_on) || safe(ev.created_at);
}

function reviewDate(iv: InterventionRow) {
  return (
    safe(iv.review_due_on) ||
    safe(iv.review_due_date) ||
    safe(iv.next_review_on) ||
    safe(iv.due_on)
  );
}

function daysSince(v: string | null | undefined) {
  if (!v) return 999;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 999;
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function areaMatches(area: string, patterns: string[]) {
  const a = area.toLowerCase();
  return patterns.some((p) => a.includes(p));
}

function freshnessTone(days: number) {
  if (days <= 7) {
    return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534", label: `${days}d` };
  }
  if (days <= 21) {
    return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e", label: `${days}d` };
  }
  if (days >= 999) {
    return { bg: "#f8fafc", bd: "#e2e8f0", fg: "#64748b", label: "—" };
  }
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239", label: `${days}d` };
}

function statusTone(status: "Stable" | "Watch" | "Attention") {
  if (status === "Attention") {
    return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
  }
  if (status === "Watch") {
    return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  }
  return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
}

/* ───────────────────────── STYLES ───────────────────────── */

const S = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.28)",
    zIndex: 60,
    display: "flex",
    justifyContent: "flex-end",
  } as React.CSSProperties,

  panel: {
    width: 460,
    maxWidth: "96vw",
    height: "100vh",
    background: "#f8fafc",
    borderLeft: "1px solid #e5e7eb",
    boxShadow: "-16px 0 40px rgba(15,23,42,0.12)",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  } as React.CSSProperties,

  hero: {
    padding: 18,
    borderBottom: "1px solid #e5e7eb",
    background: "linear-gradient(135deg, rgba(17,24,39,0.05), rgba(99,102,241,0.08))",
    position: "sticky",
    top: 0,
    zIndex: 2,
    backdropFilter: "blur(8px)",
  } as React.CSSProperties,

  subtle: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  } as React.CSSProperties,

  h1: {
    fontSize: 28,
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

  body: {
    padding: 16,
    display: "grid",
    gap: 14,
  } as React.CSSProperties,

  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#fff",
  } as React.CSSProperties,

  cardPad: {
    padding: 14,
  } as React.CSSProperties,

  cardTitle: {
    fontSize: 16,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  cardHelp: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 1.4,
    color: "#64748b",
    fontWeight: 800,
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

  btnMini: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 12,
  } as React.CSSProperties,

  miniGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 12,
  } as React.CSSProperties,

  statCard: {
    border: "1px solid #eef2f7",
    borderRadius: 14,
    background: "#fff",
    padding: 12,
  } as React.CSSProperties,

  statK: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  } as React.CSSProperties,

  statV: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: 950,
    color: "#0f172a",
    lineHeight: 1.05,
  } as React.CSSProperties,

  statS: {
    marginTop: 6,
    fontSize: 12,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.35,
  } as React.CSSProperties,

  miniStatWrap: {
    display: "grid",
    gap: 10,
    marginTop: 12,
  } as React.CSSProperties,

  miniStatRow: {
    display: "grid",
    gridTemplateColumns: "108px 1fr auto",
    gap: 10,
    alignItems: "center",
  } as React.CSSProperties,

  meterBg: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    background: "#e5e7eb",
    overflow: "hidden",
  } as React.CSSProperties,

  list: {
    display: "grid",
    gap: 10,
    marginTop: 12,
  } as React.CSSProperties,

  item: {
    border: "1px solid #edf2f7",
    borderRadius: 14,
    background: "#fff",
    padding: 12,
  } as React.CSSProperties,

  itemTitle: {
    fontWeight: 950,
    color: "#0f172a",
    fontSize: 15,
    lineHeight: 1.3,
  } as React.CSSProperties,

  itemText: {
    marginTop: 8,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.4,
  } as React.CSSProperties,

  empty: {
    border: "1px dashed #cbd5e1",
    borderRadius: 14,
    background: "#f8fafc",
    padding: 12,
    color: "#64748b",
    fontWeight: 900,
  } as React.CSSProperties,

  loading: {
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
    lineHeight: 1.45,
  } as React.CSSProperties,
};

/* ───────────────────────── COMPONENT ───────────────────────── */

export default function StudentQuickViewDrawer({
  studentId,
  open,
  onClose,
  returnTo,
}: StudentQuickViewDrawerProps) {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [student, setStudent] = useState<StudentRow | null>(null);
  const [klass, setKlass] = useState<ClassRow | null>(null);
  const [evidence, setEvidence] = useState<EvidenceEntryRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);

  async function loadStudent() {
    if (!studentId) {
      setStudent(null);
      setKlass(null);
      return;
    }

    const candidates = [
      "id,class_id,first_name,preferred_name,surname,family_name,last_name,is_ilp,created_at",
      "id,class_id,first_name,preferred_name,surname,family_name,is_ilp,created_at",
      "id,class_id,first_name,preferred_name,surname,last_name,is_ilp,created_at",
      "id,class_id,first_name,preferred_name,surname,is_ilp,created_at",
      "id,class_id,first_name,preferred_name,is_ilp,created_at",
    ];

    let found: StudentRow | null = null;

    for (const sel of candidates) {
      const r = await supabase.from("students").select(sel).eq("id", studentId).maybeSingle();
      if (!r.error) {
        found = (r.data as any) || null;
        break;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setStudent(found);

    if (found?.class_id) {
      const c = await supabase
        .from("classes")
        .select("id,name,year_level,teacher_name,room")
        .eq("id", found.class_id)
        .maybeSingle();

      if (c.error && !isMissingRelationOrColumn(c.error)) throw c.error;
      setKlass((c.data as any) || null);
    } else {
      setKlass(null);
    }
  }

  async function loadEvidence() {
    if (!studentId) {
      setEvidence([]);
      return;
    }

    const candidates = [
      "id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,visibility,is_deleted",
      "id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,title,learning_area,occurred_on,created_at,is_deleted",
    ];

    for (const sel of candidates) {
      const r = await supabase
        .from("evidence_entries")
        .select(sel)
        .eq("student_id", studentId)
        .eq("is_deleted", false)
        .order("occurred_on", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(40);

      if (!r.error) {
        setEvidence(((r.data as any[]) ?? []) as EvidenceEntryRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setEvidence([]);
  }

  async function loadInterventions() {
    if (!studentId) {
      setInterventions([]);
      return;
    }

    const candidates = [
      "id,student_id,class_id,title,notes,note,status,priority,tier,strategy,due_on,next_review_on,review_due_on,review_due_date,created_at,updated_at",
      "id,student_id,class_id,title,notes,note,status,priority,due_on,next_review_on,review_due_on,review_due_date,created_at",
      "*",
    ];

    for (const sel of candidates) {
      const r = await supabase
        .from("interventions")
        .select(sel)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!r.error) {
        setInterventions(((r.data as any[]) ?? []) as InterventionRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setInterventions([]);
  }

  async function loadAll() {
    if (!open || !studentId) return;

    setBusy(true);
    setErr(null);

    try {
      await Promise.all([loadStudent(), loadEvidence(), loadInterventions()]);
    } catch (e: any) {
      setErr(safe(e?.message) || "Could not load student quick view.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, open]);

  const openInterventions = useMemo(() => {
    return interventions.filter((x) => {
      const s = safe(x.status).toLowerCase();
      return !(s === "closed" || s === "done" || s === "resolved" || s === "archived" || s === "completed");
    });
  }, [interventions]);

  const overdueReviews = useMemo(() => {
    return openInterventions.filter((x) => {
      const rd = reviewDate(x);
      return rd ? daysSince(rd) > 0 : false;
    });
  }, [openInterventions]);

  const lastEvidenceDays = useMemo(() => {
    if (!evidence.length) return null;
    return daysSince(evidenceDate(evidence[0]));
  }, [evidence]);

  const profileConfidence = useMemo(() => {
    const recency = lastEvidenceDays == null ? 0 : Math.max(0, 100 - lastEvidenceDays * 4);
    const areas = new Set(evidence.map((e) => safe(e.learning_area)).filter(Boolean)).size;
    const areaScore = clamp(areas * 18, 0, 100);
    const reviewScore =
      overdueReviews.length === 0
        ? 100
        : Math.max(20, 100 - overdueReviews.length * 25);

    return Math.round((recency + areaScore + reviewScore) / 3);
  }, [lastEvidenceDays, evidence, overdueReviews.length]);

  const statusLabel = useMemo<"Stable" | "Watch" | "Attention">(() => {
    if ((lastEvidenceDays ?? 999) <= 7 && overdueReviews.length === 0) return "Stable";
    if ((lastEvidenceDays ?? 999) <= 21) return "Watch";
    return "Attention";
  }, [lastEvidenceDays, overdueReviews.length]);

  const evidenceFreshness = useMemo(() => {
    const buckets = [
      { label: "Reading", match: ["reading"] },
      { label: "Writing", match: ["writing"] },
      { label: "Maths", match: ["math", "mathematics", "numeracy"] },
      { label: "Behaviour", match: ["behaviour", "behavior"] },
      { label: "Wellbeing", match: ["wellbeing", "well-being", "pastoral"] },
    ];

    return buckets.map((bucket) => {
      const found = evidence
        .filter((e) => areaMatches(safe(e.learning_area), bucket.match))
        .sort((a, b) => evidenceDate(b).localeCompare(evidenceDate(a)))[0];

      return {
        label: bucket.label,
        days: found ? daysSince(evidenceDate(found)) : 999,
      };
    });
  }, [evidence]);

  const nextAction = useMemo(() => {
    if ((lastEvidenceDays ?? 999) > 21) return "Add fresh evidence";
    if (overdueReviews.length > 0) return "Review support plan";

    const staleWriting = evidenceFreshness.find((x) => x.label === "Writing");
    if (staleWriting && staleWriting.days > 21) return "Capture writing evidence";

    if (openInterventions.length === 0) return "Maintain visibility";
    return "Monitor current plan";
  }, [lastEvidenceDays, overdueReviews.length, evidenceFreshness, openInterventions.length]);

  const safeReturnTo = safe(returnTo);
  const fullProfileHref = buildStudentProfilePath(safe(studentId), safeReturnTo || "/admin/students");
  const statusColors = statusTone(statusLabel);

  if (!open) return null;

  return (
    <div style={S.overlay} onClick={onClose}>
      <aside style={S.panel} onClick={(e) => e.stopPropagation()}>
        <div style={S.hero}>
          <div style={S.subtle}>Student Quick View</div>
          <div style={S.h1}>{studentDisplayName(student)}</div>
          <div style={S.sub}>
            {klass
              ? `${safe(klass.name) || "Class"}${klass.year_level != null ? ` • ${fmtYear(klass.year_level)}` : ""}`
              : "No class assigned"}
            {safe(klass?.teacher_name) ? ` • ${safe(klass.teacher_name)}` : ""}
          </div>

          <div style={{ ...S.row, marginTop: 12 }}>
            <span
              style={{
                ...S.chip,
                background: statusColors.bg,
                borderColor: statusColors.bd,
                color: statusColors.fg,
              }}
            >
              Status: {statusLabel}
            </span>

            <span style={S.chipMuted}>Confidence: {profileConfidence}%</span>
            {student?.is_ilp ? <span style={S.chip}>ILP</span> : null}
            <span style={S.chipMuted}>Next action: {nextAction}</span>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button type="button" style={S.btnMini} onClick={onClose}>
                Close
              </button>
            </div>
          </div>

          {busy ? <div style={S.loading}>Loading student quick view…</div> : null}
          {err ? <div style={S.err}>{err}</div> : null}
        </div>

        <div style={S.body}>
          <div style={S.card}>
            <div style={S.cardPad}>
              <div style={S.cardTitle}>Quick Actions</div>
              <div style={S.cardHelp}>
                Jump straight into the most common teacher tasks with canonical routing.
              </div>

              <div style={{ ...S.list, marginTop: 12 }}>
                <button
                  type="button"
                  style={S.btnPrimary}
                  onClick={() => router.push(fullProfileHref)}
                >
                  Open full profile
                </button>

                <button
                  type="button"
                  style={S.btn}
                  onClick={() =>
                    router.push(
                      `/admin/evidence-entry?studentId=${encodeURIComponent(
                        safe(studentId)
                      )}${student?.class_id ? `&classId=${encodeURIComponent(safe(student.class_id))}` : ""}${
                        safeReturnTo ? `&returnTo=${encodeURIComponent(safeReturnTo)}` : ""
                      }`
                    )
                  }
                >
                  + Add evidence
                </button>

                <button
                  type="button"
                  style={S.btn}
                  onClick={() =>
                    router.push(
                      `/admin/interventions-entry?studentId=${encodeURIComponent(
                        safe(studentId)
                      )}${student?.class_id ? `&classId=${encodeURIComponent(safe(student.class_id))}` : ""}${
                        safeReturnTo ? `&returnTo=${encodeURIComponent(safeReturnTo)}` : ""
                      }`
                    )
                  }
                >
                  + Add intervention
                </button>

                <button
                  type="button"
                  style={S.btn}
                  onClick={() =>
                    router.push(
                      `/admin/evidence-feed?studentId=${encodeURIComponent(
                        safe(studentId)
                      )}${student?.class_id ? `&classId=${encodeURIComponent(safe(student.class_id))}` : ""}`
                    )
                  }
                >
                  View evidence feed
                </button>
              </div>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardPad}>
              <div style={S.cardTitle}>Snapshot</div>
              <div style={S.cardHelp}>
                Compact overview of profile strength, evidence, and support load.
              </div>

              <div style={S.miniGrid}>
                <div style={S.statCard}>
                  <div style={S.statK}>Evidence</div>
                  <div style={S.statV}>{evidence.length}</div>
                  <div style={S.statS}>Recorded observations</div>
                </div>

                <div style={S.statCard}>
                  <div style={S.statK}>Open Plans</div>
                  <div style={S.statV}>{openInterventions.length}</div>
                  <div style={S.statS}>Active support items</div>
                </div>

                <div style={S.statCard}>
                  <div style={S.statK}>Overdue</div>
                  <div style={S.statV}>{overdueReviews.length}</div>
                  <div style={S.statS}>Reviews needing attention</div>
                </div>

                <div style={S.statCard}>
                  <div style={S.statK}>Last Evidence</div>
                  <div style={S.statV}>{lastEvidenceDays == null ? "—" : `${lastEvidenceDays}d`}</div>
                  <div style={S.statS}>Freshness indicator</div>
                </div>
              </div>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardPad}>
              <div style={S.cardTitle}>Evidence Freshness</div>
              <div style={S.cardHelp}>
                Current visibility across key learning and support areas.
              </div>

              <div style={S.miniStatWrap}>
                {evidenceFreshness.map((row) => {
                  const tone = freshnessTone(row.days);
                  const fill = row.days >= 999 ? 0 : Math.max(0, 100 - row.days * 4);

                  return (
                    <div key={row.label} style={S.miniStatRow}>
                      <div style={{ fontWeight: 900, color: "#0f172a" }}>{row.label}</div>
                      <div style={S.meterBg}>
                        <div
                          style={{
                            width: `${fill}%`,
                            height: "100%",
                            background:
                              row.days <= 7 ? "#22c55e" : row.days <= 21 ? "#f59e0b" : "#ef4444",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          padding: "4px 8px",
                          borderRadius: 999,
                          background: tone.bg,
                          border: `1px solid ${tone.bd}`,
                          color: tone.fg,
                          fontWeight: 900,
                          fontSize: 12,
                        }}
                      >
                        {tone.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardPad}>
              <div style={S.cardTitle}>Latest Evidence</div>
              <div style={S.cardHelp}>Recent observations for fast narrative context.</div>

              <div style={S.list}>
                {evidence.slice(0, 4).map((ev) => (
                  <div key={ev.id} style={S.item}>
                    <div style={{ ...S.row, justifyContent: "space-between" }}>
                      <div style={S.itemTitle}>{safe(ev.title) || "Evidence entry"}</div>
                      <span style={S.chip}>{isoShort(evidenceDate(ev))}</span>
                    </div>

                    <div style={{ ...S.row, marginTop: 8 }}>
                      <span style={S.chipMuted}>{safe(ev.learning_area) || "General"}</span>
                      {safe(ev.visibility) ? <span style={S.chipMuted}>{safe(ev.visibility)}</span> : null}
                    </div>

                    {safe(ev.summary) ? (
                      <div style={S.itemText}>{safe(ev.summary)}</div>
                    ) : safe(ev.body) ? (
                      <div style={S.itemText}>{safe(ev.body)}</div>
                    ) : null}
                  </div>
                ))}

                {!evidence.length ? <div style={S.empty}>No evidence recorded yet.</div> : null}
              </div>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardPad}>
              <div style={S.cardTitle}>Active Support</div>
              <div style={S.cardHelp}>Current interventions and support-plan rhythm.</div>

              <div style={S.list}>
                {openInterventions.slice(0, 4).map((iv) => (
                  <div key={iv.id} style={S.item}>
                    <div style={{ ...S.row, justifyContent: "space-between" }}>
                      <div style={S.itemTitle}>{safe(iv.title) || "Intervention"}</div>
                      <span style={S.chipMuted}>{safe(iv.priority) || "normal"}</span>
                    </div>

                    <div style={{ ...S.row, marginTop: 8 }}>
                      {safe(iv.status) ? <span style={S.chipMuted}>{safe(iv.status)}</span> : null}
                      {reviewDate(iv) ? (
                        <span style={S.chipMuted}>Review {isoShort(reviewDate(iv))}</span>
                      ) : null}
                    </div>

                    {safe(iv.note) ? (
                      <div style={S.itemText}>{clip(safe(iv.note), 140)}</div>
                    ) : safe(iv.notes) ? (
                      <div style={S.itemText}>{clip(safe(iv.notes), 140)}</div>
                    ) : null}
                  </div>
                ))}

                {!openInterventions.length ? (
                  <div style={S.empty}>No active support plans right now.</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function clip(v: string | null | undefined, max = 140) {
  const s = safe(v);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}