"use client";

import Link from "next/link";
import React from "react";
import type { NumberOperationsParentUtility } from "@/lib/clean/assessments/placement/numberOperationsParentUtility";

const innerCard: React.CSSProperties = {
  border: "1px solid #E1E6F0",
  borderRadius: 16,
  background: "#FFFFFF",
  padding: 16,
  display: "grid",
  gap: 8,
};

const primaryLink: React.CSSProperties = {
  border: "1px solid #166534",
  borderRadius: 11,
  background: "#166534",
  color: "#FFFFFF",
  minHeight: 44,
  padding: "10px 14px",
  width: "fit-content",
  display: "inline-flex",
  alignItems: "center",
  textDecoration: "none",
  fontWeight: 850,
};

const secondaryLink: React.CSSProperties = {
  border: "1px solid #CBD5E1",
  borderRadius: 11,
  background: "#FFFFFF",
  color: "#17204B",
  minHeight: 42,
  padding: "9px 12px",
  width: "fit-content",
  display: "inline-flex",
  alignItems: "center",
  textDecoration: "none",
  fontWeight: 800,
};

function stateLabel(area: NumberOperationsParentUtility["areas"][number]) {
  switch (area.state) {
    case "verify-in-learning":
      return "Check with a practical example";
    case "strengthen-foundations":
      return "Foundation focus";
    case "extend":
      return "Extension";
    case "build-next":
      return "Next learning";
  }
}

function areaActions(
  area: NumberOperationsParentUtility["areas"][number],
  onActionSelected?: (
    area: NumberOperationsParentUtility["areas"][number]["subElementKey"],
    destination: "practice" | "my_pathways",
  ) => void,
) {
  const primaryDestination =
    area.actionHref.startsWith("/my-pathways")
      ? "my_pathways"
      : "practice";

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Link
        href={area.actionHref}
        prefetch={false}
        style={primaryLink}
        onClick={() =>
          onActionSelected?.(area.subElementKey, primaryDestination)
        }
      >
        {area.actionLabel}
      </Link>
      {area.pathwaysHref !== area.actionHref ? (
        <Link
          href={area.pathwaysHref}
          prefetch={false}
          style={secondaryLink}
          onClick={() => onActionSelected?.(area.subElementKey, "my_pathways")}
        >
          {area.pathwaysLabel}
        </Link>
      ) : null}
    </div>
  );
}

export default function AssessmentNumberOperationsParentUtilityCard({
  utility,
  onActionSelected,
}: {
  utility: NumberOperationsParentUtility;
  onActionSelected?: (
    area: NumberOperationsParentUtility["areas"][number]["subElementKey"],
    destination: "practice" | "my_pathways",
  ) => void;
}) {
  return (
    <section
      style={{
        border: "1px solid #CFE3D5",
        borderRadius: 24,
        background: "#F7FCF8",
        padding: "clamp(20px, 4vw, 30px)",
        display: "grid",
        gap: 18,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <span
          style={{
            color: "#166534",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: ".04em",
          }}
        >
          Number & Operations starting point
        </span>
        <h2
          style={{
            margin: 0,
            color: "#17204B",
            fontSize: "clamp(28px, 4vw, 40px)",
          }}
        >
          {utility.title}
        </h2>
        <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.65 }}>
          {utility.summary}
        </p>
      </div>

      {utility.startHere ? (
        <div
          style={{
            ...innerCard,
            borderColor: "#A7D7B4",
            background: "#F0FDF4",
          }}
        >
          <span
            style={{
              color: "#166534",
              fontSize: 12,
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            Start here
          </span>
          <strong style={{ color: "#17204B", fontSize: 20 }}>
            {utility.startHere.label}
          </strong>
          <span style={{ color: "#17204B", fontWeight: 850 }}>
            {utility.startHere.headline}
          </span>
          <span style={{ color: "#4B5563", lineHeight: 1.6 }}>
            {utility.startHere.explanation}
          </span>
          {areaActions(utility.startHere, onActionSelected)}
          {utility.startHere.recheckRecommended ? (
            <div
              style={{
                border: "1px solid #DCE8DF",
                borderRadius: 12,
                background: "#FAFFFB",
                padding: 11,
                display: "grid",
                gap: 4,
              }}
            >
              <strong style={{ color: "#17204B", fontSize: 13 }}>
                {utility.startHere.recheckPlan.headline}
              </strong>
              <span style={{ color: "#4B5563", fontSize: 12, lineHeight: 1.5 }}>
                {utility.startHere.recheckPlan.guidance}
              </span>
              <strong style={{ color: "#475569", fontSize: 12 }}>
                Fresh evidence to look for
              </strong>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  color: "#4B5563",
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {utility.startHere.recheckPlan.evidenceToLookFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 12,
        }}
      >
        {utility.areas
          .filter(
            (area) =>
              area.subElementKey !== utility.startHere?.subElementKey,
          )
          .map((area) => (
          <article key={area.subElementKey} style={innerCard}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "start",
              }}
            >
              <strong style={{ color: "#17204B" }}>{area.label}</strong>
              <span
                style={{
                  border: "1px solid #D8DEE9",
                  borderRadius: 999,
                  padding: "4px 8px",
                  color: "#475569",
                  fontSize: 11,
                  fontWeight: 850,
                }}
              >
                {stateLabel(area)}
              </span>
            </div>
            <span style={{ color: "#17204B", fontWeight: 800 }}>
              {area.headline}
            </span>
            <span style={{ color: "#4B5563", lineHeight: 1.55 }}>
              {area.explanation}
            </span>
            {areaActions(area, onActionSelected)}
            <details>
              <summary
                style={{
                  cursor: "pointer",
                  color: "#64748B",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Why MyLearna is suggesting this
              </summary>
              <div
                style={{
                  display: "grid",
                  gap: 5,
                  marginTop: 7,
                  color: "#64748B",
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                <span>{area.confidenceNote}</span>
                {area.curriculumContext ? <span>{area.curriculumContext}</span> : null}
                <details>
                  <summary
                    style={{
                      cursor: "pointer",
                      color: "#64748B",
                      fontWeight: 800,
                    }}
                  >
                    Technical evidence
                  </summary>
                  <span style={{ display: "block", marginTop: 4 }}>
                    Progression band: {area.technicalBand}
                  </span>
                </details>
                <span>{area.actionNote}</span>
                <span>{area.pathwaysNote}</span>
                <strong style={{ color: "#475569" }}>Fresh evidence to look for</strong>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {area.recheckPlan.evidenceToLookFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </details>
          </article>
        ))}
      </div>

      <div
        style={{
          borderTop: "1px solid #DCE8DF",
          paddingTop: 12,
          color: "#4B5563",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "#17204B" }}>
          {utility.assessedAreas} of {utility.expectedAreas} areas currently have a
          usable result.
        </strong>{" "}
        {utility.trustNote}
      </div>
    </section>
  );
}
