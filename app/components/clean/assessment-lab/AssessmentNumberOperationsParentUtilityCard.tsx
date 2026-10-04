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

export default function AssessmentNumberOperationsParentUtilityCard({
  utility,
}: {
  utility: NumberOperationsParentUtility;
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
          Parent utility prototype
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
          <Link
            href={utility.startHere.actionHref}
            prefetch={false}
            style={{
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
            }}
          >
            {utility.startHere.actionLabel}
          </Link>
          {utility.startHere.recheckRecommended ? (
            <small style={{ color: "#4B5563", lineHeight: 1.5 }}>
              After some learning, check this area again with fresh evidence rather
              than repeating the same questions.
            </small>
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
        {utility.areas.map((area) => (
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
            <Link
              href={area.actionHref}
              prefetch={false}
              style={{
                color: "#17204B",
                fontWeight: 850,
                width: "fit-content",
              }}
            >
              {area.actionLabel}
            </Link>
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
                <span>Technical evidence band: {area.technicalBand}</span>
                <span>{area.actionNote}</span>
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
