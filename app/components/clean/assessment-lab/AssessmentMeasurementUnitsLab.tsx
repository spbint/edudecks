"use client";

import React, { useCallback, useState } from "react";
import AssessmentPlayerV1 from "@/app/components/clean/assessment-lab/AssessmentPlayerV1";
import type { MyLearnaAssessmentResponse } from "@/lib/clean/assessments/mylearnaAssessTypes";
import {
  MEASUREMENT_UNITS_ANCHOR_SET,
  getMeasurementUnitsEvidenceMode,
} from "@/lib/clean/assessments/placement/measurementUnitsAnchors";
import {
  MEASUREMENT_UNITS_EXECUTABLE_ANCHORS,
  MEASUREMENT_UNITS_P6_RESERVE_ITEM,
} from "@/lib/clean/assessments/placement/measurementUnitsItems";
import {
  resolveAdaptiveInitialWithReserve,
  routeAdaptiveBranch,
  routeAdaptiveInitial,
  type AdaptiveBinaryResult,
  type AdaptiveInitialRoute,
} from "@/lib/clean/assessments/placement/adaptiveProgressionRouting";

type Stage =
  | { kind: "initial" }
  | { kind: "reserve"; initial: [AdaptiveBinaryResult, AdaptiveBinaryResult] }
  | {
      kind: "branch";
      route: AdaptiveInitialRoute;
      pLevel: number;
    }
  | {
      kind: "result";
      headline: string;
      detail: string;
      evidenceWarning?: string;
    };

const card: React.CSSProperties = {
  border: "1px solid #E1E6F0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 18,
  display: "grid",
  gap: 12,
};

function pair(
  responses: MyLearnaAssessmentResponse[],
): [AdaptiveBinaryResult, AdaptiveBinaryResult] {
  return [
    responses[0] ? (responses[0].correct ? 1 : 0) : null,
    responses[1] ? (responses[1].correct ? 1 : 0) : null,
  ];
}

function itemsAt(pLevel: number) {
  return (
    MEASUREMENT_UNITS_EXECUTABLE_ANCHORS[
      `understanding-units-measurement-p${pLevel}` as keyof typeof MEASUREMENT_UNITS_EXECUTABLE_ANCHORS
    ] || null
  );
}

export default function AssessmentMeasurementUnitsLab() {
  const [stage, setStage] = useState<Stage>({ kind: "initial" });

  const reset = useCallback(() => setStage({ kind: "initial" }), []);

  const routeResolvedInitial = useCallback((route: AdaptiveInitialRoute) => {
    if (route.kind !== "down" && route.kind !== "up") return;
    setStage({
      kind: "branch",
      route,
      pLevel: route.targetP,
    });
  }, []);

  const handleInitial = useCallback((responses: MyLearnaAssessmentResponse[]) => {
    const results = pair(responses);
    const route = routeAdaptiveInitial(MEASUREMENT_UNITS_ANCHOR_SET, results);

    if (route.kind === "same-level-extra") {
      setStage({ kind: "reserve", initial: results });
      return;
    }

    routeResolvedInitial(route);
  }, [routeResolvedInitial]);

  const handleReserve = useCallback(
    (responses: MyLearnaAssessmentResponse[], initial: [AdaptiveBinaryResult, AdaptiveBinaryResult]) => {
      const reserve: AdaptiveBinaryResult = responses[0]?.correct ? 1 : 0;
      routeResolvedInitial(
        resolveAdaptiveInitialWithReserve(
          MEASUREMENT_UNITS_ANCHOR_SET,
          initial,
          reserve,
        ),
      );
    },
    [routeResolvedInitial],
  );

  const handleBranch = useCallback(
    (responses: MyLearnaAssessmentResponse[], route: AdaptiveInitialRoute) => {
      const result = routeAdaptiveBranch(
        MEASUREMENT_UNITS_ANCHOR_SET,
        route,
        pair(responses),
      );

      if (result.kind === "bracket") {
        const lowerMode = getMeasurementUnitsEvidenceMode(result.lowerP);
        setStage({
          kind: "result",
          headline: `Candidate measurement neighbourhood: P${result.lowerP}–P${result.upperP}`,
          detail:
            "The second-strand proof has located a progression neighbourhood. Adjacent-level search and confirmation content are the next build step; no exact measurement placement is claimed yet.",
          ...(lowerMode === "hybrid-practical"
            ? {
                evidenceWarning:
                  "This neighbourhood includes practical measurement constructs. Electronic responses may route the learner, but high-confidence lower-level placement requires observed use of measurement materials.",
              }
            : {}),
        });
        return;
      }

      if (result.kind === "search-down" || result.kind === "search-up") {
        const nextP =
          result.kind === "search-down"
            ? result.fromP - 1
            : result.fromP + 1;
        setStage({
          kind: "result",
          headline:
            result.kind === "search-down"
              ? "Evidence remains below the lower anchor."
              : "Evidence remains above the upper anchor.",
          detail: `The deterministic next target is P${nextP}. That search cluster is intentionally not authored yet; this staff proof stops rather than inventing a result.`,
          ...(result.kind === "search-down"
            ? {
                evidenceWarning:
                  "Lower measurement levels are strongly practical. The next design step must include an observed/practical evidence mode rather than converting every source indicator into a click task.",
              }
            : {}),
        });
      }
    },
    [],
  );

  let player = null;

  if (stage.kind === "initial") {
    player = (
      <AssessmentPlayerV1
        key="measurement-p6-initial"
        title="Understanding units of measurement · P6 initial anchor"
        items={[...MEASUREMENT_UNITS_EXECUTABLE_ANCHORS["understanding-units-measurement-p6"]]}
        mode="placement"
        onComplete={handleInitial}
      />
    );
  } else if (stage.kind === "reserve") {
    player = (
      <AssessmentPlayerV1
        key="measurement-p6-reserve"
        title="Understanding units of measurement · P6 reserve probe"
        items={[MEASUREMENT_UNITS_P6_RESERVE_ITEM]}
        mode="placement"
        onComplete={(responses) => handleReserve(responses, stage.initial)}
      />
    );
  } else if (stage.kind === "branch") {
    const items = itemsAt(stage.pLevel);
    player = items ? (
      <AssessmentPlayerV1
        key={`measurement-branch-p${stage.pLevel}`}
        title={`Understanding units of measurement · P${stage.pLevel} branch anchor`}
        items={[...items]}
        mode="placement"
        onComplete={(responses) => handleBranch(responses, stage.route)}
      />
    ) : null;
  }

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
          maxWidth: 1120,
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
            Cross-strand adaptive proof · Measurement and geometry
          </span>
          <h1
            style={{
              margin: 0,
              color: "#17204B",
              fontSize: "clamp(30px, 5vw, 46px)",
            }}
          >
            Understanding units of measurement
          </h1>
          <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.65 }}>
            P3 / P6 / P9 anchor proof across a P1–P10 progression. P3 is
            deliberately routing-only because the source requires actual use of
            informal measurement units.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 12,
          }}
        >
          {MEASUREMENT_UNITS_ANCHOR_SET.anchors.map((anchor) => (
            <article key={anchor.pLevel} style={card}>
              <strong style={{ color: "#17204B" }}>
                P{anchor.pLevel} · {anchor.role}
              </strong>
              <span style={{ color: "#5B6478" }}>
                {anchor.sourceConstructs.join(" · ")}
              </span>
              <small
                style={{
                  color:
                    anchor.evidenceMode === "hybrid-practical"
                      ? "#92400E"
                      : "#166534",
                  fontWeight: 850,
                }}
              >
                Evidence mode: {anchor.evidenceMode}
              </small>
            </article>
          ))}
        </section>

        {stage.kind === "result" ? (
          <section style={card} role="status">
            <strong style={{ color: "#17204B", fontSize: 20 }}>
              {stage.headline}
            </strong>
            <span style={{ color: "#5B6478", lineHeight: 1.6 }}>
              {stage.detail}
            </span>
            {stage.evidenceWarning ? (
              <div
                style={{
                  border: "1px solid #F5D08A",
                  borderRadius: 12,
                  background: "#FFFDF5",
                  padding: 12,
                  color: "#6B4F1D",
                  lineHeight: 1.55,
                }}
              >
                {stage.evidenceWarning}
              </div>
            ) : null}
            <button type="button" onClick={reset}>
              Restart measurement route
            </button>
          </section>
        ) : (
          player
        )}
      </div>
    </main>
  );
}
