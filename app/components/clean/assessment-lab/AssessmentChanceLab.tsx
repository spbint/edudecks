"use client";

import React, { useCallback, useState } from "react";
import AssessmentPlayerV1 from "@/app/components/clean/assessment-lab/AssessmentPlayerV1";
import AssessmentPlacementResultCard from "@/app/components/clean/assessment-lab/AssessmentPlacementResultCard";
import type { MyLearnaAssessmentResponse } from "@/lib/clean/assessments/mylearnaAssessTypes";
import {
  CHANCE_ANCHOR_SET,
  getChanceEvidenceMode,
} from "@/lib/clean/assessments/placement/chanceAnchors";
import {
  CHANCE_BOUNDARY_CLUSTERS,
  CHANCE_EXECUTABLE_ANCHORS,
  CHANCE_P4_RESERVE_ITEM,
  CHANCE_SEARCH_CLUSTERS,
} from "@/lib/clean/assessments/placement/chanceItems";
import {
  buildChanceCandidateBandResult,
  buildChanceEndpointResult,
} from "@/lib/clean/assessments/placement/chancePlacementResult";
import type { AssessmentPlacementResultView } from "@/lib/clean/assessments/placement/assessmentPlacementResult";
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
      placementResult: AssessmentPlacementResultView;
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

function poolKey(pLevel: number) {
  return `understanding-chance-p${pLevel}`;
}

function anchorItemsAt(pLevel: number) {
  return (
    CHANCE_EXECUTABLE_ANCHORS[
      poolKey(pLevel) as keyof typeof CHANCE_EXECUTABLE_ANCHORS
    ] || null
  );
}

function searchItemsAt(pLevel: number) {
  return (
    CHANCE_SEARCH_CLUSTERS[
      poolKey(pLevel) as keyof typeof CHANCE_SEARCH_CLUSTERS
    ] || null
  );
}

function boundaryItemsAt(pLevel: number) {
  return (
    CHANCE_BOUNDARY_CLUSTERS[
      poolKey(pLevel) as keyof typeof CHANCE_BOUNDARY_CLUSTERS
    ] || null
  );
}

function contextualWarning(lowerP: number, upperP = lowerP) {
  for (let p = lowerP; p <= upperP; p += 1) {
    if (getChanceEvidenceMode(p) === "contextual-routing") {
      return "This band includes everyday chance judgements that are context-sensitive. Electronic responses can route the learner, but authentic discussion or observed reasoning is needed before strengthening the lower-end claim.";
    }
  }
  return undefined;
}

export default function AssessmentChanceLab() {
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
        placementResult: buildChanceCandidateBandResult({
          lowerP: bracket.lowerP,
          upperP: bracket.upperP,
        }),
        evidenceWarning: contextualWarning(bracket.lowerP, bracket.upperP),
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
      const targetP = nextAdaptiveSearchTarget(CHANCE_ANCHOR_SET, route);

      if (!targetP) {
        setStage({
          kind: "result",
          placementResult: buildChanceEndpointResult({
            relation: direction === "up" ? "at-least" : "below-or-around",
            pLevel: fromP,
          }),
          evidenceWarning:
            direction === "down" ? contextualWarning(fromP) : undefined,
        });
        return;
      }

      const items = searchItemsAt(targetP);
      if (!items) {
        throw new Error(
          `Chance adaptive route is missing search content at P${targetP}.`,
        );
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
        `Initial P${CHANCE_ANCHOR_SET.initialP} evidence routed ${route.kind} to P${route.targetP}.`,
      );
      setStage({ kind: "branch", route, pLevel: route.targetP });
    },
    [addTrace],
  );

  const handleInitial = useCallback(
    (responses: MyLearnaAssessmentResponse[]) => {
      const results = pair(responses);
      const route = routeAdaptiveInitial(CHANCE_ANCHOR_SET, results);

      if (route.kind === "same-level-extra") {
        addTrace("Initial P4 evidence was mixed; use reserve probe C.");
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
        `P4 reserve probe was ${reserve ? "supported" : "not supported"}.`,
      );
      routeResolvedInitial(
        resolveAdaptiveInitialWithReserve(
          CHANCE_ANCHOR_SET,
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
        CHANCE_ANCHOR_SET,
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
        CHANCE_ANCHOR_SET,
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
          placementResult: buildChanceEndpointResult({
            relation: result.relation,
            pLevel: result.pLevel,
          }),
          evidenceWarning:
            result.relation === "below-or-around"
              ? contextualWarning(result.pLevel)
              : undefined,
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
        key="chance-p4-initial"
        title="Understanding chance · P4 initial anchor"
        items={[...CHANCE_EXECUTABLE_ANCHORS["understanding-chance-p4"]]}
        mode="placement"
        onComplete={handleInitial}
      />
    );
  } else if (stage.kind === "reserve") {
    player = (
      <AssessmentPlayerV1
        key="chance-p4-reserve"
        title="Understanding chance · P4 reserve probe"
        items={[CHANCE_P4_RESERVE_ITEM]}
        mode="placement"
        onComplete={(responses) => handleReserve(responses, stage.initial)}
      />
    );
  } else if (stage.kind === "branch") {
    const items = anchorItemsAt(stage.pLevel);
    player = items ? (
      <AssessmentPlayerV1
        key={`chance-branch-p${stage.pLevel}`}
        title={`Understanding chance · P${stage.pLevel} branch anchor`}
        items={[...items]}
        mode="placement"
        onComplete={(responses) => handleBranch(responses, stage.route)}
      />
    ) : null;
  } else if (stage.kind === "search") {
    const items = searchItemsAt(stage.pLevel);
    player = items ? (
      <AssessmentPlayerV1
        key={`chance-search-p${stage.pLevel}`}
        title={`Understanding chance · P${stage.pLevel} search cluster`}
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
        key={`chance-boundary-p${stage.pLevel}-${stage.bracket.lowerP}-${stage.bracket.upperP}`}
        title={`Understanding chance · P${stage.pLevel} boundary probes`}
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
            Cross-strand adaptive proof · Statistics and probability
          </span>
          <h1
            style={{
              margin: 0,
              color: "#17204B",
              fontSize: "clamp(30px, 5vw, 46px)",
            }}
          >
            Understanding chance
          </h1>
          <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.65 }}>
            Full P1–P6 adaptive route using P2 / P4 / P6 anchors. The route
            moves from everyday chance language through fairness and
            independence to numerical, compound and conditional probability.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 12,
          }}
        >
          {CHANCE_ANCHOR_SET.anchors.map((anchor) => (
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
                    anchor.evidenceMode === "contextual-routing"
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
            <AssessmentPlacementResultCard result={stage.placementResult} />
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
              Restart chance route
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
              Chance routing trace
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
