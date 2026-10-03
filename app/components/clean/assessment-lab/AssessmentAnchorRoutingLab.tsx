"use client";

import React, { useMemo, useState } from "react";
import AssessmentPlayerV1 from "@/app/components/clean/assessment-lab/AssessmentPlayerV1";
import {
  NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS,
  NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS,
} from "@/lib/clean/assessments/placement/numberOperationsP0Items";
import {
  NUMBER_OPERATIONS_ANCHOR_SETS,
  bracketFromBranchRoute,
  nextBoundaryTarget,
  resolveInitialAnchorWithReserve,
  routeBranchAnchor,
  routeInitialAnchor,
  type BinaryAnchorResult,
  type NumberOperationsAnchorSet,
} from "@/lib/clean/assessments/placement/numberOperationsAnchors";

const card: React.CSSProperties = {
  border: "1px solid #E1E6F0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 18,
  display: "grid",
  gap: 12,
};

const smallButton: React.CSSProperties = {
  border: "1px solid #CDD3E1",
  borderRadius: 10,
  minHeight: 40,
  padding: "8px 14px",
  background: "#ffffff",
  color: "#17204B",
  fontWeight: 800,
  cursor: "pointer",
};

function ResultPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: BinaryAnchorResult;
  onChange: (value: BinaryAnchorResult) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <strong style={{ color: "#17204B", fontSize: 13 }}>{label}</strong>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {([
          [1, "Correct"],
          [0, "Incorrect"],
          [null, "Clear"],
        ] as const).map(([candidate, text]) => (
          <button
            key={text}
            type="button"
            onClick={() => onChange(candidate)}
            aria-pressed={value === candidate}
            style={{
              ...smallButton,
              borderColor: value === candidate ? "#6C4DF6" : "#CDD3E1",
              background: value === candidate ? "#F3F0FF" : "#ffffff",
              color: value === candidate ? "#4D31C5" : "#17204B",
            }}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function statusLabel(status: string) {
  if (status === "reuse-audited") return "Reuse · source audited";
  if (status === "reuse-candidate") return "Reuse candidate";
  if (status === "implemented-draft") return "Implemented draft";
  if (status === "implemented-draft-accessibility-review") return "Implemented · accessibility review";
  if (status === "new-hybrid-blueprint") return "New hybrid blueprint";
  if (status === "new-blueprint-currency-review") return "New · currency review";
  return "New blueprint";
}

function AnchorCard({
  anchor,
}: {
  anchor: NumberOperationsAnchorSet["anchors"][number];
}) {
  return (
    <article style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <span style={{ color: "#6C4DF6", fontWeight: 900, fontSize: 12, textTransform: "uppercase" }}>
            {anchor.role} anchor
          </span>
          <h3 style={{ margin: "4px 0 0", color: "#17204B" }}>
            P{anchor.pLevel}
          </h3>
        </div>
        <span style={{ color: "#64748B", fontSize: 12 }}>
          Source pages {anchor.sourcePages.join(", ")}
        </span>
      </div>
      {anchor.slots.map((item) => (
        <div
          key={item.blueprintId}
          style={{
            border: "1px solid #E7EAF2",
            borderRadius: 14,
            padding: 12,
            display: "grid",
            gap: 5,
            background: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <strong style={{ color: "#17204B" }}>
              {item.slot} · {item.construct}
            </strong>
            <span style={{ color: "#5B3BE8", fontSize: 12, fontWeight: 850 }}>
              {statusLabel(item.status)}
            </span>
          </div>
          <span style={{ color: "#5B6478", fontSize: 13 }}>
            Response: {item.responseType} · Visual: {item.trustedVisual}
          </span>
          {item.existingItemId ? (
            <code style={{ color: "#475569", fontSize: 12 }}>{item.existingItemId}</code>
          ) : null}
        </div>
      ))}
    </article>
  );
}

function describeInitialRoute(route: ReturnType<typeof routeInitialAnchor>) {
  if (route.kind === "awaiting") return "Enter both initial-anchor results.";
  if (route.kind === "down") return `Route down to P${route.targetP}.`;
  if (route.kind === "up") return `Route up to P${route.targetP}.`;
  return `Mixed result at P${route.targetP}: add a third same-level probe before branching.`;
}

function describeBranchRoute(route: ReturnType<typeof routeBranchAnchor>) {
  if (route.kind === "awaiting") return "Branch result not yet resolved.";
  if (route.kind === "search-down") {
    return `Evidence remains weak at P${route.fromP}: continue searching downward, subject to the endpoint rule.`;
  }
  if (route.kind === "search-up") {
    return `Evidence remains strong at P${route.fromP}: continue searching upward, subject to the endpoint rule.`;
  }
  return `Neighbourhood located: P${route.lowerP}–P${route.upperP}. Next step is adjacent-level boundary confirmation, not a placement claim.`;
}

export default function AssessmentAnchorRoutingLab() {
  const [selectedKey, setSelectedKey] = useState<NumberOperationsAnchorSet["key"]>(
    NUMBER_OPERATIONS_ANCHOR_SETS[0].key,
  );
  const [selectedClusterKey, setSelectedClusterKey] = useState<string | null>("number-place-value-p3");
  const [initial, setInitial] = useState<[BinaryAnchorResult, BinaryAnchorResult]>([null, null]);
  const [reserve, setReserve] = useState<BinaryAnchorResult>(null);
  const [branch, setBranch] = useState<[BinaryAnchorResult, BinaryAnchorResult]>([null, null]);

  const anchorSet = useMemo(
    () => NUMBER_OPERATIONS_ANCHOR_SETS.find((item) => item.key === selectedKey) || NUMBER_OPERATIONS_ANCHOR_SETS[0],
    [selectedKey],
  );
  const executableClusters = useMemo(
    () =>
      Object.entries(NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS).filter(([key]) =>
        key.startsWith(`${selectedKey}-`),
      ),
    [selectedKey],
  );
  const executableItems = selectedClusterKey
    ? NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS[
        selectedClusterKey as keyof typeof NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS
      ] || null
    : null;
  const reserveKey = `${selectedKey}-p${anchorSet.initialP}` as keyof typeof NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS;
  const reserveItem = NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS[reserveKey] || null;
  const initialRoute = routeInitialAnchor(anchorSet, initial);
  const resolvedInitialRoute = resolveInitialAnchorWithReserve(anchorSet, initial, reserve);
  const branchRoute = routeBranchAnchor(anchorSet, resolvedInitialRoute, branch);
  const branchBracket = bracketFromBranchRoute(branchRoute);
  const nextBoundaryP = branchBracket ? nextBoundaryTarget(branchBracket) : null;

  const reset = (key = selectedKey) => {
    setSelectedKey(key);
    const nextCluster = Object.keys(NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS).find((candidate) =>
      candidate.startsWith(`${key}-`),
    );
    setSelectedClusterKey(nextCluster || null);
    setInitial([null, null]);
    setReserve(null);
    setBranch([null, null]);
  };

  return (
    <main style={{ minHeight: "100vh", background: "#F7F8FC", padding: "clamp(18px, 4vw, 42px)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 20 }}>
        <section style={{ ...card, padding: "clamp(20px, 4vw, 30px)" }}>
          <span style={{ color: "#6C4DF6", fontWeight: 900, fontSize: 12, textTransform: "uppercase" }}>
            Internal assessment lab · routing proof
          </span>
          <h1 style={{ margin: 0, color: "#17204B", fontSize: "clamp(30px, 5vw, 46px)" }}>
            Number & Operations anchor routing
          </h1>
          <p style={{ margin: 0, maxWidth: 850, color: "#5B6478", lineHeight: 1.65 }}>
            This is a staff-only deterministic routing simulator. It locates a candidate neighbourhood from
            two-item anchor clusters. It does not save learner data, claim a progression level, or replace
            adjacent-level boundary confirmation.
          </p>

          <label style={{ display: "grid", gap: 6, maxWidth: 460 }}>
            <strong style={{ color: "#17204B" }}>Sub-element</strong>
            <select
              value={selectedKey}
              onChange={(event) => reset(event.target.value as NumberOperationsAnchorSet["key"])}
              style={{
                minHeight: 44,
                border: "1px solid #CDD3E1",
                borderRadius: 12,
                padding: "8px 12px",
                background: "#ffffff",
                color: "#17204B",
                fontWeight: 750,
              }}
            >
              {NUMBER_OPERATIONS_ANCHOR_SETS.map((item) => (
                <option key={item.key} value={item.key}>{item.label}</option>
              ))}
            </select>
          </label>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 14 }}>
          {anchorSet.anchors.map((anchor) => <AnchorCard key={anchor.progressionId} anchor={anchor} />)}
        </section>

        {executableClusters.length ? (
          <section style={card}>
            <div style={{ display: "grid", gap: 10 }}>
              <span style={{ color: "#6C4DF6", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
                Executable anchor prototype
              </span>
              <h2 style={{ margin: 0, color: "#17204B" }}>{anchorSet.label} · executable mini-cluster</h2>
              <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.6 }}>
                These draft anchor items run through the shared AssessmentPlayerV1. They are staff-lab items only,
                not calibrated placement items. Hybrid early-strategy anchors and money anchors remain blueprint-only
                until their observation/accessibility or currency-asset requirements are resolved.
              </p>
              <label style={{ display: "grid", gap: 6, maxWidth: 460 }}>
                <strong style={{ color: "#17204B" }}>Executable cluster</strong>
                <select
                  value={selectedClusterKey || ""}
                  onChange={(event) => setSelectedClusterKey(event.target.value || null)}
                  style={{
                    minHeight: 44,
                    border: "1px solid #CDD3E1",
                    borderRadius: 12,
                    padding: "8px 12px",
                    background: "#ffffff",
                    color: "#17204B",
                    fontWeight: 750,
                  }}
                >
                  {executableClusters.map(([key]) => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </label>
            </div>
            {executableItems ? (
              <AssessmentPlayerV1
                key={selectedClusterKey}
                title={`${anchorSet.label} · ${selectedClusterKey?.split("-p").pop()?.toUpperCase()} anchor mini-cluster`}
                items={[...executableItems]}
              />
            ) : null}
          </section>
        ) : (
          <section style={{ ...card, background: "#FFFDF5" }}>
            <strong style={{ color: "#92400E" }}>Blueprint only</strong>
            <p style={{ margin: 0, color: "#6B4F1D", lineHeight: 1.6 }}>
              This sub-element does not yet have an executable anchor cluster in the lab. Its remaining anchors are
              intentionally held until the relevant evidence-mode or trusted-asset dependency is resolved.
            </p>
          </section>
        )}

        <section style={card}>
          <h2 style={{ margin: 0, color: "#17204B" }}>1 · Initial anchor P{anchorSet.initialP}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <ResultPicker label="Anchor item A" value={initial[0]} onChange={(value) => setInitial([value, initial[1]])} />
            <ResultPicker label="Anchor item B" value={initial[1]} onChange={(value) => setInitial([initial[0], value])} />
          </div>
          <div role="status" style={{ borderLeft: "4px solid #6C4DF6", padding: "10px 14px", background: "#F3F0FF", color: "#17204B" }}>
            <strong>{describeInitialRoute(resolvedInitialRoute)}</strong>
          </div>
          {initialRoute.kind === "same-level-extra" ? (
            <div style={{ display: "grid", gap: 10 }}>
              <ResultPicker label="Reserve item C" value={reserve} onChange={setReserve} />
              {reserveItem ? (
                <details>
                  <summary style={{ cursor: "pointer", color: "#5B3BE8", fontWeight: 850 }}>
                    Run the reserve probe in the shared player
                  </summary>
                  <div style={{ marginTop: 12 }}>
                    <AssessmentPlayerV1
                      key={`${reserveKey}-reserve`}
                      title={`${anchorSet.label} · reserve probe`}
                      items={[reserveItem]}
                    />
                  </div>
                </details>
              ) : null}
            </div>
          ) : null}
        </section>

        <section style={card}>
          <h2 style={{ margin: 0, color: "#17204B" }}>2 · Branch anchor</h2>
          <p style={{ margin: 0, color: "#5B6478" }}>
            Enter branch results only after the initial cluster routes up or down. A 1/2 initial result requires
            an extra same-level probe first.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <ResultPicker label="Branch item A" value={branch[0]} onChange={(value) => setBranch([value, branch[1]])} />
            <ResultPicker label="Branch item B" value={branch[1]} onChange={(value) => setBranch([branch[0], value])} />
          </div>
          <div role="status" style={{ borderLeft: "4px solid #17204B", padding: "10px 14px", background: "#EEF2F7", color: "#17204B" }}>
            <strong>{describeBranchRoute(branchRoute)}</strong>
          </div>
          {branchBracket ? (
            <div style={{ border: "1px solid #D9D0FF", borderRadius: 14, padding: 14, background: "#F8F5FF" }}>
              <strong style={{ color: "#17204B" }}>Boundary search</strong>
              <p style={{ margin: "6px 0 0", color: "#5B6478", lineHeight: 1.55 }}>
                Current bracket: P{branchBracket.lowerP}–P{branchBracket.upperP}.{" "}
                {nextBoundaryP
                  ? `The deterministic next probe target is P${nextBoundaryP}. Content for that adjacent-level search is authored only after the anchor layer is validated.`
                  : "The bracket is already adjacent. The next step is a construct-diverse boundary-confirmation set, not an automatic level claim."}
              </p>
            </div>
          ) : null}
          <button type="button" onClick={() => reset()} style={{ ...smallButton, width: "fit-content" }}>
            Reset simulator
          </button>
        </section>

        <section style={{ ...card, background: "#FFFDF5" }}>
          <strong style={{ color: "#92400E" }}>Guardrail</strong>
          <p style={{ margin: 0, color: "#6B4F1D", lineHeight: 1.6 }}>
            Anchor performance only determines where to probe next. The production placement engine must gather
            adjacent-level evidence from more than one construct or indicator family before reporting an
            evidence-supported band or level.
          </p>
        </section>
      </div>
    </main>
  );
}
