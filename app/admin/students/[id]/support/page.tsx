"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import StudentHubNav from "@/app/admin/components/StudentHubNav";
import { supabase } from "@/lib/supabaseClient";
import {
  buildStudentListPath,
  buildStudentProfilePath,
} from "@/lib/studentRoutes";

/* ───────────────── TYPES ───────────────── */

type Student = {
  id: string;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
};

type Intervention = {
  id: string;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  tier?: string | number | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  next_review_on?: string | null;
  due_on?: string | null;
  notes?: string | null;
  updated_at?: string | null;
};

/* ───────────────── HELPERS ───────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function nameOf(s: Student | null) {
  if (!s) return "Student";
  return `${safe(s.preferred_name || s.first_name)} ${safe(
    s.surname || s.family_name
  )}`.trim();
}

function reviewDate(iv: Intervention) {
  return (
    safe(iv.review_due_on) ||
    safe(iv.review_due_date) ||
    safe(iv.next_review_on) ||
    safe(iv.due_on) ||
    ""
  );
}

function daysUntil(v: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return Math.floor((d.getTime() - Date.now()) / 86400000);
}

function isOpen(status: string | null) {
  const s = safe(status).toLowerCase();
  return !["closed", "done", "resolved", "completed"].includes(s);
}

/* ───────────────── STYLES ───────────────── */

const S = {
  shell: { display: "flex", minHeight: "100vh", background: "#f6f8fc" } as React.CSSProperties,
  main: { flex: 1, padding: 24, maxWidth: 1300 } as React.CSSProperties,

  hero: {
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    background: "#ffffff",
  } as React.CSSProperties,

  h1: { fontSize: 30, fontWeight: 900 } as React.CSSProperties,
  sub: { color: "#64748b", marginBottom: 14 } as React.CSSProperties,

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 14,
  } as React.CSSProperties,

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
  } as React.CSSProperties,

  stat: { fontSize: 28, fontWeight: 900 } as React.CSSProperties,

  queueItem: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14,
    background: "#f8fafc",
  } as React.CSSProperties,

  badge: {
    fontSize: 11,
    fontWeight: 800,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
  } as React.CSSProperties,
};

/* ───────────────── PAGE ───────────────── */

export default function StudentSupportPage() {
  return (
    <Suspense fallback={null}>
      <StudentSupportPageContent />
    </Suspense>
  );
}

function StudentSupportPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const studentId = String(params?.id ?? "");
  const returnTo = searchParams?.get("returnTo") || "";

  const backHref =
    returnTo ||
    buildStudentProfilePath(studentId, buildStudentListPath());

  const [student, setStudent] = useState<Student | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();

      const { data: iv } = await supabase
        .from("interventions")
        .select("*")
        .eq("student_id", studentId);

      setStudent(s ?? null);
      setInterventions(iv ?? []);
    }

    load();
  }, [studentId]);

  /* ───────────────── INTELLIGENCE ───────────────── */

  const open = useMemo(
    () => interventions.filter((x) => isOpen(x.status ?? null)),
    [interventions]
  );

  const overdue = useMemo(
    () =>
      open.filter((x) => {
        const d = daysUntil(reviewDate(x));
        return d != null && d < 0;
      }),
    [open]
  );

  const attentionLevel = useMemo(() => {
    if (overdue.length > 0) return "Attention";
    if (open.length > 3) return "Watch";
    return "Stable";
  }, [open, overdue]);

  const nextAction = useMemo(() => {
    if (overdue.length > 0) return "Review overdue interventions immediately";
    if (open.length === 0) return "No supports active — consider monitoring";
    return "Monitor and review upcoming supports";
  }, [open, overdue]);

  /* ───────────────── UI ───────────────── */

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <StudentHubNav studentId={studentId} />

        <section style={S.hero}>
          <h1 style={S.h1}>{nameOf(student)} — Support</h1>
          <div style={S.sub}>
            Intervention intelligence, risk, and next actions
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => router.push(backHref)}>
              Back
            </button>

            <button
              onClick={() =>
                router.push(
                  `/admin/interventions/new?studentId=${studentId}`
                )
              }
            >
              + New Support
            </button>
          </div>
        </section>

        <section style={S.grid}>
          <div style={S.card}>
            <div>Attention Level</div>
            <div style={S.stat}>{attentionLevel}</div>
          </div>

          <div style={S.card}>
            <div>Open Supports</div>
            <div style={S.stat}>{open.length}</div>
          </div>

          <div style={S.card}>
            <div>Overdue Reviews</div>
            <div style={S.stat}>{overdue.length}</div>
          </div>
        </section>

        <section style={{ ...S.card, marginTop: 16 }}>
          <strong>Next Action</strong>
          <div style={{ marginTop: 6 }}>{nextAction}</div>
        </section>

        <section style={{ ...S.card, marginTop: 16 }}>
          <strong>Support Queue</strong>

          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {open.map((iv) => {
              const d = daysUntil(reviewDate(iv));

              return (
                <div key={iv.id} style={S.queueItem}>
                  <div style={{ fontWeight: 800 }}>
                    {safe(iv.title) || "Support Plan"}
                  </div>

                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <span style={S.badge}>{safe(iv.status)}</span>

                    {d != null && (
                      <span style={S.badge}>
                        {d < 0
                          ? `${Math.abs(d)}d overdue`
                          : `${d}d remaining`}
                      </span>
                    )}
                  </div>

                  {safe(iv.notes) && (
                    <div style={{ marginTop: 6 }}>
                      {safe(iv.notes)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
