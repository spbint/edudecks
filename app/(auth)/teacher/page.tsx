"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loadClassAnalytics } from "@/lib/analytics/class";
import FamilyHandoffNote from "@/app/components/FamilyHandoffNote";
import type { ClassAnalytics, ClassRow } from "@/lib/analytics/types";
import {
  CROSS_ROLE_HANDOFF_QUERY_PARAM,
  buildTeacherLearnerHandoff,
  resolveCrossRoleHandoff,
  withCrossRoleHandoffQuery,
  writeCrossRoleHandoff,
} from "@/lib/crossRoleHandoff";
import {
  TEACHER_CLASS_CHANGED_EVENT,
  actionForStudent,
  buildTeacherGentleNudge,
  buildTeacherSnapshot,
  buildTeacherSupportQueue,
  issueForStudent,
  loadTeacherClasses,
  readLastTeacherClassId,
  setTeacherClassId,
  shortDate,
  studentName,
  teacherStudentHref,
} from "@/lib/teacherWorkspace";

const pageStyles = {
  stack: {
    display: "grid",
    gap: 18,
  } satisfies React.CSSProperties,
  section: {
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    borderRadius: 22,
    padding: 20,
    display: "grid",
    gap: 14,
    boxShadow: "0 10px 26px rgba(15,23,42,0.04)",
  } satisfies React.CSSProperties,
  sectionTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: "#0f172a",
  } satisfies React.CSSProperties,
  sectionBody: {
    fontSize: 14,
    lineHeight: 1.65,
    color: "#475569",
  } satisfies React.CSSProperties,
  softCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 16,
    background: "#f8fafc",
    display: "grid",
    gap: 8,
  } satisfies React.CSSProperties,
  quietNote: {
    border: "1px solid #dbeafe",
    borderRadius: 16,
    padding: "14px 16px",
    background: "linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%)",
    fontSize: 14,
    lineHeight: 1.6,
    color: "#334155",
  } satisfies React.CSSProperties,
};

function resolveClassLabel(row: ClassRow | null) {
  if (!row) return "this class";
  const name = String(row.name ?? "").trim();
  return name || "this class";
}

export default function TeacherDashboardPage() {
  const searchParams = useSearchParams();
  const [classId, setClassId] = useState("");
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const leadershipHandoff = useMemo(
    () =>
      resolveCrossRoleHandoff({
        intentValue: searchParams?.get(CROSS_ROLE_HANDOFF_QUERY_PARAM),
        expectedHref: "/teacher",
        expectedToRole: "teacher",
      }),
    [searchParams]
  );

  useEffect(() => {
    let mounted = true;

    async function hydrateClassId() {
      const stored = readLastTeacherClassId();
      if (stored) {
        if (mounted) setClassId(stored);
        return;
      }

      try {
        const rows = await loadTeacherClasses();
        if (!mounted) return;
        setClassId(rows[0]?.id ?? "");
      } catch {
        if (!mounted) return;
        setClassId("");
      }
    }

    void hydrateClassId();

    function handleClassChange(event: Event) {
      const detail = (event as CustomEvent<{ classId?: string }>).detail;
      const nextClassId = String(detail?.classId ?? "").trim();
      setClassId(nextClassId);
    }

    window.addEventListener(TEACHER_CLASS_CHANGED_EVENT, handleClassChange as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener(
        TEACHER_CLASS_CHANGED_EVENT,
        handleClassChange as EventListener
      );
    };
  }, []);

  useEffect(() => {
    const handoffClassId = leadershipHandoff?.contextId || "";
    if (!handoffClassId || handoffClassId === classId) return;
    setClassId(handoffClassId);
    setTeacherClassId(handoffClassId);
  }, [classId, leadershipHandoff?.contextId]);

  useEffect(() => {
    let mounted = true;

    async function hydrateAnalytics() {
      if (!classId) {
        if (mounted) {
          setAnalytics(null);
          setLoading(false);
          setError("");
        }
        return;
      }

      if (mounted) {
        setLoading(true);
        setError("");
      }

      try {
        const next = await loadClassAnalytics(classId);
        if (!mounted) return;
        setAnalytics(next);
      } catch (err) {
        if (!mounted) return;
        setAnalytics(null);
        setError(err instanceof Error ? err.message : "Unable to load class view.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrateAnalytics();
    return () => {
      mounted = false;
    };
  }, [classId]);

  const priorityStudents = useMemo(
    () => analytics?.attentionList.slice(0, 5) ?? [],
    [analytics?.attentionList]
  );

  const recentActivity = useMemo(() => {
    if (!analytics) return [];

    const learnerMap = new Map(
      analytics.studentAnalytics.map((row) => [
        row.student?.id ?? "",
        studentName({
          student_id: row.student?.id ?? "",
          student_name:
            row.student?.preferred_name ||
            row.student?.first_name ||
            row.student?.family_name ||
            row.student?.surname ||
            "",
          class_id: row.student?.class_id ?? null,
          attention_score: row.attentionScore,
          status_label: row.statusLabel,
          last_evidence_days: row.lastEvidenceDays,
          overdue_reviews: row.overdueReviews.length,
          open_interventions: row.openInterventions.length,
          next_action: row.nextAction,
          is_ilp: !!row.student?.is_ilp,
        }),
      ])
    );

    return analytics.evidence.slice(0, 4).map((item) => ({
      id: item.id,
      title: String(item.title ?? item.summary ?? "Untitled evidence").trim() || "Untitled evidence",
      learningArea: String(item.learning_area ?? "").trim(),
      studentName: learnerMap.get(String(item.student_id ?? "")) || "Learner",
      occurredOn: shortDate(item.occurred_on || item.created_at),
    }));
  }, [analytics]);

  const snapshot = useMemo(() => buildTeacherSnapshot(analytics), [analytics]);
  const gentleNudge = useMemo(() => buildTeacherGentleNudge(analytics), [analytics]);
  const supportQueue = useMemo(() => buildTeacherSupportQueue(analytics), [analytics]);

  return (
    <div style={pageStyles.stack}>
      {error ? (
        <section
          style={{
            ...pageStyles.section,
            borderColor: "#fecaca",
            background: "#fff7f7",
            color: "#991b1b",
          }}
        >
          <div style={pageStyles.sectionTitle}>Class view unavailable</div>
          <div style={pageStyles.sectionBody}>{error}</div>
        </section>
      ) : null}

      <FamilyHandoffNote handoff={leadershipHandoff} acted={false} marginBottom={2} />

      <section style={pageStyles.section}>
        <div style={pageStyles.sectionTitle}>Priority students</div>
        <div style={pageStyles.sectionBody}>
          {loading
            ? "Loading the class triage view."
            : priorityStudents.length
              ? `Start with the few learners most likely to benefit from a quick teacher check-in in ${resolveClassLabel(
                  analytics?.klass ?? null
                )}.`
              : "No urgent learners are standing out right now."}
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {priorityStudents.map((student) => (
            (() => {
              const handoff = buildTeacherLearnerHandoff({
                learnerId: student.student_id,
                learnerName: studentName(student),
                reason: issueForStudent(student),
              });
              const href = withCrossRoleHandoffQuery(
                teacherStudentHref(student.student_id),
                handoff
              );

              return (
            <Link
              key={student.student_id}
              href={href}
              onClick={() => writeCrossRoleHandoff(handoff)}
              style={{
                ...pageStyles.softCard,
                textDecoration: "none",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "start",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                    {studentName(student)}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
                    {issueForStudent(student)}
                  </div>
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: 28,
                    padding: "0 10px",
                    borderRadius: 999,
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.2,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {actionForStudent(student)}
                </div>
              </div>
            </Link>
              );
            })()
          ))}

          {!loading && !priorityStudents.length ? (
            <div style={pageStyles.softCard}>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: "#475569" }}>
                The class picture is relatively settled. One fresh capture or quick support review is enough for now.
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section style={pageStyles.section}>
        <div style={pageStyles.sectionTitle}>Class snapshot</div>
        <div style={pageStyles.sectionBody}>{loading ? "Preparing the class summary." : snapshot}</div>
      </section>

      {recentActivity.length ? (
        <section style={pageStyles.section}>
          <div style={pageStyles.sectionTitle}>Recent activity</div>
          <div style={pageStyles.sectionBody}>
            A quick scan of the most recent learning evidence across the class.
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {recentActivity.map((item) => (
              <div key={item.id} style={pageStyles.softCard}>
                <div style={{ display: "grid", gap: 3 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{item.title}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
                    {item.studentName}
                    {item.learningArea ? ` · ${item.learningArea}` : ""}
                    {item.occurredOn ? ` · ${item.occurredOn}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {gentleNudge ? (
        <section style={pageStyles.quietNote}>
          <span style={{ fontWeight: 800, color: "#0f172a" }}>Teacher note:</span> {gentleNudge}
        </section>
      ) : null}

      {supportQueue.length ? (
        <section style={pageStyles.section}>
          <div style={pageStyles.sectionTitle}>Support queue</div>
          <div style={pageStyles.sectionBody}>
            A short list of support items that are worth checking before they drift.
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {supportQueue.map((item) => (
              (() => {
                const handoff = buildTeacherLearnerHandoff({
                  learnerId: item.id,
                  learnerName: item.name,
                  reason: item.text,
                });
                const href = withCrossRoleHandoffQuery(
                  teacherStudentHref(item.id),
                  handoff
                );

                return (
              <Link
                key={item.id}
                href={href}
                onClick={() => writeCrossRoleHandoff(handoff)}
                style={{
                  ...pageStyles.softCard,
                  textDecoration: "none",
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "start",
                  }}
                >
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
                      {item.text}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>{item.due}</div>
                </div>
              </Link>
                );
              })()
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
