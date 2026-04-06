"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { useAssessmentInsights } from "@/app/components/ReportSignalsPanel";

type StudentRow = {
  id: string;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  year_level?: number | null;
  yearLabel?: string | null;
};

type EvidenceRow = {
  id: string;
  title?: string | null;
  summary?: string | null;
  learning_area?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  note?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function studentDisplayName(student: StudentRow | null) {
  if (!student) return "This learner";
  const first = safe(student.preferred_name || student.first_name || "");
  const last = safe(student.surname || student.family_name || "");
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  return "This learner";
}

const layoutStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f5f7fb",
  padding: "32px 24px 64px",
};

const contentStyle: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: 20,
  boxShadow: "0 15px 45px rgba(15,23,42,0.08)",
  border: "1px solid #e5e7eb",
  padding: 24,
};

const wideGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr)",
  gap: 20,
};

const miniStatStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
  fontSize: 14,
};

const chipStyle = (tone: "green" | "blue" | "amber"): React.CSSProperties => {
  const map = {
    green: { bg: "#ecfdf5", bd: "#bbf7d0", color: "#166534" },
    blue: { bg: "#eff6ff", bd: "#bfdbfe", color: "#1d4ed8" },
    amber: { bg: "#fffbeb", bd: "#fde68a", color: "#92400e" },
  };
  const t = map[tone];
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 999,
    border: `1px solid ${t.bd}`,
    background: t.bg,
    color: t.color,
    fontWeight: 700,
    fontSize: 12,
    textTransform: "uppercase",
  };
};

const buttonStyle = (primary = false): React.CSSProperties => ({
  padding: "10px 16px",
  borderRadius: 12,
  border: `1px solid ${primary ? "#2563eb" : "#d1d5db"}`,
  background: primary ? "#2563eb" : "#ffffff",
  color: primary ? "#ffffff" : "#0f172a",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
});

const labelTextStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 1.05,
  textTransform: "uppercase",
  color: "#64748b",
};

const bodyTextStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.65,
  color: "#475569",
};

const headingStyle: React.CSSProperties = {
  fontSize: 18,
  lineHeight: 1.25,
  fontWeight: 900,
  color: "#0f172a",
};

const softCardStyle: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
  padding: 16,
};

export default function ChildProfilePage() {
  const params = useParams();
  const childId = params?.id;
  const [student, setStudent] = useState<StudentRow | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { readinessReport } = useAssessmentInsights(
    student?.id || childId,
    studentDisplayName(student),
    "parent_friendly"
  );

  useEffect(() => {
    if (!childId) return;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const [studentResp, evidenceResp] = await Promise.all([
          supabase
            .from("students")
            .select("id,preferred_name,first_name,surname,family_name,year_level,yearLabel")
            .eq("id", childId)
            .maybeSingle(),
          supabase
            .from("evidence_entries")
            .select("id,title,summary,body,learning_area,occurred_on,created_at,note")
            .eq("student_id", childId)
            .order("occurred_on", { ascending: false, nullsLast: false })
            .limit(6),
        ]);

        if (studentResp.error) throw studentResp.error;
        if (evidenceResp.error) throw evidenceResp.error;

        setStudent(studentResp.data || null);
        setEvidence(
          ((evidenceResp.data || []) as EvidenceRow[]).filter((row) => !row.is_deleted)
        );
      } catch (err: any) {
        setError(String(err?.message || err || "We could not load this learner right now."));
      } finally {
        setLoading(false);
      }
    })();
  }, [childId]);

  const heroYear = student?.yearLabel
    ? student.yearLabel
    : student?.year_level
    ? `Year ${student.year_level}`
    : null;

  const strongSubjects = readinessReport?.subjectReadiness
    .filter((item) => item.status === "Ready")
    .slice(0, 2);
  const focusSubjects = readinessReport?.subjectReadiness
    .filter((item) => item.status !== "Ready")
    .slice(0, 2);

  const recentEvidence = evidence.slice(0, 3);
  const readinessTone =
    readinessReport?.overallStatus === "Ready"
      ? "green"
      : readinessReport?.overallStatus === "Nearly Ready"
      ? "blue"
      : "amber";

  if (!childId) {
    return (
      <main style={layoutStyle}>
        <div style={contentStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>No learner selected</div>
            <p style={{ color: "#475569" }}>
              Choose a child from the family page to view their learner profile.
            </p>
            <Link href="/family" style={buttonStyle(true)}>
              Back to family
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={layoutStyle}>
      <div style={contentStyle}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase" }}>
                Learner profile
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a" }}>
                {studentDisplayName(student)}
              </div>
              {heroYear ? (
                <div style={{ fontSize: 14, color: "#475569", marginTop: 6 }}>{heroYear}</div>
              ) : null}
            </div>
            <div style={{ display: "inline-flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/portfolio" style={buttonStyle(false)}>
                Open portfolio
              </Link>
              <Link href="/reports" style={buttonStyle(true)}>
                Open reports
              </Link>
            </div>
          </div>
          <p style={{ color: "#475569", marginTop: 12 }}>
            {studentDisplayName(student)}'s profile brings readiness, strengths, and actions together so you can
            keep building with confidence.
          </p>
        </div>

        {error ? (
          <div style={cardStyle}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#be123c" }}>Oops</div>
            <p style={{ color: "#475569" }}>{error}</p>
          </div>
        ) : null}

        {loading ? (
          <div style={cardStyle}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Loading learner story…</div>
            <p style={{ color: "#475569" }}>We are gathering readiness, evidence, and next actions for this child.</p>
          </div>
        ) : (
          <>
            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ ...labelTextStyle, color: "#0f172a" }}>Readiness snapshot</div>
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 900 }}>{readinessReport?.overallStatus || "Preparing"}</div>
                      <p style={{ color: "#475569", marginTop: 4 }}>{readinessReport?.explanation}</p>
                    </div>
                    {readinessReport ? (
                      <span style={chipStyle(readinessTone)}>
                        {readinessReport.reportReady ? "Report ready" : "Still collecting"}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                    <div style={miniStatStyle}>
                      <span>Strong signal</span>
                      <strong>{strongSubjects?.[0]?.subjectName || "Emerging"}</strong>
                    </div>
                    <div style={miniStatStyle}>
                      <span>Needs attention</span>
                      <strong>{focusSubjects?.[0]?.subjectName || "Adding depth"}</strong>
                    </div>
                  </div>
                  {focusSubjects?.[0] ? (
                    <div style={{ fontSize: 13, color: "#475569" }}>
                      {focusSubjects[0].nextCapture}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <section style={cardStyle}>
              <div style={wideGrid}>
                <div>
                <div style={{ ...labelTextStyle, color: "#0f172a" }}>Recent evidence</div>
                  {recentEvidence.length ? (
                    <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                      {recentEvidence.map((item) => (
                        <div key={item.id} style={softCardStyle}>
                          <div style={{ fontWeight: 900, color: "#0f172a" }}>
                            {safe(item.title) || "Untitled learning moment"}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {safe(item.learning_area) || "General"} •{" "}
                            {formatDistanceToNowStrict(
                              parseISO(safe(item.occurred_on) || safe(item.created_at) || new Date().toISOString()),
                              { addSuffix: true }
                            )}
                          </div>
                          <p style={{ color: "#475569", marginTop: 6 }}>
                            {safe(item.summary) || safe(item.note) || "No additional summary yet."}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "#475569", marginTop: 12 }}>
                      No evidence has been captured yet. Start with a quick capture to begin the story.
                    </p>
                  )}
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={softCardStyle}>
                    <div style={labelTextStyle}>Portfolio coverage</div>
                    <div style={{ ...headingStyle, fontSize: 24, marginTop: 6 }}>Coverage grows with every capture</div>
                    <p style={{ ...bodyTextStyle, marginTop: 6 }}>
                      Review the portfolio to see how learning areas and subjects are represented.
                    </p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                      <Link href="/portfolio" style={buttonStyle(true)}>
                        View portfolio
                      </Link>
                      <Link
                        href={`/reports?studentId=${encodeURIComponent(student?.id || childId)}`}
                        style={buttonStyle(false)}
                      >
                        View reports
                      </Link>
                    </div>
                  </div>
                  <div style={softCardStyle}>
                    <div style={labelTextStyle}>What to do next</div>
                    <ul
                      style={{
                        margin: "8px 0 0 16px",
                        padding: 0,
                        listStyleType: "disc",
                        color: "#475569",
                        fontSize: 13,
                      }}
                    >
                      {readinessReport?.evidenceGaps.length ? (
                        readinessReport.evidenceGaps.slice(0, 3).map((gap) => (
                          <li key={gap.standardId} style={{ marginBottom: 6 }}>
                            {gap.officialCode} — {gap.reason}
                          </li>
                        ))
                      ) : (
                        <li style={{ marginBottom: 6 }}>Coverage is balanced; keep refreshing with new contexts.</li>
                      )}
                      {readinessReport?.captureGuidance.map((guidance, idx) => (
                        <li key={guidance || idx} style={{ marginBottom: 6 }}>
                          {guidance}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/capture?studentId=${encodeURIComponent(student?.id || childId)}`}
                      style={{ ...buttonStyle(true), marginTop: 12 }}
                    >
                      Capture next
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
