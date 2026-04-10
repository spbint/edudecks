"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { supabase } from "@/lib/supabaseClient";
import { loadClassAnalytics } from "@/lib/analytics/class";
import type {
  ClassAnalytics,
  ClassRow,
  StudentAttentionItem,
  StudentAnalytics,
} from "@/lib/analytics/types";

const LAST_TEACHER_CLASS_KEY = "fm_teacher_last_class_v1";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function readLastTeacherClassId() {
  if (typeof window === "undefined") return "";
  try {
    return safe(window.localStorage.getItem(LAST_TEACHER_CLASS_KEY));
  } catch {
    return "";
  }
}

function writeLastTeacherClassId(classId: string) {
  if (typeof window === "undefined" || !classId) return;
  try {
    window.localStorage.setItem(LAST_TEACHER_CLASS_KEY, classId);
  } catch {
    // best effort only
  }
}

function className(row?: ClassRow | null) {
  const name = safe(row?.name);
  return name || "Unnamed class";
}

function classYear(row?: ClassRow | null) {
  if (!row) return "";
  if (row.year_level == null) return "";
  if (row.year_level === 0) return "Kinder/Prep";
  return `Year ${row.year_level}`;
}

function studentName(row: StudentAttentionItem) {
  return safe(row.student_name) || "Learner";
}

function shortDate(value?: string | null) {
  const raw = safe(value);
  if (!raw) return "recently";
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  } catch {
    return raw.slice(0, 10);
  }
}

function toneChip(tone: "neutral" | "info" | "warning" | "success"): React.CSSProperties {
  const tones = {
    neutral: { bg: "#f8fafc", fg: "#475569", bd: "#e2e8f0" },
    info: { bg: "#eff6ff", fg: "#1d4ed8", bd: "#bfdbfe" },
    warning: { bg: "#fff7ed", fg: "#c2410c", bd: "#fdba74" },
    success: { bg: "#ecfdf5", fg: "#047857", bd: "#86efac" },
  };
  const t = tones[tone];
  return {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 30,
    padding: "0 10px",
    borderRadius: 999,
    border: `1px solid ${t.bd}`,
    background: t.bg,
    color: t.fg,
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  };
}

function classMomentum(score: number) {
  if (score >= 75) {
    return { label: "Steady rhythm", tone: "success" as const };
  }
  if (score >= 55) {
    return { label: "Building visibility", tone: "info" as const };
  }
  return { label: "Needs attention", tone: "warning" as const };
}

function classConfidence(analytics: ClassAnalytics | null) {
  if (!analytics || !analytics.studentAnalytics.length) {
    return { label: "Still forming", tone: "neutral" as const };
  }

  const avgConfidence = Math.round(
    analytics.studentAnalytics.reduce((sum, row) => sum + row.profileConfidence, 0) /
      analytics.studentAnalytics.length
  );

  if (avgConfidence >= 75) {
    return { label: "Confident view", tone: "success" as const };
  }
  if (avgConfidence >= 55) {
    return { label: "Taking shape", tone: "info" as const };
  }
  return { label: "Partial view", tone: "warning" as const };
}

function issueForStudent(row: StudentAttentionItem) {
  if (row.overdue_reviews > 0) {
    return row.overdue_reviews === 1
      ? "One support review is overdue."
      : `${row.overdue_reviews} support reviews are overdue.`;
  }
  if ((row.last_evidence_days ?? 999) > 21) {
    return "Recent evidence has gone quiet.";
  }
  if (row.open_interventions > 0) {
    return row.open_interventions === 1
      ? "There is one active support plan to check."
      : `${row.open_interventions} active support plans need a quick look.`;
  }
  if (row.status_label === "Attention") {
    return "Classroom visibility is still thin.";
  }
  if (row.is_ilp) {
    return "Keep ILP visibility current.";
  }
  return "A quick teacher check-in would help.";
}

function actionForStudent(row: StudentAttentionItem) {
  const text = safe(row.next_action);
  if (!text) return "Open learner";
  if (text.toLowerCase() === "add fresh evidence") return "Add fresh evidence";
  if (text.toLowerCase() === "review support plan") return "Review support plan";
  return text;
}

function buildFocusNext(analytics: ClassAnalytics | null) {
  if (!analytics) return null;

  const topStudent = analytics.attentionList[0];
  if (!analytics.students.length) {
    return {
      label: "Connect your first class",
      reason: "This dashboard becomes useful once students are visible here.",
      chip: "Open students",
      href: "/students",
    };
  }

  if (!analytics.evidence.length) {
    return {
      label: "Capture fresh class evidence",
      reason: "There is no recent class evidence yet, so visibility is still too thin.",
      chip: "Go to capture",
      href: "/capture",
    };
  }

  if (analytics.overdueReviewCount > 0 && topStudent) {
    return {
      label: `Review ${studentName(topStudent)}`,
      reason: issueForStudent(topStudent),
      chip: "Open learner",
      href: `/students/${topStudent.student_id}`,
    };
  }

  if (topStudent && topStudent.status_label !== "Stable") {
    return {
      label: `Check ${studentName(topStudent)}`,
      reason: issueForStudent(topStudent),
      chip: "Open learner",
      href: `/students/${topStudent.student_id}`,
    };
  }

  if (analytics.openInterventionCount > 0) {
    return {
      label: "Review support queue",
      reason: "There is active support work in the class that is worth checking before it drifts.",
      chip: "Check queue",
      href: "/teacher",
    };
  }

  return {
    label: "Keep class visibility steady",
    reason: "The class is in a calmer place right now, so one fresh capture is enough to keep momentum.",
    chip: "Capture next",
    href: "/capture",
  };
}

function buildSnapshot(analytics: ClassAnalytics | null) {
  if (!analytics) {
    return "Choose a class to start the teacher view.";
  }

  if (!analytics.students.length) {
    return `${className(analytics.klass)} does not have any visible students yet.`;
  }

  if (!analytics.evidence.length) {
    return `${className(analytics.klass)} has ${analytics.students.length} students, but no class evidence has been captured yet. Start with one or two priority learners.`;
  }

  const attentionCount = analytics.attentionList.filter((row) => row.status_label === "Attention").length;
  const watchCount = analytics.attentionList.filter((row) => row.status_label === "Watch").length;
  const freshCoverage = analytics.evidenceCoverage.filter((row) => row.days <= 14).length;

  return `${className(analytics.klass)} has ${analytics.students.length} students, ${attentionCount} needing close attention, ${watchCount} worth watching, and ${freshCoverage} coverage areas with reasonably fresh evidence.`;
}

function gentleNudge(analytics: ClassAnalytics | null) {
  if (!analytics) return "";
  if (!analytics.students.length) return "";
  if (!analytics.evidence.length) {
    return "One fresh evidence example from a priority learner is enough to make the week feel more visible.";
  }
  const topStudent = analytics.attentionList[0];
  if (topStudent && (topStudent.last_evidence_days ?? 0) > 21) {
    return `${studentName(topStudent)} has been quiet for a while. A quick check-in could settle the class picture.`;
  }
  if (analytics.overdueReviewCount > 0) {
    return "A short support-plan review now will usually make the rest of the week feel easier to manage.";
  }
  return "";
}

function supportQueue(analytics: ClassAnalytics | null) {
  if (!analytics) return [];

  const studentMap = new Map<string, StudentAnalytics>();
  analytics.studentAnalytics.forEach((row) => {
    if (row.student?.id) studentMap.set(row.student.id, row);
  });

  return analytics.attentionList
    .filter((row) => row.open_interventions > 0 || row.overdue_reviews > 0)
    .slice(0, 4)
    .map((row) => {
      const detail = studentMap.get(row.student_id);
      const reviewDate =
        detail?.overdueReviews[0]?.review_due_on ||
        detail?.overdueReviews[0]?.review_due_date ||
        detail?.openInterventions[0]?.next_review_on ||
        detail?.openInterventions[0]?.due_on ||
        null;

      return {
        id: row.student_id,
        name: studentName(row),
        text:
          row.overdue_reviews > 0
            ? `${row.overdue_reviews} review${row.overdue_reviews === 1 ? "" : "s"} overdue`
            : `${row.open_interventions} active support plan${row.open_interventions === 1 ? "" : "s"}`,
        due: reviewDate ? `Check by ${shortDate(reviewDate)}` : "Worth checking soon",
      };
    });
}

export default function TeacherDashboardPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classId, setClassId] = useState("");
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function hydrateClasses() {
      try {
        setLoading(true);
        setError("");

        const resp = await supabase
          .from("classes")
          .select("id,name,year_level,teacher_name,room")
          .order("year_level", { ascending: true })
          .order("name", { ascending: true });

        if (resp.error) throw resp.error;

        const rows = ((resp.data ?? []) as unknown) as ClassRow[];
        if (!mounted) return;
        setClasses(rows);

        const lastClassId = readLastTeacherClassId();
        const nextClassId =
          rows.find((row) => row.id === lastClassId)?.id ||
          rows[0]?.id ||
          "";
        setClassId(nextClassId);
      } catch (err: any) {
        if (!mounted) return;
        setError(String(err?.message || err || "Failed to load classes."));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrateClasses();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!classId) {
      setAnalytics(null);
      return;
    }

    async function hydrateAnalytics() {
      try {
        setAnalyticsLoading(true);
        setError("");
        const next = await loadClassAnalytics(classId);
        if (!mounted) return;
        setAnalytics(next);
        writeLastTeacherClassId(classId);
      } catch (err: any) {
        if (!mounted) return;
        setError(String(err?.message || err || "Failed to load class analytics."));
      } finally {
        if (mounted) setAnalyticsLoading(false);
      }
    }

    void hydrateAnalytics();
    return () => {
      mounted = false;
    };
  }, [classId]);

  const momentum = useMemo(
    () => classMomentum(analytics?.classHealthScore ?? 0),
    [analytics?.classHealthScore]
  );
  const confidence = useMemo(() => classConfidence(analytics), [analytics]);
  const focusNext = useMemo(() => buildFocusNext(analytics), [analytics]);
  const snapshot = useMemo(() => buildSnapshot(analytics), [analytics]);
  const nudge = useMemo(() => gentleNudge(analytics), [analytics]);
  const queue = useMemo(() => supportQueue(analytics), [analytics]);

  const priorityStudents = useMemo(
    () => (analytics?.attentionList ?? []).slice(0, 5),
    [analytics?.attentionList]
  );

  const recentActivity = useMemo(() => {
    if (!analytics?.evidence.length) return [];
    const nameMap = new Map(
      analytics.studentAnalytics
        .filter((row) => row.student?.id)
        .map((row) => [row.student!.id, safe(row.student?.preferred_name || row.student?.first_name) || "Learner"])
    );

    return analytics.evidence.slice(0, 4).map((row) => ({
      id: row.id,
      title: safe(row.title || row.summary || row.body) || "Learning moment",
      area: safe(row.learning_area) || "Learning",
      when: shortDate(row.occurred_on || row.created_at),
      learner: nameMap.get(safe(row.student_id)) || "Learner",
    }));
  }, [analytics]);

  return (
    <FamilyTopNavShell
      title="EduDecks Teacher"
      subtitle="Teacher Dashboard"
      hideHero={true}
    >
      <div style={{ display: "grid", gap: 18 }}>
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 22,
            background: "#ffffff",
            padding: 22,
            boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
            display: "grid",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
              alignItems: "start",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" }}>
                Teacher dashboard
              </div>
              <div style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 900, lineHeight: 1.05, color: "#0f172a" }}>
                {analytics?.klass ? className(analytics.klass) : "Class command centre"}
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.6, color: "#475569", maxWidth: 760 }}>
                {analytics?.klass
                  ? `${classYear(analytics.klass) || "Class view"} in focus. This page keeps class attention, recent visibility, and the next calm move easy to scan.`
                  : "Choose a class to see the clearest next move and where attention is most needed."}
              </div>
            </div>

            <div style={{ display: "grid", gap: 8, minWidth: 240 }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Class</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                style={{
                  minHeight: 44,
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  padding: "10px 12px",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0f172a",
                  background: "#ffffff",
                }}
              >
                {!classes.length ? <option value="">No classes found</option> : null}
                {classes.map((row) => (
                  <option key={row.id} value={row.id}>
                    {className(row)}{classYear(row) ? ` - ${classYear(row)}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {analytics?.students.length ? (
              <span style={toneChip("neutral")}>
                {analytics.students.length} student{analytics.students.length === 1 ? "" : "s"}
              </span>
            ) : null}
            <span style={toneChip(momentum.tone)}>{momentum.label}</span>
            <span style={toneChip(confidence.tone)}>{confidence.label}</span>
          </div>
        </section>

        {focusNext ? (
          <section
            style={{
              border: "1px solid #dbeafe",
              background: "linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%)",
              borderRadius: 20,
              padding: 20,
              display: "grid",
              gap: 10,
              boxShadow: "0 12px 30px rgba(15,23,42,0.04)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" }}>
              Focus next
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "start" }}>
              <div style={{ display: "grid", gap: 6, maxWidth: 760 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{focusNext.label}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "#334155" }}>{focusNext.reason}</div>
              </div>
              <Link
                href={focusNext.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 34,
                  padding: "0 12px",
                  borderRadius: 999,
                  background: "#1d4ed8",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                  boxShadow: "0 10px 22px rgba(29,78,216,0.18)",
                }}
              >
                {focusNext.chip}
              </Link>
            </div>
          </section>
        ) : null}

        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            background: "#ffffff",
            padding: 18,
            boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
            display: "grid",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" }}>
                Priority students
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                Learners most likely to need teacher attention next
              </div>
            </div>
          </div>

          {analyticsLoading ? (
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#64748b" }}>
              Refreshing class attention...
            </div>
          ) : priorityStudents.length ? (
            <div style={{ display: "grid", gap: 12 }}>
              {priorityStudents.map((row) => (
                <div
                  key={row.student_id}
                  style={{
                    border: "1px solid #eef2f7",
                    borderRadius: 16,
                    padding: 14,
                    background: "#ffffff",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start", flexWrap: "wrap" }}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{studentName(row)}</div>
                      <div style={{ fontSize: 13, lineHeight: 1.55, color: "#475569" }}>{issueForStudent(row)}</div>
                    </div>
                    <span style={toneChip(row.status_label === "Attention" ? "warning" : row.status_label === "Watch" ? "info" : "success")}>
                      {row.status_label}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ fontSize: 13, color: "#334155" }}>
                      Suggested action: <strong>{actionForStudent(row)}</strong>
                    </div>
                    <Link
                      href={`/students/${row.student_id}`}
                      style={{ color: "#1d4ed8", fontSize: 13, fontWeight: 800, textDecoration: "none" }}
                    >
                      Open learner
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#64748b" }}>
              No students stand out as urgent right now. The class looks reasonably settled.
            </div>
          )}
        </section>

        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            background: "#ffffff",
            padding: 18,
            boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" }}>
            Class snapshot
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.65, color: "#334155" }}>
            {loading ? "Building the class snapshot..." : snapshot}
          </div>
        </section>

        {recentActivity.length ? (
          <section
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 20,
              background: "#ffffff",
              padding: 18,
              boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
              display: "grid",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" }}>
                Recent activity
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                Recent classroom evidence worth keeping in view
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {recentActivity.map((row) => (
                <div
                  key={row.id}
                  style={{
                    border: "1px solid #eef2f7",
                    borderRadius: 14,
                    padding: 12,
                    background: "#ffffff",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{row.title}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
                    {row.learner} - {row.area} - {row.when}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {nudge ? (
          <section
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              background: "#f8fafc",
              padding: "14px 16px",
              fontSize: 13,
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            <span style={{ fontWeight: 800, color: "#0f172a" }}>Gentle nudge:</span> {nudge}
          </section>
        ) : null}

        {queue.length ? (
          <section
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 18,
              background: "#ffffff",
              padding: "16px 18px",
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" }}>
              Support queue
            </div>
            {queue.map((row) => (
              <div key={row.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{row.name}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: "#475569" }}>{row.text}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>{row.due}</div>
              </div>
            ))}
          </section>
        ) : null}

        {error ? (
          <section
            style={{
              border: "1px solid #fecaca",
              borderRadius: 18,
              background: "#fff1f2",
              padding: "14px 16px",
              fontSize: 13,
              lineHeight: 1.6,
              color: "#9f1239",
            }}
          >
            {error}
          </section>
        ) : null}
      </div>
    </FamilyTopNavShell>
  );
}
