"use client";

import React from "react";
import type { NumberOperationsProfile } from "@/lib/clean/assessments/placement/numberOperationsProfile";

const card: React.CSSProperties = {
  border: "1px solid #E1E6F0",
  borderRadius: 16,
  background: "#ffffff",
  padding: 16,
  display: "grid",
  gap: 8,
};

function bandLabel(result: NumberOperationsProfile["results"][number]) {
  if (result.status === "candidate-band" && result.lowerP && result.upperP) {
    return `P${result.lowerP}–P${result.upperP}`;
  }
  if (result.endpoint) {
    return result.endpoint.relation === "at-least"
      ? `At least P${result.endpoint.pLevel}`
      : `Below / around P${result.endpoint.pLevel}`;
  }
  return "Evidence captured";
}

export default function AssessmentNumberOperationsProfileCard({
  profile,
}: {
  profile: NumberOperationsProfile;
}) {
  return (
    <section
      style={{
        border: "1px solid #D9D0FF",
        borderRadius: 24,
        background: "#F8F5FF",
        padding: "clamp(20px, 4vw, 30px)",
        display: "grid",
        gap: 18,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <span
          style={{
            color: "#6C4DF6",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          MyLearna Mathematics · Number & Operations profile
        </span>
        <h2
          style={{
            margin: 0,
            color: "#17204B",
            fontSize: "clamp(28px, 4vw, 40px)",
          }}
        >
          A profile, not one averaged level
        </h2>
        <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.65 }}>
          {profile.overallStatement}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 12,
        }}
      >
        {profile.results.map((result) => (
          <article key={result.subElementKey} style={card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "start",
              }}
            >
              <strong style={{ color: "#17204B" }}>{result.subElementLabel}</strong>
              <span style={{ color: "#6C4DF6", fontWeight: 900 }}>
                {bandLabel(result)}
              </span>
            </div>
            <span style={{ color: "#5B6478", lineHeight: 1.55 }}>
              {result.interpretation}
            </span>
            <span
              style={{
                color:
                  result.confidence === "routing-only" ? "#92400E" : "#166534",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              {result.confidence === "routing-only"
                ? "Routing evidence · more evidence required"
                : "Provisional evidence band"}
            </span>
          </article>
        ))}
      </div>

      <div style={card}>
        <strong style={{ color: "#17204B" }}>Recommended next learning actions</strong>
        <div style={{ display: "grid", gap: 10 }}>
          {profile.recommendations.map((recommendation) => (
            <div
              key={recommendation.subElementKey}
              style={{
                borderTop: "1px solid #EEF2F7",
                paddingTop: 10,
                display: "grid",
                gap: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <strong style={{ color: "#17204B" }}>
                  {recommendation.subElementLabel}
                </strong>
                <span
                  style={{
                    color:
                      recommendation.kind === "verify-with-observation"
                        ? "#92400E"
                        : "#6C4DF6",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {recommendation.title}
                </span>
              </div>
              <span style={{ color: "#5B6478", lineHeight: 1.55 }}>
                {recommendation.rationale}
              </span>
              {recommendation.resourceLinkStatus === "not-yet-mapped" ? (
                <small style={{ color: "#64748B" }}>
                  Resource/Pathways link not mapped yet.
                </small>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <strong style={{ color: "#17204B" }}>Coverage</strong>
        <span style={{ color: "#5B6478" }}>
          {profile.assessedSubElements} of {profile.expectedSubElements} sub-elements
          have a reportable staff-lab result.
        </span>
        <span style={{ color: "#5B6478" }}>
          {profile.routingOnlyCount} result{profile.routingOnlyCount === 1 ? "" : "s"} are
          routing-only because the source construct requires stronger or observed
          evidence.
        </span>
      </div>

      <details style={card}>
        <summary style={{ cursor: "pointer", color: "#17204B", fontWeight: 850 }}>
          Next verification actions
        </summary>
        <ul style={{ margin: "8px 0 0", color: "#5B6478", lineHeight: 1.65 }}>
          {profile.nextChecks.map((check) => (
            <li key={check.subElementKey}>
              <strong>{check.subElementLabel}:</strong> {check.action}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
