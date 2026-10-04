"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import AssessmentNumberOperationsBaselineRunner from "@/app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner";
import { trackCoreJourneyEvent } from "@/lib/clean/analytics/productAnalytics";
import {
  MATHS_STARTING_POINT_RELEASE,
  assertMathsStartingPointStaffPreviewSafety,
} from "@/lib/clean/assessments/mathsStartingPointRelease";

const card: React.CSSProperties = {
  border: "1px solid #DDE4EE",
  borderRadius: 20,
  background: "#FFFFFF",
  padding: "clamp(18px, 4vw, 26px)",
  display: "grid",
  gap: 12,
};

export default function MathsStartingPointWorkspace() {
  const {
    workspace,
    activeLearner,
    loading,
    setActiveLearner,
  } = useFamilyWorkspace();

  assertMathsStartingPointStaffPreviewSafety();

  useEffect(() => {
    if (loading) return;
    trackCoreJourneyEvent(
      "maths_starting_point_opened",
      {
        route: "/assessments/maths-starting-point",
        area: "maths_starting_point",
        featureArea: "assessment",
        subjectKey: "mathematics",
        hasLearner: Boolean(activeLearner),
        hasMultipleLearners: workspace.learners.length > 1,
        presentation: MATHS_STARTING_POINT_RELEASE.phase,
      },
      workspace.userId,
    );
  }, [
    activeLearner?.id,
    loading,
    workspace.learners.length,
    workspace.userId,
  ]);

  if (loading) {
    return (
      <div style={card} role="status">
        Loading learner details...
      </div>
    );
  }

  if (!workspace.learners.length || !activeLearner) {
    return (
      <div style={card}>
        <strong style={{ color: "#17204B", fontSize: 18 }}>
          Add a learner before starting the Maths check
        </strong>
        <span style={{ color: "#4B5563", lineHeight: 1.6 }}>
          The starting point belongs to one learner, so MyLearna needs a learner profile first.
        </span>
        <Link
          href="/my-profile"
          style={{
            width: "fit-content",
            borderRadius: 10,
            background: "#17204B",
            color: "#FFFFFF",
            padding: "10px 14px",
            textDecoration: "none",
            fontWeight: 800,
          }}
        >
          Open My Profile
        </Link>
      </div>
    );
  }

  return (
    <section style={{ display: "grid", gap: 18 }}>
      <div style={card}>
        <span
          style={{
            color: "#166534",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          Learner
        </span>
        {workspace.learners.length > 1 ? (
          <label style={{ display: "grid", gap: 6, maxWidth: 420 }}>
            <strong style={{ color: "#17204B" }}>Who is doing this check?</strong>
            <select
              value={activeLearner.id}
              onChange={(event) => setActiveLearner(event.target.value)}
              style={{
                minHeight: 44,
                border: "1px solid #CBD5E1",
                borderRadius: 10,
                padding: "8px 10px",
                background: "#FFFFFF",
                color: "#17204B",
                font: "inherit",
              }}
            >
              {workspace.learners.map((learner) => (
                <option key={learner.id} value={learner.id}>
                  {learner.label}
                  {learner.yearLabel ? ` · ${learner.yearLabel}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <strong style={{ color: "#17204B", fontSize: 18 }}>
            {activeLearner.label}
            {activeLearner.yearLabel ? ` · ${activeLearner.yearLabel}` : ""}
          </strong>
        )}
        <span style={{ color: "#4B5563", lineHeight: 1.55 }}>
          Results and next-step links in this preview stay attached to the selected learner context. The assessment itself is still not written to the database.
        </span>
      </div>

      <AssessmentNumberOperationsBaselineRunner
        key={activeLearner.id}
        learnerId={activeLearner.id}
        learnerName={activeLearner.label}
        mode="parent-preview"
        userId={workspace.userId}
      />
    </section>
  );
}
