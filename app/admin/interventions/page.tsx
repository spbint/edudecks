"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
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

type EvidenceEntryRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  learning_area?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

type StudentProfileOverviewRow = {
  student_id: string;
  class_id?: string | null;
  student_name?: string | null;
  attention_status?: "Ready" | "Watch" | "Attention" | string | null;
  last_evidence_at?: string | null;
  open_interventions_count?: number | null;
  overdue_reviews_count?: number | null;
  evidence_count_30d?: number | null;
  next_action?: string | null;
  [k: string]: any;
};

type InterventionRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  notes?: string | null;
  note?: string | null;
  strategy?: string | null;
  tier?: string | number | null;
  priority?: string | null;
  status?: string | null;
  due_on?: string | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  next_review_on?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [k: string]: any;
};

type QueueMode = "queue" | "review" | "history";

type InterventionInsight = {
  id: string;
  intervention: InterventionRow;
  student: StudentRow | null;
  classRow: ClassRow | null;
  overview: StudentProfileOverviewRow | null;

  title: string;
  studentName: string;
  classLabel: string;

  status: string;
  priority: string;
  tier: string;
  strategyLabel: string;

  createdAt: string | null;
  reviewDate: string | null;
  lastEvidenceAt: string | null;
  lastEvidenceDays: number | null;

  evidence30d: number;
  evidencePrev30d: number;
  evidenceMomentumDelta: number;

  openLoad: number;
  overdueReviews: number;
  dueIn14Days: boolean;
  overdue: boolean;

  effectivenessSignal: "Working" | "Stagnating" | "Weak" | "Unknown";
  effectivenessTone: "good" | "watch" | "danger";
  effectivenessReason: string;

  recommendedDecision:
    | "Review now"
    | "Gather evidence before review"
    | "Continue"
    | "Intensify"
    | "Taper"
    | "Close if stable"
    | "Rewrite strategy"
    | "Escalate to Tier 3";

  decisionReason: string;
  urgencyScore: number;
};

type ForecastSummary = {
  dueNext14Days: number;
  overdueNow: number;
  overloadedClasses: number;
  tier23Clusters: number;
};

type StrategyComparison = {
  label: string;
  count: number;
};

type ClassBurdenRow = {
  classId: string;
  classLabel: string;
  activeCount: number;
  dueNext14Days: number;
  overdueCount: number;
  tier23Count: number;
  pressureScore: number;
  recommendation: string;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function studentName(s: StudentRow | null | undefined, ov?: StudentProfileOverviewRow | null) {
  if (safe(ov?.student_name)) return safe(ov?.student_name);
  if (!s) return "Student";
  return `${safe(s.preferred_name || s.first_name)} ${safe(s.surname || s.family_name)}`.trim() || "Student";
}

function classLabel(c: ClassRow | null | undefined) {
  if (!c) return "Class";
  const bits = [c.year_level != null ? `Year ${c.year_level}` : "", safe(c.name)].filter(Boolean);
  return bits.join(" • ") || "Class";
}

function shortDate(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s.slice(0, 10) || "—";
  return d.toISOString().slice(0, 10);
}

function daysSince(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

function daysUntil(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((d.getTime() - Date.now()) / 86400000);
}

function isClosedStatus(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  return ["closed", "done", "resolved", "completed", "archived", "cancelled"].includes(s);
}

function isPausedStatus(status: string | null | undefined) {
  return safe(status).toLowerCase() === "paused";
}

function pickReviewDate(iv: InterventionRow) {
  return (
    safe(iv.review_due_on) ||
    safe(iv.review_due_date) ||
    safe(iv.next_review_on) ||
    safe(iv.due_on) ||
    ""
  );
}

function normalizeTier(v: string | number | null | undefined) {
  const s = safe(v).toLowerCase();
  if (!s) return "Tier ?";
  if (s.includes("3")) return "Tier 3";
  if (s.includes("2")) return "Tier 2";
  if (s.includes("1")) return "Tier 1";
  return s.toUpperCase();
}

function normalizePriority(v: string | null | undefined) {
  const s = safe(v).toLowerCase();
  if (!s) return "normal";
  if (["high", "urgent", "critical"].includes(s)) return "high";
  if (["low"].includes(s)) return "low";
  return "normal";
}

function strategyLabel(iv: InterventionRow) {
  const strategy = safe(iv.strategy);
  if (strategy) return strategy;
  const title = safe(iv.title);
  if (title) return title;
  const notes = safe(iv.notes || iv.note);
  if (!notes) return "General support";
  return notes.split(/\s+/).slice(0, 4).join(" ");
}

function attentionTone(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  if (s === "attention") return { bg: "#450a0a", bd: "#7f1d1d", fg: "#fecaca" };
  if (s === "watch") return { bg: "#422006", bd: "#92400e", fg: "#fde68a" };
  return { bg: "#052e16", bd: "#14532d", fg: "#bbf7d0" };
}

function tonePill(kind: "good" | "watch" | "danger") {
  if (kind === "danger") return { bg: "#450a0a", bd: "#7f1d1d", fg: "#fecaca" };
  if (kind === "watch") return { bg: "#422006", bd: "#92400e", fg: "#fde68a" };
  return { bg: "#052e16", bd: "#14532d", fg: "#bbf7d0" };
}

function buildUrgencyScore(input: {
  priority: string;
  overdue: boolean;
  dueSoon: boolean;
  attentionStatus: string | null | undefined;
  lastEvidenceDays: number | null;
  overdueReviews: number;
  paused: boolean;
  closed: boolean;
}) {
  if (input.closed) return 0;

  let score = 0;

  if (input.priority === "high") score += 24;
  if (input.priority === "normal") score += 10;
  if (input.overdue) score += 28;
  if (input.dueSoon) score += 14;

  const attention = safe(input.attentionStatus).toLowerCase();
  if (attention === "attention") score += 18;
  else if (attention === "watch") score += 8;

  if ((input.lastEvidenceDays ?? 999) > 30) score += 14;
  else if ((input.lastEvidenceDays ?? 999) > 14) score += 6;

  score += Math.min(20, input.overdueReviews * 5);

  if (input.paused) score -= 18;

  return Math.max(0, score);
}

function buildEffectivenessSignal(input: {
  closed: boolean;
  paused: boolean;
  evidence30d: number;
  evidencePrev30d: number;
  lastEvidenceDays: number | null;
  overdue: boolean;
}) {
  if (input.closed) {
    return {
      effectivenessSignal: "Unknown" as const,
      effectivenessTone: "watch" as const,
      effectivenessReason: "Closed intervention; effectiveness is not being actively re-evaluated here.",
    };
  }

  if (input.paused) {
    return {
      effectivenessSignal: "Stagnating" as const,
      effectivenessTone: "watch" as const,
      effectivenessReason: "Plan is paused, so evidence momentum is unlikely to improve without renewed action.",
    };
  }

  const delta = input.evidence30d - input.evidencePrev30d;
  const stale = (input.lastEvidenceDays ?? 999) > 30;

  if (!input.overdue && input.evidence30d >= 2 && delta > 0 && !stale) {
    return {
      effectivenessSignal: "Working" as const,
      effectivenessTone: "good" as const,
      effectivenessReason: "Recent evidence is active and momentum has improved against the previous window.",
    };
  }

  if ((input.evidence30d === 0 && stale) || (input.overdue && stale)) {
    return {
      effectivenessSignal: "Weak" as const,
      effectivenessTone: "danger" as const,
      effectivenessReason: "There is little or no recent evidence improvement, suggesting the current support plan is weak.",
    };
  }

  return {
    effectivenessSignal: "Stagnating" as const,
    effectivenessTone: "watch" as const,
    effectivenessReason: "The intervention is active, but recent evidence momentum is flat or only weakly improving.",
  };
}

function buildRecommendedDecision(input: {
  tier: string;
  closed: boolean;
  paused: boolean;
  overdue: boolean;
  dueSoon: boolean;
  effectivenessSignal: InterventionInsight["effectivenessSignal"];
  lastEvidenceDays: number | null;
  attentionStatus: string | null | undefined;
}) {
  if (input.closed) {
    return {
      recommendedDecision: "Close if stable" as const,
      decisionReason: "This intervention is already closed; confirm stability and archive if appropriate.",
    };
  }

  const attention = safe(input.attentionStatus).toLowerCase();

  if (input.overdue) {
    return {
      recommendedDecision: "Review now" as const,
      decisionReason: "The review date has passed, so this intervention now needs an immediate review decision.",
    };
  }

  if (input.effectivenessSignal === "Weak" && safe(input.tier).toLowerCase().includes("2") && attention === "attention") {
    return {
      recommendedDecision: "Escalate to Tier 3" as const,
      decisionReason: "Weak impact plus elevated student attention status suggests stronger support intensity may be needed.",
    };
  }

  if (input.effectivenessSignal === "Weak") {
    return {
      recommendedDecision: "Rewrite strategy" as const,
      decisionReason: "The current plan is not producing enough evidence improvement to justify staying unchanged.",
    };
  }

  if (input.effectivenessSignal === "Stagnating" && (input.lastEvidenceDays ?? 999) > 21) {
    return {
      recommendedDecision: "Gather evidence before review" as const,
      decisionReason: "The next review will be stronger if a fresh evidence point is captured first.",
    };
  }

  if (input.effectivenessSignal === "Working" && input.dueSoon) {
    return {
      recommendedDecision: "Continue" as const,
      decisionReason: "Signals look positive; the coming review should likely confirm continuation rather than redesign.",
    };
  }

  if (input.effectivenessSignal === "Working" && attention === "ready") {
    return {
      recommendedDecision: "Taper" as const,
      decisionReason: "The intervention appears to be working and the wider student signal is stable enough to consider tapering.",
    };
  }

  if (input.paused) {
    return {
      recommendedDecision: "Review now" as const,
      decisionReason: "Paused interventions should be actively reviewed so they do not quietly stagnate.",
    };
  }

  return {
    recommendedDecision: "Continue" as const,
    decisionReason: "The current intervention still looks active enough to continue while monitoring the next review point.",
  };
}

/* ───────────────────────── STYLES ───────────────────────── */

const S: Record<string, React.CSSProperties> = {
  shell: { display: "flex", minHeight: "100vh", background: "#0f172a" },
  main: { flex: 1, padding: 24, maxWidth: 1560, color: "#e5e7eb" },

  hero: {
    border: "1px solid #1f2937",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(17,24,39,0.88), rgba(245,158,11,0.14))",
    padding: 20,
    marginBottom: 16,
  },

  eyebrow: {
    fontSize: 11,
    color: "#fbbf24",
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  h1: {
    marginTop: 8,
    fontSize: 34,
    lineHeight: 1.05,
    fontWeight: 1000,
    color: "#f8fafc",
  },

  sub: {
    marginTop: 8,
    color: "#94a3b8",
    fontWeight: 700,
    lineHeight: 1.5,
    maxWidth: 1000,
  },

  topActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 16,
  },

  btn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 10,
    background: "#f59e0b",
    border: "none",
    color: "#111827",
    fontWeight: 900,
    textDecoration: "none",
    cursor: "pointer",
  },

  btnGhost: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 10,
    background: "transparent",
    border: "1px solid #334155",
    color: "#e5e7eb",
    fontWeight: 900,
    textDecoration: "none",
    cursor: "pointer",
  },

  tileGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 12,
    marginTop: 16,
  },

  tile: {
    border: "1px solid #1f2937",
    borderRadius: 16,
    background: "#111827",
    padding: 14,
  },

  tileK: {
    fontSize: 11,
    color: "#fbbf24",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  tileV: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: 1000,
    color: "#f8fafc",
    lineHeight: 1.05,
  },

  tileS: {
    marginTop: 8,
    fontSize: 12,
    color: "#cbd5e1",
    fontWeight: 800,
    lineHeight: 1.35,
  },

  card: {
    border: "1px solid #1f2937",
    borderRadius: 18,
    background: "#111827",
    padding: 16,
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginTop: 16,
    alignItems: "start",
  },

  gridMain: {
    display: "grid",
    gridTemplateColumns: "1.25fr 0.75fr",
    gap: 16,
    marginTop: 16,
    alignItems: "start",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#f8fafc",
  },

  sectionHelp: {
    marginTop: 6,
    color: "#94a3b8",
    fontWeight: 700,
    fontSize: 12,
    lineHeight: 1.45,
  },

  filters: {
    display: "grid",
    gridTemplateColumns: "1.4fr repeat(5, minmax(0, 1fr)) auto",
    gap: 10,
    marginTop: 14,
    alignItems: "end",
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#e5e7eb",
    fontWeight: 800,
    outline: "none",
  },

  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#e5e7eb",
    fontWeight: 800,
    outline: "none",
  },

  list: {
    display: "grid",
    gap: 10,
    marginTop: 14,
  },

  item: {
    border: "1px solid #1f2937",
    borderRadius: 14,
    background: "#0b1220",
    padding: 12,
  },

  itemTitle: {
    fontWeight: 950,
    color: "#f8fafc",
    fontSize: 15,
    lineHeight: 1.3,
  },

  itemText: {
    marginTop: 8,
    color: "#cbd5e1",
    fontWeight: 800,
    lineHeight: 1.45,
  },

  row: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #334155",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  badgeMuted: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #334155",
    background: "#111827",
    fontSize: 12,
    fontWeight: 900,
    color: "#cbd5e1",
    whiteSpace: "nowrap",
  },

  queueGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 1fr 260px",
    gap: 12,
    alignItems: "start",
  },

  miniBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #334155",
    background: "#111827",
    color: "#e5e7eb",
    fontWeight: 900,
    textDecoration: "none",
    fontSize: 12,
  },

  ok: {
    marginBottom: 12,
    borderRadius: 12,
    border: "1px solid #14532d",
    background: "#052e16",
    padding: 12,
    color: "#bbf7d0",
    fontWeight: 900,
    fontSize: 13,
  },

  err: {
    marginBottom: 12,
    borderRadius: 12,
    border: "1px solid #7f1d1d",
    background: "#450a0a",
    padding: 12,
    color: "#fecaca",
    fontWeight: 900,
    fontSize: 13,
    lineHeight: 1.45,
  },

  empty: {
    border: "1px dashed #334155",
    borderRadius: 14,
    background: "#0b1220",
    padding: 12,
    color: "#94a3b8",
    fontWeight: 900,
  },
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function AdminInterventionsPage() {
  return (
    <Suspense fallback={null}>
      <AdminInterventionsPageContent />
    </Suspense>
  );
}

function AdminInterventionsPageContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceEntryRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);
  const [overviewRows, setOverviewRows] = useState<StudentProfileOverviewRow[]>([]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [mode, setMode] = useState<QueueMode>((safe(sp.get("mode")) as QueueMode) || "queue");
  const [search, setSearch] = useState(safe(sp.get("q")));
  const [classId, setClassId] = useState(safe(sp.get("classId")));
  const [statusFilter, setStatusFilter] = useState(safe(sp.get("status")));
  const [priorityFilter, setPriorityFilter] = useState(safe(sp.get("priority")));
  const [tierFilter, setTierFilter] = useState(safe(sp.get("tier")));
  const [sortBy, setSortBy] = useState(safe(sp.get("sort")) || "urgency");

  async function loadClasses() {
    const tries = [
      supabase
        .from("classes")
        .select("id,name,year_level,teacher_name,room")
        .limit(5000),
      supabase.from("classes").select("id,name,year_level,room").limit(5000),
      supabase.from("classes").select("id,name,year_level").limit(5000),
      supabase.from("classes").select("id,name").limit(5000),
    ];

    for (const q of tries) {
      const r = await q;
      if (!r.error) {
        setClasses(((r.data as any[]) ?? []) as ClassRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setClasses([]);
  }

  async function loadStudents() {
    const tries = [
      "id,class_id,preferred_name,first_name,surname,family_name,is_ilp,year_level",
      "id,class_id,preferred_name,first_name,surname,is_ilp,year_level",
      "id,class_id,preferred_name,first_name,is_ilp,year_level",
    ];

    for (const sel of tries) {
      const r = await supabase.from("students").select(sel).limit(50000);
      if (!r.error) {
        setStudents(((r.data as any[]) ?? []) as StudentRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setStudents([]);
  }

  async function loadEvidence() {
    const tries = [
      supabase
        .from("evidence_entries")
        .select("id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,is_deleted")
        .eq("is_deleted", false)
        .limit(50000),
      supabase
        .from("evidence_entries")
        .select("id,student_id,class_id,occurred_on,created_at,is_deleted")
        .limit(50000),
    ];

    for (const q of tries) {
      const r = await q;
      if (!r.error) {
        const rows = (((r.data as any[]) ?? []) as EvidenceEntryRow[]).filter((x) => x.is_deleted !== true);
        setEvidence(rows);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setEvidence([]);
  }

  async function loadInterventions() {
    const tries = [
      supabase
        .from("interventions")
        .select(
          "id,student_id,class_id,title,notes,note,strategy,tier,priority,status,due_on,review_due_on,review_due_date,next_review_on,start_date,end_date,created_at,updated_at"
        )
        .limit(50000),
      supabase
        .from("interventions")
        .select(
          "id,student_id,class_id,title,notes,note,tier,priority,status,due_on,review_due_on,review_due_date,next_review_on,created_at,updated_at"
        )
        .limit(50000),
      supabase
        .from("interventions")
        .select("id,student_id,class_id,title,status,due_on,review_due_on,created_at")
        .limit(50000),
    ];

    for (const q of tries) {
      const r = await q;
      if (!r.error) {
        setInterventions(((r.data as any[]) ?? []) as InterventionRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setInterventions([]);
  }

  async function loadOverview() {
    const r = await supabase.from("v_student_profile_overview_v1").select("*").limit(50000);

    if (r.error) {
      if (isMissingRelationOrColumn(r.error)) {
        setOverviewRows([]);
        return;
      }
      throw r.error;
    }

    setOverviewRows(((r.data as any[]) ?? []) as StudentProfileOverviewRow[]);
  }

  async function loadAll() {
    setBusy(true);
    setErr(null);
    try {
      await Promise.all([
        loadClasses(),
        loadStudents(),
        loadEvidence(),
        loadInterventions(),
        loadOverview(),
      ]);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const classMap = useMemo(() => {
    const map = new Map<string, ClassRow>();
    classes.forEach((c) => map.set(c.id, c));
    return map;
  }, [classes]);

  const studentMap = useMemo(() => {
    const map = new Map<string, StudentRow>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const overviewMap = useMemo(() => {
    const map = new Map<string, StudentProfileOverviewRow>();
    overviewRows.forEach((r) => map.set(r.student_id, r));
    return map;
  }, [overviewRows]);

  const evidenceByStudent = useMemo(() => {
    const map = new Map<string, EvidenceEntryRow[]>();

    evidence.forEach((e) => {
      const sid = safe(e.student_id);
      if (!sid) return;
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid)!.push(e);
    });

    for (const [sid, rows] of map.entries()) {
      rows.sort((a, b) => {
        const ad = safe(a.occurred_on || a.created_at);
        const bd = safe(b.occurred_on || b.created_at);
        return bd.localeCompare(ad);
      });
      map.set(sid, rows);
    }

    return map;
  }, [evidence]);

  const insights = useMemo<InterventionInsight[]>(() => {
    return interventions.map((iv) => {
      const student = studentMap.get(safe(iv.student_id)) ?? null;
      const classRow =
        classMap.get(safe(iv.class_id)) ??
        classMap.get(safe(student?.class_id)) ??
        null;

      const overview = overviewMap.get(safe(iv.student_id)) ?? null;
      const evidenceList = evidenceByStudent.get(safe(iv.student_id)) ?? [];

      const reviewDate = pickReviewDate(iv) || null;
      const overdue = !isClosedStatus(iv.status) && (daysUntil(reviewDate) ?? 999) < 0;
      const dueSoon =
        !isClosedStatus(iv.status) &&
        (daysUntil(reviewDate) ?? 999) >= 0 &&
        (daysUntil(reviewDate) ?? 999) <= 14;

      const lastEvidenceAt =
        safe(overview?.last_evidence_at) ||
        safe(evidenceList[0]?.occurred_on || evidenceList[0]?.created_at) ||
        null;

      const lastEvidenceDays = daysSince(lastEvidenceAt);

      const evidence30d =
        safeNum(overview?.evidence_count_30d, -1) >= 0
          ? safeNum(overview?.evidence_count_30d)
          : evidenceList.filter((e) => {
              const d = daysSince(e.occurred_on || e.created_at);
              return d != null && d <= 30;
            }).length;

      const evidencePrev30d = evidenceList.filter((e) => {
        const d = daysSince(e.occurred_on || e.created_at);
        return d != null && d > 30 && d <= 60;
      }).length;

      const evidenceMomentumDelta = evidence30d - evidencePrev30d;

      const openLoad = safeNum(overview?.open_interventions_count);
      const overdueReviews = safeNum(overview?.overdue_reviews_count);
      const closed = isClosedStatus(iv.status);
      const paused = isPausedStatus(iv.status);

      const urgencyScore = buildUrgencyScore({
        priority: normalizePriority(iv.priority),
        overdue,
        dueSoon,
        attentionStatus: overview?.attention_status,
        lastEvidenceDays,
        overdueReviews,
        paused,
        closed,
      });

      const effectiveness = buildEffectivenessSignal({
        closed,
        paused,
        evidence30d,
        evidencePrev30d,
        lastEvidenceDays,
        overdue,
      });

      const decision = buildRecommendedDecision({
        tier: normalizeTier(iv.tier),
        closed,
        paused,
        overdue,
        dueSoon,
        effectivenessSignal: effectiveness.effectivenessSignal,
        lastEvidenceDays,
        attentionStatus: overview?.attention_status,
      });

      return {
        id: iv.id,
        intervention: iv,
        student,
        classRow,
        overview,

        title: safe(iv.title) || strategyLabel(iv),
        studentName: studentName(student, overview),
        classLabel: classLabel(classRow),

        status: safe(iv.status) || "open",
        priority: normalizePriority(iv.priority),
        tier: normalizeTier(iv.tier),
        strategyLabel: strategyLabel(iv),

        createdAt: safe(iv.created_at) || null,
        reviewDate,
        lastEvidenceAt,
        lastEvidenceDays,

        evidence30d,
        evidencePrev30d,
        evidenceMomentumDelta,

        openLoad,
        overdueReviews,
        dueIn14Days: dueSoon,
        overdue,

        effectivenessSignal: effectiveness.effectivenessSignal,
        effectivenessTone: effectiveness.effectivenessTone,
        effectivenessReason: effectiveness.effectivenessReason,

        recommendedDecision: decision.recommendedDecision,
        decisionReason: decision.decisionReason,
        urgencyScore,
      };
    });
  }, [interventions, studentMap, classMap, overviewMap, evidenceByStudent]);

  const filteredInsights = useMemo(() => {
    const q = safe(search).toLowerCase();

    let rows = insights.filter((row) => {
      if (classId && safe(row.classRow?.id) !== classId && safe(row.intervention.class_id) !== classId) return false;
      if (statusFilter && safe(row.status).toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (priorityFilter && row.priority !== priorityFilter) return false;
      if (tierFilter && row.tier !== tierFilter) return false;

      if (mode === "queue" && isClosedStatus(row.status)) return false;
      if (mode === "review" && !row.overdue && !row.dueIn14Days) return false;
      if (mode === "history" && !isClosedStatus(row.status)) return false;

      if (q) {
        const hay = [
          row.title,
          row.studentName,
          row.classLabel,
          row.strategyLabel,
          safe(row.intervention.notes || row.intervention.note),
        ]
          .join(" ")
          .toLowerCase();

        if (!hay.includes(q)) return false;
      }

      return true;
    });

    rows = [...rows].sort((a, b) => {
      if (sortBy === "review_date") {
        return safe(a.reviewDate).localeCompare(safe(b.reviewDate));
      }
      if (sortBy === "effectiveness") {
        const rank = { Weak: 3, Stagnating: 2, Unknown: 1, Working: 0 };
        return rank[b.effectivenessSignal] - rank[a.effectivenessSignal];
      }
      if (sortBy === "class") {
        return a.classLabel.localeCompare(b.classLabel);
      }
      return b.urgencyScore - a.urgencyScore;
    });

    return rows;
  }, [insights, search, classId, statusFilter, priorityFilter, tierFilter, mode, sortBy]);

  const forecastSummary = useMemo<ForecastSummary>(() => {
    const active = insights.filter((x) => !isClosedStatus(x.status));
    const dueNext14Days = active.filter((x) => x.dueIn14Days).length;
    const overdueNow = active.filter((x) => x.overdue).length;

    const classCounts = new Map<string, number>();
    const classTier23 = new Map<string, number>();

    active.forEach((x) => {
      const cid = safe(x.classRow?.id) || safe(x.intervention.class_id);
      if (!cid) return;
      classCounts.set(cid, (classCounts.get(cid) ?? 0) + 1);
      if (x.tier === "Tier 2" || x.tier === "Tier 3") {
        classTier23.set(cid, (classTier23.get(cid) ?? 0) + 1);
      }
    });

    const overloadedClasses = Array.from(classCounts.values()).filter((n) => n >= 5).length;
    const tier23Clusters = Array.from(classTier23.values()).filter((n) => n >= 3).length;

    return {
      dueNext14Days,
      overdueNow,
      overloadedClasses,
      tier23Clusters,
    };
  }, [insights]);

  const strategyComparisons = useMemo<StrategyComparison[]>(() => {
    const countMap = new Map<string, number>();

    insights
      .filter((x) => !isClosedStatus(x.status))
      .forEach((x) => {
        const label = x.strategyLabel || "General support";
        countMap.set(label, (countMap.get(label) ?? 0) + 1);
      });

    return Array.from(countMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [insights]);

  const classBurden = useMemo<ClassBurdenRow[]>(() => {
    const map = new Map<string, ClassBurdenRow>();

    insights
      .filter((x) => !isClosedStatus(x.status))
      .forEach((x) => {
        const cid = safe(x.classRow?.id) || safe(x.intervention.class_id);
        if (!cid) return;

        if (!map.has(cid)) {
          map.set(cid, {
            classId: cid,
            classLabel: x.classLabel,
            activeCount: 0,
            dueNext14Days: 0,
            overdueCount: 0,
            tier23Count: 0,
            pressureScore: 0,
            recommendation: "",
          });
        }

        const row = map.get(cid)!;
        row.activeCount += 1;
        if (x.dueIn14Days) row.dueNext14Days += 1;
        if (x.overdue) row.overdueCount += 1;
        if (x.tier === "Tier 2" || x.tier === "Tier 3") row.tier23Count += 1;
      });

    const rows = Array.from(map.values()).map((row) => {
      row.pressureScore =
        row.activeCount * 8 + row.dueNext14Days * 10 + row.overdueCount * 14 + row.tier23Count * 8;

      if (row.pressureScore >= 70) {
        row.recommendation =
          "Leadership support or additional review capacity should be directed here first.";
      } else if (row.pressureScore >= 40) {
        row.recommendation =
          "Monitor closely and prepare short-term intervention review support.";
      } else {
        row.recommendation = "Current intervention load looks manageable.";
      }

      return row;
    });

    return rows.sort((a, b) => b.pressureScore - a.pressureScore).slice(0, 6);
  }, [insights]);

  const topActions = useMemo(() => {
    return [...filteredInsights]
      .filter((x) => !isClosedStatus(x.status))
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, 6);
  }, [filteredInsights]);

  const headlineStats = useMemo(() => {
    const active = insights.filter((x) => !isClosedStatus(x.status));
    return {
      active: active.length,
      overdue: active.filter((x) => x.overdue).length,
      dueSoon: active.filter((x) => x.dueIn14Days).length,
      weak: active.filter((x) => x.effectivenessSignal === "Weak").length,
      stagnant: active.filter((x) => x.effectivenessSignal === "Stagnating").length,
    };
  }, [insights]);

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        {busy ? <div style={S.ok}>Refreshing intervention queue…</div> : null}
        {err ? <div style={S.err}>{err}</div> : null}

        <section style={S.hero}>
          <div style={S.eyebrow}>Intervention Operations</div>
          <div style={S.h1}>Intervention Decision Engine</div>
          <div style={S.sub}>
            Move beyond queue management into intervention strategy: track effectiveness, forecast support load, compare burden across classes, and surface the clearest next decision for every plan.
          </div>

          <div style={S.topActions}>
            <Link href="/admin/intervention-entry" style={S.btn}>
              + New intervention
            </Link>
            <Link href="/admin/evidence-entry" style={S.btnGhost}>
              Add evidence
            </Link>
            <button style={S.btnGhost} onClick={loadAll}>
              Refresh
            </button>
          </div>

          <div style={S.tileGrid}>
            <div style={S.tile}>
              <div style={S.tileK}>Active plans</div>
              <div style={S.tileV}>{headlineStats.active}</div>
              <div style={S.tileS}>Open interventions currently active in the system.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Overdue now</div>
              <div style={S.tileV}>{headlineStats.overdue}</div>
              <div style={S.tileS}>Plans already past review and requiring immediate attention.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Due next 14d</div>
              <div style={S.tileV}>{forecastSummary.dueNext14Days}</div>
              <div style={S.tileS}>Near-future review load likely to hit the queue soon.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Weak impact</div>
              <div style={S.tileV}>{headlineStats.weak}</div>
              <div style={S.tileS}>Interventions showing little evidence of current impact.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Stagnating</div>
              <div style={S.tileV}>{headlineStats.stagnant}</div>
              <div style={S.tileS}>Plans that are active but not clearly improving momentum.</div>
            </div>
          </div>
        </section>

        <section style={S.card}>
          <div style={S.sectionTitle}>Queue controls</div>
          <div style={S.sectionHelp}>
            Filter the live queue, review queue, or history view. This page is now meant to drive intervention decisions, not just display records.
          </div>

          <div style={S.filters}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, class, strategy, title, notes..."
              style={S.input}
            />

            <select value={mode} onChange={(e) => setMode(e.target.value as QueueMode)} style={S.select}>
              <option value="queue">Queue</option>
              <option value="review">Review due</option>
              <option value="history">History</option>
            </select>

            <select value={classId} onChange={(e) => setClassId(e.target.value)} style={S.select}>
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {classLabel(c)}
                </option>
              ))}
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={S.select}>
              <option value="">All status</option>
              <option value="open">Open</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={S.select}
            >
              <option value="">All priority</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>

            <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} style={S.select}>
              <option value="">All tiers</option>
              <option value="Tier 1">Tier 1</option>
              <option value="Tier 2">Tier 2</option>
              <option value="Tier 3">Tier 3</option>
            </select>

            <div style={{ display: "flex", gap: 8 }}>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={S.select}>
                <option value="urgency">Urgency</option>
                <option value="review_date">Review date</option>
                <option value="effectiveness">Effectiveness</option>
                <option value="class">Class</option>
              </select>
            </div>
          </div>
        </section>

        <section style={S.grid2}>
          <section style={S.card}>
            <div style={S.sectionTitle}>Top next actions</div>
            <div style={S.sectionHelp}>
              The queue now surfaces the most urgent intervention actions first, not just the most recent records.
            </div>

            <div style={S.list}>
              {topActions.length === 0 ? (
                <div style={S.empty}>No intervention actions match the current scope.</div>
              ) : (
                topActions.map((row) => {
                  const tone = tonePill(row.effectivenessTone);
                  return (
                    <div key={row.id} style={S.item}>
                      <div style={{ ...S.row, justifyContent: "space-between" }}>
                        <div style={S.itemTitle}>{row.title}</div>
                        <span style={{ ...S.badge, background: tone.bg, borderColor: tone.bd, color: tone.fg }}>
                          {row.recommendedDecision}
                        </span>
                      </div>
                      <div style={S.itemText}>{row.decisionReason}</div>
                      <div style={{ ...S.row, marginTop: 8 }}>
                        <span style={S.badgeMuted}>{row.studentName}</span>
                        <span style={S.badgeMuted}>{row.classLabel}</span>
                        <span style={S.badgeMuted}>Urgency {row.urgencyScore}</span>
                        <span style={S.badgeMuted}>Review {shortDate(row.reviewDate)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section style={S.card}>
            <div style={S.sectionTitle}>Support load forecasting</div>
            <div style={S.sectionHelp}>
              Future pressure matters. This helps spot the next review wave and class-level support pile-up before it lands.
            </div>

            <div style={S.list}>
              <div style={S.item}>
                <div style={S.itemTitle}>Review load next 14 days</div>
                <div style={S.itemText}>
                  {forecastSummary.dueNext14Days} active interventions are due inside the next two weeks.
                </div>
              </div>

              <div style={S.item}>
                <div style={S.itemTitle}>Class overload risk</div>
                <div style={S.itemText}>
                  {forecastSummary.overloadedClasses} classes are carrying heavy intervention volume and may need extra review capacity.
                </div>
              </div>

              <div style={S.item}>
                <div style={S.itemTitle}>Tier 2 / Tier 3 clustering</div>
                <div style={S.itemText}>
                  {forecastSummary.tier23Clusters} classes show meaningful Tier 2 / Tier 3 clustering that may require strategic oversight.
                </div>
              </div>

              <div style={S.item}>
                <div style={S.itemTitle}>Overdue pressure</div>
                <div style={S.itemText}>
                  {forecastSummary.overdueNow} interventions are already overdue and should be treated as immediate operational load.
                </div>
              </div>
            </div>
          </section>
        </section>

        <section style={S.grid2}>
          <section style={S.card}>
            <div style={S.sectionTitle}>Intervention portfolio comparisons</div>
            <div style={S.sectionHelp}>
              Compare strategy prevalence and spot whether support patterns are becoming overly concentrated.
            </div>

            <div style={S.list}>
              {strategyComparisons.length === 0 ? (
                <div style={S.empty}>No active strategies are visible in the current scope.</div>
              ) : (
                strategyComparisons.map((row) => (
                  <div key={row.label} style={S.item}>
                    <div style={{ ...S.row, justifyContent: "space-between" }}>
                      <div style={S.itemTitle}>{row.label}</div>
                      <span style={S.badgeMuted}>{row.count}</span>
                    </div>
                    <div style={S.itemText}>
                      This is one of the most common active intervention approaches in the current portfolio.
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section style={S.card}>
            <div style={S.sectionTitle}>Class intervention burden</div>
            <div style={S.sectionHelp}>
              See which classes are carrying the heaviest support portfolio and where leadership should send extra help first.
            </div>

            <div style={S.list}>
              {classBurden.length === 0 ? (
                <div style={S.empty}>No class burden data is visible in the current scope.</div>
              ) : (
                classBurden.map((row) => (
                  <div key={row.classId} style={S.item}>
                    <div style={{ ...S.row, justifyContent: "space-between" }}>
                      <div style={S.itemTitle}>{row.classLabel}</div>
                      <span style={S.badgeMuted}>Pressure {row.pressureScore}</span>
                    </div>
                    <div style={{ ...S.row, marginTop: 8 }}>
                      <span style={S.badgeMuted}>Active {row.activeCount}</span>
                      <span style={S.badgeMuted}>Due 14d {row.dueNext14Days}</span>
                      <span style={S.badgeMuted}>Overdue {row.overdueCount}</span>
                      <span style={S.badgeMuted}>Tier 2/3 {row.tier23Count}</span>
                    </div>
                    <div style={S.itemText}>{row.recommendation}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </section>

        <section style={S.card}>
          <div style={S.sectionTitle}>Intervention decision queue</div>
          <div style={S.sectionHelp}>
            Each row now includes effectiveness signals and a recommended decision, so staff can act rather than simply scan.
          </div>

          <div style={S.list}>
            {filteredInsights.length === 0 ? (
              <div style={S.empty}>No interventions match the current filters.</div>
            ) : (
              filteredInsights.map((row) => {
                const effectivenessTone = tonePill(row.effectivenessTone);
                const attention = attentionTone(row.overview?.attention_status);

                return (
                  <div key={row.id} style={S.item}>
                    <div style={S.queueGrid}>
                      <div>
                        <div className="title" style={S.itemTitle}>
                          {row.title}
                        </div>
                        <div style={{ ...S.row, marginTop: 8 }}>
                          <span style={S.badgeMuted}>{row.studentName}</span>
                          <span style={S.badgeMuted}>{row.classLabel}</span>
                          <span style={S.badgeMuted}>{row.tier}</span>
                          <span style={S.badgeMuted}>{row.priority}</span>
                          <span
                            style={{
                              ...S.badge,
                              background: attention.bg,
                              borderColor: attention.bd,
                              color: attention.fg,
                            }}
                          >
                            {safe(row.overview?.attention_status) || "Ready"}
                          </span>
                        </div>
                        <div style={S.itemText}>
                          {row.decisionReason}
                        </div>
                      </div>

                      <div>
                        <div style={S.row}>
                          <span
                            style={{
                              ...S.badge,
                              background: effectivenessTone.bg,
                              borderColor: effectivenessTone.bd,
                              color: effectivenessTone.fg,
                            }}
                          >
                            {row.effectivenessSignal}
                          </span>
                          <span style={S.badgeMuted}>{row.recommendedDecision}</span>
                        </div>
                        <div style={S.itemText}>{row.effectivenessReason}</div>
                        <div style={{ ...S.row, marginTop: 8 }}>
                          <span style={S.badgeMuted}>30d {row.evidence30d}</span>
                          <span style={S.badgeMuted}>prev 30d {row.evidencePrev30d}</span>
                          <span style={S.badgeMuted}>
                            momentum {row.evidenceMomentumDelta >= 0 ? "+" : ""}
                            {row.evidenceMomentumDelta}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div style={S.row}>
                          <span style={S.badgeMuted}>Review {shortDate(row.reviewDate)}</span>
                          <span style={S.badgeMuted}>
                            last evidence {row.lastEvidenceDays == null ? "—" : `${row.lastEvidenceDays}d`}
                          </span>
                        </div>
                        <div style={{ ...S.row, marginTop: 8 }}>
                          <span style={S.badgeMuted}>open load {row.openLoad}</span>
                          <span style={S.badgeMuted}>overdue reviews {row.overdueReviews}</span>
                          <span style={S.badgeMuted}>urgency {row.urgencyScore}</span>
                        </div>
                        <div style={S.itemText}>
                          Strategy: {row.strategyLabel}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <Link
                          href={`/admin/students/${encodeURIComponent(safe(row.student?.id))}`}
                          style={S.miniBtn}
                        >
                          Student
                        </Link>
                        <Link
                          href={`/admin/classes/${encodeURIComponent(safe(row.classRow?.id || row.intervention.class_id))}`}
                          style={S.miniBtn}
                        >
                          Class
                        </Link>
                        <Link
                          href={`/admin/evidence-entry?studentId=${encodeURIComponent(safe(row.student?.id))}&returnTo=${encodeURIComponent("/admin/interventions")}`}
                          style={S.miniBtn}
                        >
                          Add evidence
                        </Link>
                        <Link
                          href={`/admin/intervention-entry?id=${encodeURIComponent(row.id)}`}
                          style={S.miniBtn}
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
