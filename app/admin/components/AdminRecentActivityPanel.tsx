"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

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
  status?: string | null;
  notes?: string | null;
  note?: string | null;
  due_on?: string | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  next_review_on?: string | null;
  created_at?: string | null;
  [k: string]: any;
};

type ActivityItem = {
  key: string;
  kind: "Evidence" | "Intervention";
  title: string;
  subtitle: string;
  dateText: string;
  href?: string;
};

type AdminRecentActivityPanelProps = {
  classId?: string;
  studentId?: string;
  limit?: number;
  title?: string;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("column") || msg.includes("does not exist");
}

function toDate(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function shortDate(value: string | null | undefined) {
  const d = toDate(value);
  if (!d) return "—";
  return d.toISOString().slice(0, 10);
}

function clip(text: string | null | undefined, max = 90) {
  const s = safe(text);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function evidenceDate(e: EvidenceRow) {
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
  return ["closed", "done", "archived", "completed", "resolved"].includes(
    safe(status).toLowerCase()
  );
}

function dateSortValue(value: string | null | undefined) {
  return toDate(value)?.getTime() ?? 0;
}

/* ───────────────────────── COMPONENT ───────────────────────── */

export default function AdminRecentActivityPanel({
  classId,
  studentId,
  limit = 8,
  title = "Recent activity",
}: AdminRecentActivityPanelProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);

  useEffect(() => {
    async function load() {
      setBusy(true);
      setError(null);

      try {
        await Promise.all([loadEvidence(), loadInterventions()]);
      } catch (e: any) {
        setError(String(e?.message ?? e));
      } finally {
        setBusy(false);
      }
    }

    load();
  }, [classId, studentId, limit]);

  async function loadEvidence() {
    const tries = [
      "id,student_id,class_id,title,learning_area,summary,body,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,title,learning_area,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,title,occurred_on,created_at,is_deleted",
    ];

    for (const sel of tries) {
      let q = supabase
        .from("evidence_entries")
        .select(sel)
        .eq("is_deleted", false)
        .limit(50);

      if (classId) q = q.eq("class_id", classId);
      if (studentId) q = q.eq("student_id", studentId);

      const r = await q;
      if (!r.error) {
        setEvidence((((r.data as any[]) ?? []) as EvidenceRow[]).filter((x) => x.is_deleted !== true));
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setEvidence([]);
  }

  async function loadInterventions() {
    const tries = [
      "id,student_id,class_id,title,status,notes,note,due_on,review_due_on,review_due_date,next_review_on,created_at",
      "id,student_id,class_id,title,status,due_on,review_due_on,review_due_date,next_review_on,created_at",
      "id,student_id,class_id,title,status,created_at",
    ];

    for (const sel of tries) {
      let q = supabase.from("interventions").select(sel).limit(50);

      if (classId) q = q.eq("class_id", classId);
      if (studentId) q = q.eq("student_id", studentId);

      const r = await q;
      if (!r.error) {
        setInterventions(((r.data as any[]) ?? []) as InterventionRow[]);
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setInterventions([]);
  }

  const items = useMemo<ActivityItem[]>(() => {
    const evidenceItems: ActivityItem[] = evidence.map((e) => ({
      key: `e-${safe(e.id)}`,
      kind: "Evidence",
      title: clip(e.title || e.learning_area || "Evidence entry", 80),
      subtitle: clip(e.summary || e.body || e.learning_area || "Evidence captured.", 110),
      dateText: shortDate(evidenceDate(e)),
      href: classId
        ? `/admin/classes/${encodeURIComponent(classId)}?tab=evidence`
        : studentId
        ? `/admin/students/${encodeURIComponent(studentId)}`
        : "/admin/evidence-feed",
    }));

    const interventionItems: ActivityItem[] = interventions
      .filter((i) => !isClosedStatus(i.status) || safe(i.title) || safe(i.note) || safe(i.notes))
      .map((i) => ({
        key: `i-${safe(i.id)}`,
        kind: "Intervention",
        title: clip(i.title || "Intervention item", 80),
        subtitle: clip(
          i.notes ||
            i.note ||
            safe(i.status) ||
            "Support plan updated.",
          110
        ),
        dateText: shortDate(reviewDate(i)),
        href: classId
          ? `/admin/classes/${encodeURIComponent(classId)}?tab=interventions`
          : studentId
          ? `/admin/students/${encodeURIComponent(studentId)}`
          : "/admin/interventions",
      }));

    return [...evidenceItems, ...interventionItems]
      .sort((a, b) => dateSortValue(b.dateText) - dateSortValue(a.dateText))
      .slice(0, limit);
  }, [evidence, interventions, classId, studentId, limit]);

  return (
    <section style={S.card}>
      <div style={S.headerRow}>
        <div>
          <div style={S.title}>{title}</div>
          <div style={S.help}>
            Latest evidence and intervention movement relevant to this view.
          </div>
        </div>

        <div style={S.headerActions}>
          {!classId && !studentId ? (
            <Link href="/admin/evidence-feed" style={S.linkBtn}>
              Open feed
            </Link>
          ) : null}
        </div>
      </div>

      {busy ? <div style={S.notice}>Loading activity…</div> : null}
      {error ? <div style={S.error}>{error}</div> : null}

      {!busy && !error ? (
        <div style={S.list}>
          {items.map((item) =>
            item.href ? (
              <Link key={item.key} href={item.href} style={S.itemLink}>
                <ActivityRow item={item} />
              </Link>
            ) : (
              <div key={item.key} style={S.item}>
                <ActivityRow item={item} />
              </div>
            )
          )}

          {items.length === 0 ? (
            <div style={S.empty}>No recent activity found for this view.</div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <>
      <div style={S.itemTop}>
        <span
          style={{
            ...S.kindChip,
            ...(item.kind === "Evidence" ? S.kindEvidence : S.kindIntervention),
          }}
        >
          {item.kind}
        </span>
        <span style={S.dateText}>{item.dateText}</span>
      </div>

      <div style={S.itemTitle}>{item.title}</div>
      <div style={S.itemSubtitle}>{item.subtitle}</div>
    </>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */

const S: Record<string, React.CSSProperties> = {
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  },

  headerRow: {
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    flexWrap: "wrap",
  },

  headerActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  title: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
  },

  help: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.45,
  },

  linkBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 10px",
    borderRadius: 10,
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: 13,
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

  list: {
    display: "grid",
    gap: 10,
  },

  itemLink: {
    display: "block",
    textDecoration: "none",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 12,
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

  kindChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid transparent",
    fontSize: 12,
    fontWeight: 900,
  },

  kindEvidence: {
    background: "#eff6ff",
    borderColor: "#bfdbfe",
    color: "#1d4ed8",
  },

  kindIntervention: {
    background: "#fff7ed",
    borderColor: "#fed7aa",
    color: "#9a3412",
  },

  dateText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
  },

  itemTitle: {
    marginTop: 10,
    color: "#0f172a",
    fontWeight: 900,
    fontSize: 14,
    lineHeight: 1.35,
  },

  itemSubtitle: {
    marginTop: 6,
    color: "#475569",
    fontWeight: 700,
    fontSize: 13,
    lineHeight: 1.45,
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