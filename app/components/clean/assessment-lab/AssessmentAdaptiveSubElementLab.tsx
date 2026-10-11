"use client";

import React, { useCallback, useState } from "react";
import AssessmentPlayerV1 from "@/app/components/clean/assessment-lab/AssessmentPlayerV1";
import AssessmentPlacementResultCard from "@/app/components/clean/assessment-lab/AssessmentPlacementResultCard";
import type {
  MyLearnaAssessmentItem,
  MyLearnaAssessmentResponse,
} from "@/lib/clean/assessments/mylearnaAssessTypes";
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
  type AdaptiveProgressionAnchorSet,
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

export type AdaptiveSubElementAnchorCard = {
  pLevel: number;
  role: "lower" | "initial" | "upper";
  evidenceMode: string;
  sourceConstructs: string[];
};

export type AssessmentAdaptiveSubElementLabProps = {
  elementLabel: string;
  title: string;
  intro: string;
  anchorSet: AdaptiveProgressionAnchorSet;
  anchorCards: AdaptiveSubElementAnchorCard[];
  reserveItem: MyLearnaAssessmentItem;
  getAnchorItems: (pLevel: number) => readonly MyLearnaAssessmentItem[] | null;
  getSearchItems: (pLevel: number) => readonly MyLearnaAssessmentItem[] | null;
  getBoundaryItems: (pLevel: number) => readonly MyLearnaAssessmentItem[] | null;
  buildBandResult: (
    bracket: AdaptiveProgressionBracket,
  ) => AssessmentPlacementResultView;
  buildEndpointResult: (
    relation: "below-or-around" | "at-least",
    pLevel: number,
  ) => AssessmentPlacementResultView;
  evidenceWarning?: (lowerP: number, upperP?: number) => string | undefined;
  initialAnchorLabel?: string;
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

export default function AssessmentAdaptiveSubElementLab({
  elementLabel,
  title,
  intro,
  anchorSet,
  anchorCards,
  reserveItem,
  getAnchorItems,
  getSearchItems,
  getBoundaryItems,
  buildBandResult,
  buildEndpointResult,
  evidenceWarning,
  initialAnchorLabel,
}: AssessmentAdaptiveSubElementLabProps) {
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
        const items = getBoundaryItems(nextP);
        if (items?.length) {
          addTrace(
            `Boundary search continues at P${nextP} within P${bracket.lowerP}–P${bracket.upperP}.`,
          );
          setStage({ kind: "boundary", bracket, pLevel: nextP });
          return;
        }
      }

      setStage({
        kind: "result",
        placementResult: buildBandResult(bracket),
        evidenceWarning: evidenceWarning?.(
          bracket.lowerP,
          bracket.upperP,
        ),
      });
    },
    [addTrace, buildBandResult, evidenceWarning, getBoundaryItems],
  );

  const continueSearch = useCallback(
    (direction: "down" | "up", fromP: number) => {
      const route =
        direction === "down"
          ? ({ kind: "search-down", fromP } as const)
          : ({ kind: "search-up", fromP } as const);
      const targetP = nextAdaptiveSearchTarget(anchorSet, route);

      if (!targetP) {
        setStage({
          kind: "result",
          placementResult: buildEndpointResult(
            direction === "up" ? "at-least" : "below-or-around",
            fromP,
          ),
          evidenceWarning:
            direction === "down"
              ? evidenceWarning?.(fromP)
              : undefined,
        });
        return;
      }

      const items = getSearchItems(targetP);
      if (!items?.length) {
        throw new Error(
          `${title} adaptive route is missing search content at P${targetP}.`,
        );
      }

      addTrace(`Continue ${direction} to P${targetP}.`);
      setStage({ kind: "search", direction, pLevel: targetP });
    },
    [
      addTrace,
      anchorSet,
      buildEndpointResult,
      evidenceWarning,
      getSearchItems,
      title,
    ],
  );

  const routeResolvedInitial = useCallback(
    (route: AdaptiveInitialRoute) => {
      if (route.kind !== "down" && route.kind !== "up") return;

      const items = getAnchorItems(route.targetP);
      if (!items?.length) {
        throw new Error(
          `${title} adaptive route is missing branch anchor content at P${route.targetP}.`,
        );
      }

      addTrace(
        `Initial P${anchorSet.initialP} evidence routed ${route.kind} to P${route.targetP}.`,
      );
      setStage({ kind: "branch", route, pLevel: route.targetP });
    },
    [addTrace, anchorSet.initialP, getAnchorItems, title],
  );

  const handleInitial = useCallback(
    (responses: MyLearnaAssessmentResponse[]) => {
      const results = pair(responses);
      const route = routeAdaptiveInitial(anchorSet, results);

      if (route.kind === "same-level-extra") {
        addTrace(
          `Initial P${anchorSet.initialP} evidence was mixed; use reserve probe C.`,
        );
        setStage({ kind: "reserve", initial: results });
        return;
      }

      routeResolvedInitial(route);
    },
    [addTrace, anchorSet, routeResolvedInitial],
  );

  const handleReserve = useCallback(
    (
      responses: MyLearnaAssessmentResponse[],
      initial: [AdaptiveBinaryResult, AdaptiveBinaryResult],
    ) => {
      const reserve: AdaptiveBinaryResult = responses[0]?.correct ? 1 : 0;
      addTrace(
        `P${anchorSet.initialP} reserve probe was ${reserve ? "supported" : "not supported"}.`,
      );
      routeResolvedInitial(
        resolveAdaptiveInitialWithReserve(
          anchorSet,
          initial,
          reserve,
        ),
      );
    },
    [addTrace, anchorSet, routeResolvedInitial],
  );

  const handleBranch = useCallback(
    (responses: MyLearnaAssessmentResponse[], route: AdaptiveInitialRoute) => {
      const result = routeAdaptiveBranch(anchorSet, route, pair(responses));

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
    [addTrace, anchorSet, continueSearch, finishBracket],
  );

  const handleSearch = useCallback(
    (
      responses: MyLearnaAssessmentResponse[],
      direction: "down" | "up",
      pLevel: number,
    ) => {
      const result = routeAdaptiveSearch(
        anchorSet,
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
          placementResult: buildEndpointResult(
            result.relation,
            result.pLevel,
          ),
          evidenceWarning:
            result.relation === "below-or-around"
              ? evidenceWarning?.(result.pLevel)
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
    [
      addTrace,
      anchorSet,
      buildEndpointResult,
      continueSearch,
      evidenceWarning,
      finishBracket,
    ],
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
    const items = getAnchorItems(anchorSet.initialP);
    if (!items?.length) {
      throw new Error(
        `${title} adaptive route is missing initial anchor content at P${anchorSet.initialP}.`,
      );
    }
    player = (
      <AssessmentPlayerV1
        key={`${anchorSet.key}-initial`}
        title={
          initialAnchorLabel ||
          `${title} · P${anchorSet.initialP} initial anchor`
        }
        items={[...items]}
        mode="placement"
        onComplete={handleInitial}
      />
    );
  } else if (stage.kind === "reserve") {
    player = (
      <AssessmentPlayerV1
        key={`${anchorSet.key}-reserve`}
        title={`${title} · P${anchorSet.initialP} reserve probe`}
        items={[reserveItem]}
        mode="placement"
        onComplete={(responses) => handleReserve(responses, stage.initial)}
      />
    );
  } else if (stage.kind === "branch") {
    const items = getAnchorItems(stage.pLevel);
    player = items ? (
      <AssessmentPlayerV1
        key={`${anchorSet.key}-branch-p${stage.pLevel}`}
        title={`${title} · P${stage.pLevel} branch anchor`}
        items={[...items]}
        mode="placement"
        onComplete={(responses) => handleBranch(responses, stage.route)}
      />
    ) : null;
  } else if (stage.kind === "search") {
    const items = getSearchItems(stage.pLevel);
    player = items ? (
      <AssessmentPlayerV1
        key={`${anchorSet.key}-search-p${stage.pLevel}`}
        title={`${title} · P${stage.pLevel} search cluster`}
        items={[...items]}
        mode="placement"
        onComplete={(responses) =>
          handleSearch(responses, stage.direction, stage.pLevel)
        }
      />
    ) : null;
  } else if (stage.kind === "boundary") {
    const items = getBoundaryItems(stage.pLevel);
    player = items ? (
      <AssessmentPlayerV1
        key={`${anchorSet.key}-boundary-p${stage.pLevel}-${stage.bracket.lowerP}-${stage.bracket.upperP}`}
        title={`${title} · P${stage.pLevel} boundary probes`}
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
            Cross-strand adaptive proof · {elementLabel}
          </span>
          <h1
            style={{
              margin: 0,
              color: "#17204B",
              fontSize: "clamp(30px, 5vw, 46px)",
            }}
          >
            {title}
          </h1>
          <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.65 }}>
            {intro}
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 12,
          }}
        >
          {anchorCards.map((anchor) => (
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
                    anchor.evidenceMode.includes("routing") ||
                    anchor.evidenceMode.includes("practical")
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
              Restart {title} route
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
              {title} routing trace
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
