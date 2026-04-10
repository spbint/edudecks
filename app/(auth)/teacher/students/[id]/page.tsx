"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { loadStudentAnalytics } from "@/lib/analytics/class";
import { studentDisplayName } from "@/lib/analytics/helpers";
import type { StudentAnalytics } from "@/lib/analytics/types";

function chipStyle(
  tone: "neutral" | "info" | "warning" | "success"
): React.CSSProperties {
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

function panelStyle(): React.CSSProperties {
  return {
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    borderRadius: 22,
    padding: 20,
    display: "grid",
    gap: 14,
    boxShadow: "0 10px 26px rgba(15,23,42,0.04)",
  };
}

function priorityTone(status: StudentAnalytics["statusLabel"]) {
  if (status === "Attention") return "warning" as const;
  if (status === "Watch") return "info" as const;
  return "success" as const;
}

function confidenceTone(score: number) {
  if (score >= 75) return "success" as const;
  if (score >= 55) return "info" as const;
  if (score > 0) return "warning" as const;
  return "neutral" as const;
}

function learnerIssue(analytics: StudentAnalytics) {
  if (analytics.overdueReviews.length > 0) {
    return analytics.overdueReviews.length === 1
      ? "One support review is overdue, so this learner needs a quick check before that plan drifts."
      : `${analytics.overdueReviews.length} support reviews are overdue, so this learner needs a quick check before those plans drift.`;
  }
  if ((analytics.lastEvidenceDays ?? 999) > 21) {
    return `The last evidence is ${analytics.lastEvidenceDays} days old, so this learner has gone quiet in the class view.`;
  }
  if (analytics.openInterventions.length > 0) {
    return analytics.openInterventions.length === 1
      ? "There is one active support plan open, and it is worth checking whether the current support still fits."
      : `${analytics.openInterventions.length} active support plans are open, and it is worth checking whether the current support still fits.`;
  }
  if (analytics.statusLabel === "Watch") {
    return "Nothing looks urgent, but this learner still needs one clearer example to keep the class picture steady.";
  }
  return "This learner is in a steadier place right now, with enough current visibility for a calm review.";
}

function visibilitySummary(analytics: StudentAnalytics) {
  const evidenceCount = analytics.evidence.length;
  const recentDays = analytics.lastEvidenceDays;
  const confidence = Math.round(analytics.profileConfidence);

  if (!evidenceCount) {
    return "No recent evidence is visible yet. Start with one grounded example so the learner record has a clearer base.";
  }

  if ((recentDays ?? 999) > 21) {
    return `There are ${evidenceCount} evidence items on file, but the most recent one is from ${recentDays} days ago. A fresh example would make the picture easier to trust.`;
  }

  if (confidence < 55) {
    return `There are ${evidenceCount} evidence items on file, but the picture is still partial. A broader mix of recent examples would make this feel more settled.`;
  }

  if (confidence < 75) {
    return `There are ${evidenceCount} evidence items on file and the learner view is taking shape. One or two well-placed examples should make the picture stronger.`;
  }

  return `There are ${evidenceCount} evidence items on file and the learner view looks reasonably current. This is in a calmer place for now.`;
}

function nextTeacherActions(analytics: StudentAnalytics) {
  const actions: Array<{ label: string; href: string; tone: "primary" | "secondary" }> = [];

  if (analytics.evidence.length === 0) {
    actions.push({
      label: "Add the first evidence example",
      href: "/capture",
      tone: "primary",
    });
  } else if ((analytics.lastEvidenceDays ?? 999) > 21) {
    actions.push({
      label: "Add one fresh classroom example",
      href: "/capture",
      tone: "primary",
    });
  }

  if (analytics.student?.class_id) {
    const q = encodeURIComponent(studentDisplayName(analytics.student));
    actions.push({
      label:
        analytics.overdueReviews.length > 0 || analytics.openInterventions.length > 0
          ? "Check the current support plan"
          : "Open this learner in class interventions",
      href: `/classes/${analytics.student.class_id}/interventions?search=${q}`,
      tone: actions.length ? "secondary" : "primary",
    });
  }

  if (!actions.length) {
    actions.push({
      label: "Return to class triage",
      href: "/teacher",
      tone: "primary",
    });
  }

  return actions.slice(0, 2);
}

export default function TeacherStudentDetailPage() {
  const params = useParams<{ id: string }>();
  const studentId = String(params?.id ?? "").trim();

  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!studentId) {
        if (mounted) {
          setAnalytics(null);
          setError("Missing learner id.");
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setLoading(true);
        setError("");
      }

      try {
        const next = await loadStudentAnalytics(studentId);
        if (!mounted) return;
        setAnalytics(next);
      } catch (err) {
        if (!mounted) return;
        setAnalytics(null);
        setError(err instanceof Error ? err.message : "Unable to load learner detail.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, [studentId]);

  const learnerName = useMemo(
    () => studentDisplayName(analytics?.student),
    [analytics?.student]
  );
  const attentionReason = useMemo(
    () => (analytics ? learnerIssue(analytics) : ""),
    [analytics]
  );
  const visibility = useMemo(
    () => (analytics ? visibilitySummary(analytics) : ""),
    [analytics]
  );
  const actions = useMemo(() => (analytics ? nextTeacherActions(analytics) : []), [analytics]);
  const recentEvidence = useMemo(
    () => analytics?.evidence.slice(0, 4) ?? [],
    [analytics?.evidence]
  );

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {error ? (
        <section
          style={{
            ...panelStyle(),
            borderColor: "#fecaca",
            background: "#fff7f7",
            color: "#991b1b",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 900 }}>Learner view unavailable</div>
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>{error}</div>
        </section>
      ) : null}

      <section style={panelStyle()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              Learner detail
            </div>
            <div
              style={{
                fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)",
                fontWeight: 900,
                lineHeight: 1.05,
                color: "#0f172a",
              }}
            >
              {loading ? "Loading learner" : learnerName}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: "#475569" }}>
              {loading
                ? "Bringing the learner view into focus."
                : attentionReason}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Link
              href="/teacher"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 38,
                padding: "0 12px",
                borderRadius: 12,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#0f172a",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Back to class triage
            </Link>
          </div>
        </div>

        {analytics ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chipStyle(priorityTone(analytics.statusLabel))}>
              {analytics.statusLabel === "Stable" ? "Stable view" : analytics.statusLabel}
            </span>
            <span style={chipStyle(confidenceTone(Math.round(analytics.profileConfidence)))}>
              Confidence {Math.round(analytics.profileConfidence)}%
            </span>
            {analytics.klass?.name ? (
              <span style={chipStyle("neutral")}>
                {analytics.klass.name}
                {analytics.klass.year_level != null ? ` · Year ${analytics.klass.year_level}` : ""}
              </span>
            ) : null}
            {analytics.student?.is_ilp ? <span style={chipStyle("neutral")}>ILP</span> : null}
          </div>
        ) : null}
      </section>

      <section style={panelStyle()}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
          Why this learner needs attention now
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.65, color: "#475569" }}>
          {loading
            ? "Checking the most important signals for this learner."
            : attentionReason}
        </div>
      </section>

      <section style={panelStyle()}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
          Recent evidence and visibility
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.65, color: "#475569" }}>
          {loading ? "Reading the current visibility state." : visibility}
        </div>

        {recentEvidence.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {recentEvidence.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  padding: 14,
                  background: "#f8fafc",
                  display: "grid",
                  gap: 4,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                  {String(item.title ?? item.summary ?? item.body ?? "Untitled evidence").trim() ||
                    "Untitled evidence"}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
                  {item.learning_area ? `${item.learning_area} · ` : ""}
                  {item.occurred_on || item.created_at
                    ? new Date(item.occurred_on || item.created_at || "").toLocaleDateString(
                        "en-AU",
                        { day: "numeric", month: "short" }
                      )
                    : "Recent"}
                </div>
              </div>
            ))}
          </div>
        ) : analytics && !loading ? (
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 14,
              background: "#f8fafc",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            No recent evidence is visible yet for this learner.
          </div>
        ) : null}
      </section>

      {(analytics?.openInterventions.length || analytics?.overdueReviews.length) ? (
        <section style={panelStyle()}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
            Support context
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.65, color: "#475569" }}>
            {analytics.overdueReviews.length
              ? `There ${analytics.overdueReviews.length === 1 ? "is" : "are"} ${
                  analytics.overdueReviews.length
                } overdue review${analytics.overdueReviews.length === 1 ? "" : "s"} to bring back into view.`
              : analytics.openInterventions.length
                ? `There ${analytics.openInterventions.length === 1 ? "is" : "are"} ${
                    analytics.openInterventions.length
                  } active support plan${analytics.openInterventions.length === 1 ? "" : "s"} currently open for this learner.`
                : ""}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {analytics.overdueReviews.slice(0, 2).map((review) => (
              <div
                key={review.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  padding: 14,
                  background: "#fff7ed",
                  display: "grid",
                  gap: 4,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: "#9a3412" }}>
                  {String(review.title ?? review.strategy ?? "Support review").trim() ||
                    "Support review"}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.55, color: "#7c2d12" }}>
                  Due{" "}
                  {String(
                    review.review_due_on ||
                      review.review_due_date ||
                      review.next_review_on ||
                      review.due_on ||
                      ""
                  ).trim() || "soon"}
                </div>
              </div>
            ))}

            {!analytics.overdueReviews.length
              ? analytics.openInterventions.slice(0, 2).map((plan) => (
                  <div
                    key={plan.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 16,
                      padding: 14,
                      background: "#f8fafc",
                      display: "grid",
                      gap: 4,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                      {String(plan.title ?? plan.strategy ?? "Support plan").trim() ||
                        "Support plan"}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
                      {String(plan.status ?? "Open").trim() || "Open"}
                    </div>
                  </div>
                ))
              : null}
          </div>
        </section>
      ) : null}

      <section style={panelStyle()}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
          What to do next
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.65, color: "#475569" }}>
          Keep the next move small and concrete. One fresh example or one quick support check is usually enough to steady this learner view.
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 38,
                padding: "0 12px",
                borderRadius: 12,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 800,
                border:
                  action.tone === "primary"
                    ? "1px solid #1d4ed8"
                    : "1px solid #d1d5db",
                background: action.tone === "primary" ? "#1d4ed8" : "#ffffff",
                color: action.tone === "primary" ? "#ffffff" : "#0f172a",
              }}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
