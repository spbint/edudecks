"use client";

import React, { useCallback, useState } from "react";
import AssessmentPlayerV1 from "@/app/components/clean/assessment-lab/AssessmentPlayerV1";
import AssessmentPlacementResultCard from "@/app/components/clean/assessment-lab/AssessmentPlacementResultCard";
import type { MyLearnaAssessmentResponse } from "@/lib/clean/assessments/mylearnaAssessTypes";
import {
  MEASUREMENT_UNITS_ANCHOR_SET,
  getMeasurementUnitsEvidenceMode,
} from "@/lib/clean/assessments/placement/measurementUnitsAnchors";
import {
  buildMeasurementUnitsCandidateBandResult,
  buildMeasurementUnitsEndpointResult,
} from "@/lib/clean/assessments/placement/measurementUnitsPlacementResult";
import type { AssessmentPlacementResultView } from "@/lib/clean/assessments/placement/assessmentPlacementResult";
import {
  MEASUREMENT_UNITS_BOUNDARY_CLUSTERS,
  MEASUREMENT_UNITS_EXECUTABLE_ANCHORS,
  MEASUREMENT_UNITS_P6_RESERVE_ITEM,
  MEASUREMENT_UNITS_SEARCH_CLUSTERS,
} from "@/lib/clean/assessments/placement/measurementUnitsItems";
import {
  applyAdaptiveBoundaryEvidence,
  nextAdaptiveBoundaryTarget,
  nextAdaptiveSearchTarget,
  resolveAdaptiveInitialWithReserve,
  routeAdaptiveBranch,
  routeAdaptiveInitial,
  routeAdaptiveSearch,
  type AdaptiveBinaryResult,
  type AdaptiveInitialRoute,
  type AdaptiveProgressionBracket,
} from "@/lib/clean/assessments/placement/adaptiveProgressionRouting";

type Stage =
  | { kind: "initial" }
  | { kind: "reserve"; initial: [AdaptiveBinaryResult, AdaptiveBinaryResult] }
  | { kind: "branch"; route: AdaptiveInitialRoute; pLevel: number }
  | { kind: "search"; direction: "down" | "up"; pLevel: number }
  | {
      kind: "boundary";
      bracket: AdaptiveProgressionBracket;
      pLevel: number;
    }
  | {
      kind: "result";
      headline: string;
      detail: string;
      evidenceWarning?: string;
      placementResult?: AssessmentPlacementResultView;
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

function poolKey(pLevel: number) {
  return `understanding-units-measurement-p${pLevel}`;
}

function anchorItemsAt(pLevel: number) {
  return (
    MEASUREMENT_UNITS_EXECUTABLE_ANCHORS[
      poolKey(pLevel) as keyof typeof MEASUREMENT_UNITS_EXECUTABLE_ANCHORS
    ] || null
  );
}

function searchItemsAt(pLevel: number) {
  return (
    MEASUREMENT_UNITS_SEARCH_CLUSTERS[
      poolKey(pLevel) as keyof typeof MEASUREMENT_UNITS_SEARCH_CLUSTERS
    ] || null
  );
}

function boundaryItemsAt(pLevel: number) {
  return (
    MEASUREMENT_UNITS_BOUNDARY_CLUSTERS[
      poolKey(pLevel) as keyof typeof MEASUREMENT_UNITS_BOUNDARY_CLUSTERS
    ] || null
  );
}

function practicalWarning(lowerP: number, upperP = lowerP) {
  for (let p = lowerP; p <= upperP; p += 1) {
    if (getMeasurementUnitsEvidenceMode(p) === "hybrid-practical") {
      return "This result includes practical measurement constructs. Electronic responses can locate the learning neighbourhood, but high-confidence lower-level placement requires observed use of real measurement materials.";
    }
  }
  return undefined;
}

export default function AssessmentMeasurementUnitsLab() {
  const [stage, setStage] = useState<Stage>({ kind: "initial" });
  const [trace, setTrace] = useState<string[]>([]);

  const addTrace = useCallback(
    (message: string) => setTrace((current) => [...current, message]),
    [],
  );

  const reset = useCallback(() => {
    setStage({ kind: "initial" });
    setTrace([]);
  }, []);

  const finishBracket = useCallback(
    (bracket: AdaptiveProgressionBracket) => {
      const nextP = nextAdaptiveBoundaryTarget(bracket);
      if (nextP) {
        const items = boundaryItemsAt(nextP);
        if (items) {
          addTrace(
            `Boundary search continues at P${nextP} within P${bracket.lowerP}–P${bracket.upperP}.`,
          );
          setStage({ kind: "boundary", bracket, pLevel: nextP });
          return;
        }
      }

      setStage({
        kind: "result",
        headline: `Candidate measurement neighbourhood: P${bracket.lowerP}–P${bracket.upperP}`,
        detail:
          bracket.upperP - bracket.lowerP === 1
            ? "The adaptive route has narrowed to adjacent progression levels. This is an evidence band, not an averaged or psychometric level."
            : "The route has found a measurement neighbourhood, but a required boundary pool is not yet executable. No narrower result is inferred.",
        evidenceWarning: practicalWarning(bracket.lowerP, bracket.upperP),
        placementResult: buildMeasurementUnitsCandidateBandResult({
          lowerP: bracket.lowerP,
          upperP: bracket.upperP,
        }),
      });
    },
    [addTrace],
  );

  const continueSearch = useCallback(
    (direction: "down" | "up", fromP: number) => {
      const route =
        direction === "down"
          ? ({ kind: "search-down", fromP } as const)
          : ({ kind: "search-up", fromP } as const);
      const targetP = nextAdaptiveSearchTarget(
        MEASUREMENT_UNITS_ANCHOR_SET,
        route,
      );

      if (!targetP) {
        setStage({
          kind: "result",
          headline:
            direction === "up"
              ? `Evidence reaches at least P${fromP}.`
              : `Evidence is below or around P${fromP}.`,
          detail:
            "The adaptive route has reached the source progression endpoint. MyLearna does not invent a level outside the QCAA progression.",
          evidenceWarning:
            direction === "down" ? practicalWarning(fromP) : undefined,
          placementResult: buildMeasurementUnitsEndpointResult({
            relation: direction === "up" ? "at-least" : "below-or-around",
            pLevel: fromP,
          }),
        });
        return;
      }

      const items = searchItemsAt(targetP);
      if (!items) {
        setStage({
          kind: "result",
          headline: `Search target P${targetP} is not executable yet.`,
          detail:
            "The route stops safely because no score-bearing content exists for the next target.",
          evidenceWarning:
            direction === "down" ? practicalWarning(targetP) : undefined,
        });
        return;
      }

      addTrace(`Continue ${direction} to P${targetP}.`);
      setStage({ kind: "search", direction, pLevel: targetP });
    },
    [addTrace],
  );

  const routeResolvedInitial = useCallback(
    (route: AdaptiveInitialRoute) => {
      if (route.kind !== "down" && route.kind !== "up") return;
      addTrace(
        `Initial P${MEASUREMENT_UNITS_ANCHOR_SET.initialP} evidence routed ${route.kind} to P${route.targetP}.`,
      );
      setStage({
        kind: "branch",
        route,
        pLevel: route.targetP,
      });
    },
    [addTrace],
  );

  const handleInitial = useCallback(
    (responses: MyLearnaAssessmentResponse[]) => {
      const results = pair(responses);
      const route = routeAdaptiveInitial(
        MEASUREMENT_UNITS_ANCHOR_SET,
        results,
      );

      if (route.kind === "same-level-extra") {
        addTrace("Initial P6 evidence was mixed; use reserve probe C.");
        setStage({ kind: "reserve", initial: results });
        return;
      }

      routeResolvedInitial(route);
    },
    [addTrace, routeResolvedInitial],
  );

  const handleReserve = useCallback(
    (
      responses: MyLearnaAssessmentResponse[],
      initial: [AdaptiveBinaryResult, AdaptiveBinaryResult],
    ) => {
      const reserve: AdaptiveBinaryResult = responses[0]?.correct ? 1 : 0;
      addTrace(
        `P6 reserve probe was ${reserve ? "supported" : "not supported"}.`,
      );
      routeResolvedInitial(
        resolveAdaptiveInitialWithReserve(
          MEASUREMENT_UNITS_ANCHOR_SET,
          initial,
          reserve,
        ),
      );
    },
    [addTrace, routeResolvedInitial],
  );

  const handleBranch = useCallback(
    (responses: MyLearnaAssessmentResponse[], route: AdaptiveInitialRoute) => {
      const result = routeAdaptiveBranch(
        MEASUREMENT_UNITS_ANCHOR_SET,
        route,
        pair(responses),
      );

      if (result.kind === "bracket") {
        addTrace(
          `Branch evidence located P${result.lowerP}–P${result.upperP}.`,
        );
        finishBracket({
          lowerP: result.lowerP,
          upperP: result.upperP,
        });
        return;
      }

      if (result.kind === "search-down" || result.kind === "search-up") {
        continueSearch(
          result.kind === "search-down" ? "down" : "up",
          result.fromP,
        );
      }
    },
    [addTrace, continueSearch, finishBracket],
  );

  const handleSearch = useCallback(
    (
      responses: MyLearnaAssessmentResponse[],
      direction: "down" | "up",
      pLevel: number,
    ) => {
      const result = routeAdaptiveSearch(
        MEASUREMENT_UNITS_ANCHOR_SET,
        direction,
        pLevel,
        pair(responses),
      );
      addTrace(
        `P${pLevel} search evidence returned ${responses.filter((response) => response.correct).length}/${responses.length}.`,
      );

      if (result.kind === "endpoint") {
        setStage({
          kind: "result",
          headline:
            result.relation === "at-least"
              ? `Evidence reaches at least P${result.pLevel}.`
              : `Evidence is below or around P${result.pLevel}.`,
          detail:
            "This is open-ended source-endpoint language, not a fabricated progression level.",
          evidenceWarning:
            result.relation === "below-or-around"
              ? practicalWarning(result.pLevel)
              : undefined,
          placementResult: buildMeasurementUnitsEndpointResult({
            relation: result.relation,
            pLevel: result.pLevel,
          }),
        });
        return;
      }

      if (result.kind === "bracket") {
        finishBracket({
          lowerP: result.lowerP,
          upperP: result.upperP,
        });
        return;
      }

      if (result.kind === "search-down" || result.kind === "search-up") {
        continueSearch(
          result.kind === "search-down" ? "down" : "up",
          result.fromP,
        );
      }
    },
    [addTrace, continueSearch, finishBracket],
  );

  const handleBoundary = useCallback(
    (
      responses: MyLearnaAssessmentResponse[],
      bracket: AdaptiveProgressionBracket,
      pLevel: number,
    ) => {
      const supported =
        responses.filter((response) => response.correct).length >= 2;
      const narrowed = applyAdaptiveBoundaryEvidence(
        bracket,
        pLevel,
        supported,
      );
      addTrace(
        `P${pLevel} boundary was ${supported ? "supported" : "not sufficiently supported"}; bracket is P${narrowed.lowerP}–P${narrowed.upperP}.`,
      );
      finishBracket(narrowed);
    },
    [addTrace, finishBracket],
  );

  let player: React.ReactNode = null;

  if (stage.kind === "initial") {
    player = (
      <AssessmentPlayerV1
        key="measurement-p6-initial"
        title="Understanding units of measurement · P6 initial anchor"
        items={[
          ...MEASUREMENT_UNITS_EXECUTABLE_ANCHORS[
            "understanding-units-measurement-p6"
          ],
        ]}
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
    const items = anchorItemsAt(stage.pLevel);
    player = items ? (
      <AssessmentPlayerV1
        key={`measurement-branch-p${stage.pLevel}`}
        title={`Understanding units of measurement · P${stage.pLevel} branch anchor`}
        items={[...items]}
        mode="placement"
        onComplete={(responses) => handleBranch(responses, stage.route)}
      />
    ) : null;
  } else if (stage.kind === "search") {
    const items = searchItemsAt(stage.pLevel);
    player = items ? (
      <AssessmentPlayerV1
        key={`measurement-search-p${stage.pLevel}`}
        title={`Understanding units of measurement · P${stage.pLevel} search cluster`}
        items={[...items]}
        mode="placement"
        onComplete={(responses) =>
          handleSearch(responses, stage.direction, stage.pLevel)
        }
      />
    ) : null;
  } else if (stage.kind === "boundary") {
    const items = boundaryItemsAt(stage.pLevel);
    player = items ? (
      <AssessmentPlayerV1
        key={`measurement-boundary-p${stage.pLevel}-${stage.bracket.lowerP}-${stage.bracket.upperP}`}
        title={`Understanding units of measurement · P${stage.pLevel} boundary probes`}
        items={[...items]}
        mode="placement"
        onComplete={(responses) =>
          handleBoundary(responses, stage.bracket, stage.pLevel)
        }
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
            Full P1–P10 adaptive route using P3 / P6 / P9 anchors. P1–P4
            electronic tasks are deliberately routing-only because the source
            includes actual use of informal measurement materials.
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
          <section style={{ display: "grid", gap: 14 }}>
            {stage.placementResult ? (
              <AssessmentPlacementResultCard result={stage.placementResult} />
            ) : (
              <section style={card} role="status">
                <strong style={{ color: "#17204B", fontSize: 20 }}>
                  {stage.headline}
                </strong>
                <span style={{ color: "#5B6478", lineHeight: 1.6 }}>
                  {stage.detail}
                </span>
              </section>
            )}
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

        {trace.length ? (
          <details style={card}>
            <summary
              style={{
                cursor: "pointer",
                color: "#17204B",
                fontWeight: 850,
              }}
            >
              Measurement routing trace
            </summary>
            <ol style={{ margin: "8px 0 0", color: "#5B6478", lineHeight: 1.6 }}>
              {trace.map((entry, index) => (
                <li key={entry + index}>{entry}</li>
              ))}
            </ol>
          </details>
        ) : null}
      </div>
    </main>
  );
}
