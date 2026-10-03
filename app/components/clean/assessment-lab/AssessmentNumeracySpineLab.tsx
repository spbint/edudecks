"use client";

import React from "react";
import {
  NUMERACY_PROGRESSION_ELEMENTS,
  NUMERACY_PROGRESSION_SOURCE,
  NUMERACY_PROGRESSION_SUB_ELEMENTS,
  getNumeracyImplementationSummary,
} from "@/lib/clean/assessments/placement/numeracyProgressionRegistry";

const card: React.CSSProperties = {
  border: "1px solid #E1E6F0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 18,
  display: "grid",
  gap: 12,
};

export default function AssessmentNumeracySpineLab() {
  const summary = getNumeracyImplementationSummary();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F8FC",
        padding: "clamp(18px, 4vw, 42px)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gap: 18,
        }}
      >
        <section style={{ ...card, background: "#F8F5FF" }}>
          <span
            style={{
              color: "#6C4DF6",
              fontSize: 12,
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            Internal assessment architecture
          </span>
          <h1
            style={{
              margin: 0,
              color: "#17204B",
              fontSize: "clamp(30px, 5vw, 46px)",
            }}
          >
            Complete numeracy progression spine
          </h1>
          <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.65 }}>
            {summary.elementCount} source elements · {summary.subElementCount} sub-elements ·{" "}
            {summary.firstSliceCount} Number first-slice lanes ·{" "}
            {summary.crossStrandProofCount} cross-strand adaptive proof ·{" "}
            {summary.blueprintNextCount} next lanes.
          </p>
          <small style={{ color: "#64748B", lineHeight: 1.5 }}>
            Source: {NUMERACY_PROGRESSION_SOURCE.authority} ·{" "}
            {NUMERACY_PROGRESSION_SOURCE.curriculumVersion} ·{" "}
            {NUMERACY_PROGRESSION_SOURCE.publication}. This page describes the measurement spine,
            not a claim that all 14 sub-elements are already assessment-ready.
          </small>
        </section>

        {NUMERACY_PROGRESSION_ELEMENTS.map((element) => {
          const items = NUMERACY_PROGRESSION_SUB_ELEMENTS.filter(
            (item) => item.elementKey === element.key,
          );

          return (
            <section key={element.key} style={card}>
              <div style={{ display: "grid", gap: 4 }}>
                <span
                  style={{
                    color: "#6C4DF6",
                    fontSize: 12,
                    fontWeight: 900,
                    textTransform: "uppercase",
                  }}
                >
                  Source table · page {element.sourceTablePage}
                </span>
                <h2 style={{ margin: 0, color: "#17204B" }}>{element.label}</h2>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: 12,
                }}
              >
                {items.map((item) => (
                  <article
                    key={item.key}
                    style={{
                      border: "1px solid #E7EAF2",
                      borderRadius: 16,
                      padding: 14,
                      display: "grid",
                      gap: 8,
                      background:
                        item.implementation === "adaptive-first-slice"
                          ? "#F0FDF4"
                          : item.implementation === "adaptive-cross-strand-proof"
                            ? "#EEF4FF"
                            : "#FBFCFF",
                    }}
                  >
                    <strong style={{ color: "#17204B" }}>{item.label}</strong>
                    <span style={{ color: "#5B6478" }}>
                      Progression P{item.minP}–P{item.maxP}
                    </span>
                    <span
                      style={{
                        color:
                          item.implementation === "adaptive-first-slice"
                            ? "#166534"
                            : item.implementation === "adaptive-cross-strand-proof"
                              ? "#1D4ED8"
                              : "#64748B",
                        fontSize: 12,
                        fontWeight: 900,
                        textTransform: "uppercase",
                      }}
                    >
                      {item.implementation === "adaptive-first-slice"
                        ? "Adaptive first slice implemented"
                        : item.implementation === "adaptive-cross-strand-proof"
                          ? "Adaptive cross-strand proof implemented"
                          : "Blueprint next"}
                    </span>
                    <small style={{ color: "#64748B" }}>
                      Source pages {item.sourcePages.join(", ")}
                    </small>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        <section style={{ ...card, background: "#FFFDF5" }}>
          <strong style={{ color: "#92400E" }}>Expansion rule</strong>
          <p style={{ margin: 0, color: "#6B4F1D", lineHeight: 1.6 }}>
            Do not mass-author the remaining seven lanes from their level labels alone. For each
            sub-element, first audit the observable source indicators, classify direct versus
            observed/practical evidence, choose anchor levels, define trusted visual requirements,
            then author the smallest routing bank that can prove the engine.
          </p>
        </section>
      </div>
    </main>
  );
}
