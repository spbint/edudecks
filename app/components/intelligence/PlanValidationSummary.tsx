"use client";

import type { ReviewValidationResult } from "@/lib/intelligence/plans/reviewTypes";

export default function PlanValidationSummary({ validation }: { validation: ReviewValidationResult | null }) {
  if (!validation) return null;
  return (
    <div
      role={validation.valid ? "status" : "alert"}
      aria-live="polite"
      style={{
        border: `1px solid ${validation.valid ? "#bbf7d0" : "#fecdd3"}`,
        borderRadius: 12,
        padding: 12,
        background: validation.valid ? "#f0fdf4" : "#fff1f2",
        color: validation.valid ? "#166534" : "#9f1239",
      }}
    >
      <strong>{validation.valid ? "Plan is valid." : "Plan needs attention."}</strong>
      {validation.issues.length ? (
        <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
          {validation.issues.map((issue) => <li key={issue}>{issue}</li>)}
        </ul>
      ) : null}
    </div>
  );
}
