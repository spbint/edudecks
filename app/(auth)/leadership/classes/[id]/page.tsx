"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  buildLeadershipTeacherHandoff,
  withCrossRoleHandoffQuery,
  writeCrossRoleHandoff,
} from "@/lib/crossRoleHandoff";
import { loadClassAnalytics } from "@/lib/analytics/class";
import type { ClassAnalytics } from "@/lib/analytics/types";
import { setTeacherClassId } from "@/lib/teacherWorkspace";

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

function classMomentum(score: number) {
  if (score >= 75) return { label: "Steady overview", tone: "success" as const };
  if (score >= 55) return { label: "Watchful rhythm", tone: "info" as const };
  return { label: "Needs attention", tone: "warning" as const };
}

function classConfidence(analytics: ClassAnalytics) {
  const freshCoverage = analytics.evidenceCoverage.filter((row) => row.days <= 14).length;
  if (freshCoverage >= 4 && analytics.overdueReviewCount === 0) {
    return { label: "Confident view", tone: "success" as const };
  }
  if (freshCoverage >= 2) {
    return { label: "Taking shape", tone: "info" as const };
  }
  return { label: "Partial visibility", tone: "warning" as const };
}

function classReason(analytics: ClassAnalytics) {
  if (analytics.overdueReviewCount > 0) {
    return analytics.overdueReviewCount === 1
      ? "One review is overdue in this class, so support pressure may drift if it is left alone."
      : `${analytics.overdueReviewCount} reviews are overdue in this class, so support pressure may drift if they are left alone.`;
  }
  if (!analytics.evidence.length) {
    return "No recent class evidence is visible yet, so the leadership picture is still too thin to trust.";
  }
  const staleCoverage = analytics.evidenceCoverage.filter((row) => row.days > 30).length;
  if (staleCoverage >= 2) {
    return `${staleCoverage} coverage areas are stale, so this class needs a visibility reset before it drifts further.`;
  }
  if (analytics.openInterventionCount > 0) {
    return analytics.openInterventionCount === 1
      ? "There is one active intervention open, and it is worth checking whether support is still moving as expected."
      : `${analytics.openInterventionCount} active interventions are open, and it is worth checking whether support is still moving as expected.`;
  }
  return "This class is not urgent, but it still benefits from a calm leadership check-in while visibility is stable.";
}

function classVisibility(analytics: ClassAnalytics) {
  const freshCoverage = analytics.evidenceCoverage.filter((row) => row.days <= 14).length;

  if (!analytics.evidence.length) {
    return `There are ${analytics.students.length} learners in this class, but no recent evidence is visible yet. One grounded class-level evidence push would make the picture clearer.`;
  }

  if (analytics.evidenceCoverage.every((row) => row.days > 30)) {
    return `There are ${analytics.evidence.length} evidence items on file, but all tracked coverage areas are stale. A fresh class example would make this view easier to trust.`;
  }

  if (freshCoverage <= 1) {
    return `There are ${analytics.evidence.length} evidence items on file, but only ${freshCoverage} coverage area is reasonably fresh. The class picture is still narrow.`;
  }

  if (freshCoverage <= 3) {
    return `There are ${analytics.evidence.length} evidence items on file and ${freshCoverage} coverage areas are reasonably fresh. The class view is taking shape, but not evenly yet.`;
  }

  return `There are ${analytics.evidence.length} evidence items on file and ${freshCoverage} coverage areas are reasonably fresh. This class is in a calmer place for now.`;
}

function nextClassActions(analytics: ClassAnalytics) {
  const actions: Array<{ label: string; href: string; tone: "primary" | "secondary" }> = [];
  const classId = analytics.klass?.id ?? "";

  actions.push({
    label:
      !analytics.evidence.length || analytics.evidenceCoverage.filter((row) => row.days <= 14).length <= 1
        ? "Open this class in teacher view"
        : analytics.overdueReviewCount > 0 || analytics.openInterventionCount > 0
          ? "Open this class in teacher view"
          : "Check this class in teacher view",
    href: "/teacher",
    tone: "primary",
  });

  if (classId && (analytics.overdueReviewCount > 0 || analytics.openInterventionCount > 0)) {
    actions.push({
      label: "Review class interventions",
      href: `/classes/${classId}/interventions`,
      tone: actions.length ? "secondary" : "primary",
    });
  }

  if (actions.length === 1 && classId) {
    actions.push({
      label: "Open class overview",
      href: `/classes/${classId}`,
      tone: "secondary",
    });
  }

  return actions.slice(0, 2);
}

export default function LeadershipClassDetailPage() {
  const params = useParams<{ id: string }>();
  const classId = String(params?.id ?? "").trim();

  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!classId) {
        if (mounted) {
          setAnalytics(null);
          setError("Missing class id.");
          setLoading(false);
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
        setError(err instanceof Error ? err.message : "Unable to load class detail.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, [classId]);

  const momentum = useMemo(
    () => classMomentum(analytics?.classHealthScore ?? 0),
    [analytics?.classHealthScore]
  );
  const confidence = useMemo(
    () => (analytics ? classConfidence(analytics) : { label: "Still forming", tone: "neutral" as const }),
    [analytics]
  );
  const reason = useMemo(() => (analytics ? classReason(analytics) : ""), [analytics]);
  const visibility = useMemo(() => (analytics ? classVisibility(analytics) : ""), [analytics]);
  const actions = useMemo(() => (analytics ? nextClassActions(analytics) : []), [analytics]);
  const leadershipToTeacherHandoff = useMemo(
    () =>
      analytics?.klass?.id
        ? buildLeadershipTeacherHandoff({
            classId: analytics.klass.id,
            className: analytics.klass.name || "this class",
            reason,
            href: "/teacher",
          })
        : null,
    [analytics?.klass?.id, analytics?.klass?.name, reason]
  );
  const recentCoverage = useMemo(
    () => analytics?.evidenceCoverage.slice(0, 5) ?? [],
    [analytics?.evidenceCoverage]
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
          <div style={{ fontSize: 16, fontWeight: 900 }}>Class view unavailable</div>
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
              Class detail
            </div>
            <div
              style={{
                fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)",
                fontWeight: 900,
                lineHeight: 1.05,
                color: "#0f172a",
              }}
            >
              {loading ? "Loading class" : analytics?.klass?.name || "Class detail"}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: "#475569" }}>
              {loading ? "Bringing the class view into focus." : reason}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Link
              href="/leadership"
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
              Back to leadership command centre
            </Link>
          </div>
        </div>

        {analytics ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chipStyle(momentum.tone)}>{momentum.label}</span>
            <span style={chipStyle(confidence.tone)}>{confidence.label}</span>
            <span style={chipStyle("neutral")}>
              {analytics.students.length} learner{analytics.students.length === 1 ? "" : "s"}
            </span>
            {analytics.klass?.year_level != null ? (
              <span style={chipStyle("neutral")}>Year {analytics.klass.year_level}</span>
            ) : null}
          </div>
        ) : null}
      </section>

      <section style={panelStyle()}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
          Why this class needs attention now
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.65, color: "#475569" }}>
          {loading ? "Checking the most important class-level signals." : reason}
        </div>
      </section>

      <section style={panelStyle()}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
          Recent evidence and visibility
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.65, color: "#475569" }}>
          {loading ? "Reading the class visibility picture." : visibility}
        </div>

        {recentCoverage.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {recentCoverage.map((row) => (
              <div
                key={row.label}
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
                  {row.label}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.55, color: "#475569" }}>
                  {row.days <= 14
                    ? `${row.days} days since the last reasonably fresh example.`
                    : `${row.days} days since the last example, so this area is drifting out of view.`}
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
            No class-level coverage is visible yet.
          </div>
        ) : null}
      </section>

      {(analytics?.overdueReviewCount || analytics?.openInterventionCount) ? (
        <section style={panelStyle()}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
            Review and support context
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.65, color: "#475569" }}>
            {analytics.overdueReviewCount
              ? `${analytics.overdueReviewCount} review${analytics.overdueReviewCount === 1 ? "" : "s"} are overdue in this class.`
              : `${analytics.openInterventionCount} active intervention${analytics.openInterventionCount === 1 ? "" : "s"} are open in this class.`}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {analytics.overdueReviewCount ? (
              <span style={chipStyle("warning")}>
                {analytics.overdueReviewCount} overdue review{analytics.overdueReviewCount === 1 ? "" : "s"}
              </span>
            ) : null}
            {analytics.openInterventionCount ? (
              <span style={chipStyle("info")}>
                {analytics.openInterventionCount} active intervention{analytics.openInterventionCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      <section style={panelStyle()}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
          What to do next
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.65, color: "#475569" }}>
          Keep the next move small and concrete. One visibility reset or one support review is usually enough to steady the class picture.
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {actions.map((action) => (
            <Link
              key={`${action.href}:${action.label}`}
              href={
                action.href === "/teacher"
                  ? withCrossRoleHandoffQuery(action.href, leadershipToTeacherHandoff)
                  : action.href
              }
              onClick={() => {
                if (action.href === "/teacher" && analytics?.klass?.id) {
                  setTeacherClassId(analytics.klass.id);
                  writeCrossRoleHandoff(leadershipToTeacherHandoff);
                }
              }}
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
