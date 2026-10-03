"use client";

import React, { useCallback, useMemo, useState } from "react";
import AssessmentPlayerV1 from "@/app/components/clean/assessment-lab/AssessmentPlayerV1";
import type { MyLearnaAssessmentResponse } from "@/lib/clean/assessments/mylearnaAssessTypes";
import {
  bracketFromBranchRoute,
  getAnchorEvidenceMode,
  getNumberOperationsAnchorSet,
  getPlacementEvidencePolicy,
  nextBoundaryTarget,
  nextSearchTarget,
  resolveInitialAnchorWithReserve,
  routeBranchAnchor,
  routeInitialAnchor,
  routeSearchCluster,
  type BinaryAnchorResult,
  type InitialAnchorRoute,
  type NumberOperationsAnchorSet,
} from "@/lib/clean/assessments/placement/numberOperationsAnchors";
import {
  NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS,
  NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS,
  NUMBER_OPERATIONS_SEARCH_CLUSTERS,
} from "@/lib/clean/assessments/placement/numberOperationsP0Items";

type RunnerStage =
  | { kind: "initial"; pLevel: number }
  | { kind: "reserve"; pLevel: number }
  | { kind: "branch"; pLevel: number; direction: "down" | "up" }
  | { kind: "search"; pLevel: number; direction: "down" | "up" }
  | {
      kind: "result";
      headline: string;
      detail: string;
      bracket?: { lowerP: number; upperP: number };
      evidenceNote?: string;
    };

const shell: React.CSSProperties = {
  border: "1px solid #D9D0FF",
  borderRadius: 20,
  background: "#F8F5FF",
  padding: 18,
  display: "grid",
  gap: 14,
};

function pairFromResponses(
  responses: MyLearnaAssessmentResponse[],
): [BinaryAnchorResult, BinaryAnchorResult] {
  return [
    responses[0] ? (responses[0].correct ? 1 : 0) : null,
    responses[1] ? (responses[1].correct ? 1 : 0) : null,
  ];
}

function anchorClusterKey(setKey: NumberOperationsAnchorSet["key"], pLevel: number) {
  return `${setKey}-p${pLevel}`;
}

function getAnchorCluster(setKey: NumberOperationsAnchorSet["key"], pLevel: number) {
  const key = anchorClusterKey(setKey, pLevel) as keyof typeof NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS;
  return NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS[key] || null;
}

function getReserveItem(setKey: NumberOperationsAnchorSet["key"], pLevel: number) {
  const key = anchorClusterKey(setKey, pLevel) as keyof typeof NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS;
  return NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS[key] || null;
}

function getSearchCluster(setKey: NumberOperationsAnchorSet["key"], pLevel: number) {
  const key = anchorClusterKey(setKey, pLevel) as keyof typeof NUMBER_OPERATIONS_SEARCH_CLUSTERS;
  return NUMBER_OPERATIONS_SEARCH_CLUSTERS[key] || null;
}

function resultForUnavailableTarget(
  set: NumberOperationsAnchorSet,
  targetP: number,
): RunnerStage {
  const evidenceMode = getAnchorEvidenceMode(set, targetP);
  if (evidenceMode === "hybrid-observed") {
    return {
      kind: "result",
      headline: `Routing reached P${targetP}, where observed evidence is required.`,
      detail:
        "The digital check can locate the learner in this neighbourhood, but MyLearna will not claim an exact strategy-dependent level from correctness alone.",
      evidenceNote: getPlacementEvidencePolicy({ evidenceMode }).reason,
    };
  }
  if (evidenceMode === "asset-review") {
    return {
      kind: "result",
      headline: `Routing reached P${targetP}, which is still behind an asset-review gate.`,
      detail:
        "The assessment architecture is ready, but production routing remains blocked until the score-bearing asset is approved and validated on supported devices.",
      evidenceNote: getPlacementEvidencePolicy({ evidenceMode }).reason,
    };
  }
  return {
    kind: "result",
    headline: `Routing reached P${targetP}, but no executable cluster exists yet.`,
    detail:
      "The next item pool remains blueprint-only. No level is inferred from the missing content.",
  };
}

export default function AssessmentAnchorPlacementRunner({
  anchorSetKey,
}: {
  anchorSetKey: NumberOperationsAnchorSet["key"];
}) {
  const anchorSet = useMemo(() => {
    const set = getNumberOperationsAnchorSet(anchorSetKey);
    if (!set) throw new Error(`Unknown Number & Operations anchor set: ${anchorSetKey}`);
    return set;
  }, [anchorSetKey]);
  const [stage, setStage] = useState<RunnerStage>(() => ({
    kind: "initial",
    pLevel: getNumberOperationsAnchorSet(anchorSetKey)?.initialP || 1,
  }));
  const [initialPair, setInitialPair] = useState<
    [BinaryAnchorResult, BinaryAnchorResult] | null
  >(null);
  const [resolvedInitialRoute, setResolvedInitialRoute] =
    useState<InitialAnchorRoute | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const reset = useCallback(() => {
    const set = getNumberOperationsAnchorSet(anchorSetKey);
    setStage({ kind: "initial", pLevel: set?.initialP || 1 });
    setInitialPair(null);
    setResolvedInitialRoute(null);
    setHistory([]);
  }, [anchorSetKey]);

  const pushHistory = useCallback(
    (entry: string) => setHistory((current) => [...current, entry]),
    [],
  );

  const advanceToBranch = useCallback((route: InitialAnchorRoute) => {
    if (route.kind !== "down" && route.kind !== "up") return;
    const items = getAnchorCluster(anchorSet.key, route.targetP);
    pushHistory(
      `Initial evidence routed ${route.kind} from P${anchorSet.initialP} to P${route.targetP}.`,
    );
    if (!items) {
      setStage(resultForUnavailableTarget(anchorSet, route.targetP));
      return;
    }
    setStage({
      kind: "branch",
      pLevel: route.targetP,
      direction: route.kind,
    });
  }, [anchorSet, pushHistory]);

  const handleInitialComplete = useCallback(
    (responses: MyLearnaAssessmentResponse[]) => {
      const pair = pairFromResponses(responses);
      setInitialPair(pair);
      const route = routeInitialAnchor(anchorSet, pair);
      setResolvedInitialRoute(route);

      if (route.kind === "same-level-extra") {
        const reserve = getReserveItem(anchorSet.key, anchorSet.initialP);
        pushHistory(
          `Initial P${anchorSet.initialP} cluster was mixed (1/2); reserve probe required.`,
        );
        if (!reserve) {
          setStage({
            kind: "result",
            headline: "Mixed anchor evidence cannot be resolved yet.",
            detail:
              "A same-level reserve probe is required before routing can continue.",
          });
          return;
        }
        setStage({ kind: "reserve", pLevel: anchorSet.initialP });
        return;
      }

      if (route.kind === "down" || route.kind === "up") {
        advanceToBranch(route);
      }
    },
    [anchorSet, advanceToBranch, pushHistory],
  );

  const handleReserveComplete = useCallback(
    (responses: MyLearnaAssessmentResponse[]) => {
      if (!initialPair || !responses[0]) return;
      const reserve: BinaryAnchorResult = responses[0].correct ? 1 : 0;
      const route = resolveInitialAnchorWithReserve(
        anchorSet,
        initialPair,
        reserve,
      );
      setResolvedInitialRoute(route);
      pushHistory(
        `Reserve P${anchorSet.initialP} probe was ${reserve ? "supported" : "not supported"}.`,
      );
      advanceToBranch(route);
    },
    [anchorSet, advanceToBranch, initialPair, pushHistory],
  );

  const handleBranchComplete = useCallback(
    (responses: MyLearnaAssessmentResponse[]) => {
      if (!resolvedInitialRoute) return;
      const pair = pairFromResponses(responses);
      const route = routeBranchAnchor(anchorSet, resolvedInitialRoute, pair);

      if (route.kind === "bracket") {
        const bracket = bracketFromBranchRoute(route);
        const nextP = bracket ? nextBoundaryTarget(bracket) : null;
        pushHistory(
          `Branch evidence located P${route.lowerP}–P${route.upperP}.`,
        );
        setStage({
          kind: "result",
          headline: `Candidate neighbourhood: P${route.lowerP}–P${route.upperP}`,
          detail: nextP
            ? `The next deterministic boundary target is P${nextP}. No placement is claimed until construct-diverse boundary evidence is collected.`
            : "The levels are adjacent. A construct-diverse boundary-confirmation set is required before any exact placement language.",
          bracket: { lowerP: route.lowerP, upperP: route.upperP },
        });
        return;
      }

      if (route.kind === "search-down" || route.kind === "search-up") {
        const targetP = nextSearchTarget(anchorSet, route);
        if (!targetP) {
          setStage({
            kind: "result",
            headline: "Progression endpoint reached.",
            detail:
              "The routing evidence reached the end of the current progression. Report open-ended endpoint language rather than inventing an outside level.",
          });
          return;
        }
        const items = getSearchCluster(anchorSet.key, targetP);
        pushHistory(
          `Branch evidence remained clear; continue ${route.kind === "search-up" ? "up" : "down"} to P${targetP}.`,
        );
        if (!items) {
          setStage(resultForUnavailableTarget(anchorSet, targetP));
          return;
        }
        setStage({
          kind: "search",
          pLevel: targetP,
          direction: route.kind === "search-up" ? "up" : "down",
        });
      }
    },
    [anchorSet, pushHistory, resolvedInitialRoute],
  );

  const handleSearchComplete = useCallback(
    (responses: MyLearnaAssessmentResponse[]) => {
      if (stage.kind !== "search") return;
      const pair = pairFromResponses(responses);
      const route = routeSearchCluster(
        anchorSet,
        stage.direction,
        stage.pLevel,
        pair,
      );

      if (route.kind === "bracket") {
        const nextP = nextBoundaryTarget({
          lowerP: route.lowerP,
          upperP: route.upperP,
        });
        pushHistory(
          `Search at P${stage.pLevel} located P${route.lowerP}–P${route.upperP}.`,
        );
        setStage({
          kind: "result",
          headline: `Candidate neighbourhood: P${route.lowerP}–P${route.upperP}`,
          detail: nextP
            ? `Next boundary target: P${nextP}. Boundary confirmation is still required.`
            : "The levels are adjacent; boundary confirmation is required before placement.",
          bracket: { lowerP: route.lowerP, upperP: route.upperP },
        });
        return;
      }

      if (route.kind === "endpoint") {
        pushHistory(`Search reached the P${route.pLevel} endpoint.`);
        setStage({
          kind: "result",
          headline:
            route.relation === "at-least"
              ? `Evidence reaches at least P${route.pLevel}.`
              : `Evidence is below or around P${route.pLevel}.`,
          detail:
            "This is open-ended endpoint language, not a fabricated level beyond the source progression.",
        });
        return;
      }

      if (route.kind === "search-down" || route.kind === "search-up") {
        const targetP = nextSearchTarget(anchorSet, route);
        if (!targetP) {
          setStage({
            kind: "result",
            headline: "Progression endpoint reached.",
            detail:
              "No further source progression level exists in this direction.",
          });
          return;
        }
        const items = getSearchCluster(anchorSet.key, targetP);
        pushHistory(
          `Search remains clear; continue to P${targetP}.`,
        );
        if (!items) {
          setStage(resultForUnavailableTarget(anchorSet, targetP));
          return;
        }
        setStage({
          kind: "search",
          pLevel: targetP,
          direction: route.kind === "search-up" ? "up" : "down",
        });
      }
    },
    [anchorSet, pushHistory, stage],
  );

  let player = null;
  let stageLabel = "";

  if (stage.kind === "initial") {
    const items = getAnchorCluster(anchorSet.key, stage.pLevel);
    stageLabel = `Initial anchor · P${stage.pLevel}`;
    player = items ? (
      <AssessmentPlayerV1
        key={`initial-${anchorSet.key}-${stage.pLevel}`}
        title={`${anchorSet.label} · P${stage.pLevel} initial anchor`}
        items={[...items]}
        mode="placement"
        onComplete={handleInitialComplete}
      />
    ) : null;
  } else if (stage.kind === "reserve") {
    const item = getReserveItem(anchorSet.key, stage.pLevel);
    stageLabel = `Reserve probe · P${stage.pLevel}`;
    player = item ? (
      <AssessmentPlayerV1
        key={`reserve-${anchorSet.key}-${stage.pLevel}`}
        title={`${anchorSet.label} · P${stage.pLevel} reserve probe`}
        items={[item]}
        mode="placement"
        onComplete={handleReserveComplete}
      />
    ) : null;
  } else if (stage.kind === "branch") {
    const items = getAnchorCluster(anchorSet.key, stage.pLevel);
    stageLabel = `${stage.direction === "up" ? "Upper" : "Lower"} branch · P${stage.pLevel}`;
    player = items ? (
      <AssessmentPlayerV1
        key={`branch-${anchorSet.key}-${stage.pLevel}`}
        title={`${anchorSet.label} · P${stage.pLevel} branch anchor`}
        items={[...items]}
        mode="placement"
        onComplete={handleBranchComplete}
      />
    ) : null;
  } else if (stage.kind === "search") {
    const items = getSearchCluster(anchorSet.key, stage.pLevel);
    stageLabel = `Search ${stage.direction} · P${stage.pLevel}`;
    player = items ? (
      <AssessmentPlayerV1
        key={`search-${anchorSet.key}-${stage.pLevel}`}
        title={`${anchorSet.label} · P${stage.pLevel} search cluster`}
        items={[...items]}
        mode="placement"
        onComplete={handleSearchComplete}
      />
    ) : null;
  }

  return (
    <section style={shell}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: "#6C4DF6", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
            Automatic routing proof
          </span>
          <h2 style={{ margin: 0, color: "#17204B" }}>{anchorSet.label}</h2>
          {stage.kind !== "result" ? (
            <strong style={{ color: "#5B6478" }}>{stageLabel}</strong>
          ) : null}
        </div>
        <button
          type="button"
          onClick={reset}
          style={{
            border: "1px solid #CDD3E1",
            borderRadius: 10,
            minHeight: 40,
            padding: "8px 14px",
            background: "#ffffff",
            color: "#17204B",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Restart route
        </button>
      </div>

      {stage.kind === "result" ? (
        <div
          role="status"
          style={{
            border: "1px solid #D9D0FF",
            borderRadius: 16,
            background: "#ffffff",
            padding: 16,
            display: "grid",
            gap: 8,
          }}
        >
          <strong style={{ color: "#17204B", fontSize: 20 }}>{stage.headline}</strong>
          <span style={{ color: "#5B6478", lineHeight: 1.6 }}>{stage.detail}</span>
          {stage.evidenceNote ? (
            <span style={{ color: "#92400E", lineHeight: 1.6 }}>{stage.evidenceNote}</span>
          ) : null}
        </div>
      ) : (
        player
      )}

      {history.length ? (
        <details>
          <summary style={{ cursor: "pointer", color: "#5B3BE8", fontWeight: 850 }}>
            Routing trace
          </summary>
          <ol style={{ color: "#5B6478", lineHeight: 1.6, marginBottom: 0 }}>
            {history.map((entry, index) => (
              <li key={`${entry}-${index}`}>{entry}</li>
            ))}
          </ol>
        </details>
      ) : null}
    </section>
  );
}
