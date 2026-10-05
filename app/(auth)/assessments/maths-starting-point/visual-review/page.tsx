import type { Metadata } from "next";
import React from "react";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import { AssessmentStimulus } from "@/lib/clean/assessments/visualTemplates/AssessmentStimulus";
import {
  NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY,
} from "@/lib/clean/assessments/placement/numberOperationsItemRegistry";
import {
  getNumberOperationsItemReviewFlags,
  numberOperationsItemReviewFlagLabel,
} from "@/lib/clean/assessments/placement/numberOperationsItemReviewFlags";

export const metadata: Metadata = {
  title: "Starting Point Visual Review | MyLearna",
  description:
    "Staff-only phone-frame review of score-bearing visuals used by the Number & Operations starting-point utility.",
  robots: { index: false, follow: false },
};

const panel: React.CSSProperties = {
  border: "1px solid #E1E6F0",
  borderRadius: 18,
  background: "#FFFFFF",
  padding: 16,
  display: "grid",
  gap: 10,
  boxSizing: "border-box",
};

export default function MathsStartingPointVisualReviewPage() {
  const visualItems = NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.filter(
    (entry) => entry.item.stimulus.type !== "none",
  );

  return (
    <AssessmentAccessGate mode="lab">
      <main
        style={{
          minHeight: "100vh",
          background: "#F7F8FC",
          padding: "clamp(18px, 4vw, 42px)",
        }}
      >
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            display: "grid",
            gap: 18,
          }}
        >
          <section style={panel}>
            <span
              style={{
                color: "#92400E",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              Staff-only visual QA
            </span>
            <h1 style={{ margin: 0, color: "#17204B" }}>
              Customer-route score-bearing visuals
            </h1>
            <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.6 }}>
              Review all {visualItems.length} visual-dependent customer-route items
              in a strict 390px phone frame. This page is read-only and does not
              approve assets or publish items.
            </p>
          </section>

          {visualItems.map((entry) => {
            const flags = getNumberOperationsItemReviewFlags(entry);
            return (
              <article
                key={entry.item.id}
                style={{
                  ...panel,
                  width: "100%",
                  maxWidth: 390,
                  margin: "0 auto",
                }}
              >
                <div style={{ display: "grid", gap: 3 }}>
                  <strong style={{ color: "#17204B" }}>{entry.item.id}</strong>
                  <span style={{ color: "#64748B", fontSize: 12 }}>
                    {entry.item.stimulus.type} · {entry.poolKind} · {entry.poolKey}
                  </span>
                </div>

                <p style={{ margin: 0, color: "#17204B", lineHeight: 1.6 }}>
                  {entry.item.prompt}
                </p>

                <AssessmentStimulus stimulus={entry.item.stimulus} />

                <details>
                  <summary
                    style={{
                      cursor: "pointer",
                      color: "#475569",
                      fontWeight: 800,
                    }}
                  >
                    Accessible description
                  </summary>
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "#64748B",
                      lineHeight: 1.55,
                    }}
                  >
                    {entry.item.stimulus.altText ||
                      "No explicit alt text; renderer-generated description applies."}
                  </p>
                </details>

                {flags.length ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {flags.map((flag) => (
                      <span
                        key={flag}
                        style={{
                          border: "1px solid #F5D08A",
                          borderRadius: 999,
                          background: "#FFFDF5",
                          color: "#92400E",
                          padding: "4px 8px",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {numberOperationsItemReviewFlagLabel(flag)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}

          <section
            style={{
              ...panel,
              borderColor: "#CFE3D5",
              background: "#F7FCF8",
            }}
          >
            <strong style={{ color: "#166534" }}>
              Review outcome is recorded elsewhere
            </strong>
            <span style={{ color: "#4B5563", lineHeight: 1.55 }}>
              This route does not alter item status, asset approval, release gates
              or customer visibility.
            </span>
          </section>
        </div>
      </main>
    </AssessmentAccessGate>
  );
}
