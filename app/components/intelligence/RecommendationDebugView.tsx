"use client";

import type { RecommendationDebugInfo } from "@/lib/intelligence/recommendations/types";

export default function RecommendationDebugView({ debug }: { debug: RecommendationDebugInfo | null }) {
  if (!debug) return null;
  return (
    <details style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 12, background: "#f8fafc" }}>
      <summary style={{ cursor: "pointer", fontWeight: 700 }}>Recommendation debug</summary>
      <dl style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: 8, margin: "12px 0 0" }}>
        <dt>Eligibility</dt><dd style={{ margin: 0 }}>{debug.eligibility}</dd>
        <dt>Rule version</dt><dd style={{ margin: 0 }}>{debug.ruleVersion}</dd>
        <dt>Reason codes</dt><dd style={{ margin: 0 }}>{debug.reasonCodes.length}</dd>
        <dt>Exclusions</dt><dd style={{ margin: 0 }}>{debug.exclusions.length}</dd>
        <dt>Ownership matches</dt><dd style={{ margin: 0 }}>{debug.ownershipMatches.length}</dd>
      </dl>
      {debug.exclusions.length ? <ul>{debug.exclusions.map((item) => <li key={item.recommendationId}>{item.recommendationId}: {item.reason}</li>)}</ul> : null}
    </details>
  );
}
