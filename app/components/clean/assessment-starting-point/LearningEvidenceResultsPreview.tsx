"use client";

import { useMemo, useState } from "react";
import { getMathematicsLearningProfileFixtures } from "@/lib/clean/educationalIntelligence/mathematicsLearningProfileFixtures";
import MathematicsLearningProfile from "./MathematicsLearningProfile";

const panel = {
  border: "1px solid #DDE4EE",
  borderRadius: 20,
  background: "#FFFFFF",
  padding: "clamp(18px, 4vw, 28px)",
} as const;

export default function LearningEvidenceResultsPreview() {
  const histories = useMemo(() => {
    const fixtures = getMathematicsLearningProfileFixtures();
    const mixed = fixtures.find((fixture) => fixture.id === "mixed");
    const focused = fixtures.find((fixture) => fixture.id === "focused");
    const recheck = fixtures.find((fixture) => fixture.id === "recheck");
    if (!mixed || !focused || !recheck) return [];
    return [
      {
        id: "sample-history",
        learnerLabel: "Sample learner — original and recheck",
        attempts: [mixed, recheck],
      },
      {
        id: "focused-history",
        learnerLabel: "Focused sample — unknown areas retained",
        attempts: [focused],
      },
    ];
  }, []);
  const [selectedId, setSelectedId] = useState(histories[0]?.id ?? "");
  const selected = histories.find((history) => history.id === selectedId);

  if (!selected) return null;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header style={{ ...panel, display: "grid", gap: 10 }}>
        <span
          style={{
            color: "#166534",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: ".045em",
            textTransform: "uppercase",
          }}
        >
          Staff-only · synthetic data · no database writes
        </span>
        <h1 style={{ margin: 0, color: "#17204B" }}>
          My Results — Educational Intelligence Preview
        </h1>
        <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.6 }}>
          This local presentation proves the history shape only. Customer persistence,
          Portfolio inclusion and My Pathways mutation remain off.
        </p>
        <label style={{ display: "grid", gap: 6, maxWidth: 480 }}>
          <strong style={{ color: "#17204B" }}>Test learner history</strong>
          <select
            value={selected.id}
            onChange={(event) => setSelectedId(event.target.value)}
            style={{
              minHeight: 44,
              border: "1px solid #CBD5E1",
              borderRadius: 10,
              padding: "8px 10px",
              background: "#FFFFFF",
              color: "#17204B",
              font: "inherit",
            }}
          >
            {histories.map((history) => (
              <option key={history.id} value={history.id}>
                {history.learnerLabel}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section aria-labelledby="attempt-history-heading" style={{ display: "grid", gap: 16 }}>
        <div style={panel}>
          <h2 id="attempt-history-heading" style={{ margin: 0, color: "#17204B" }}>
            Attempt history
          </h2>
          <p style={{ margin: "8px 0 0", color: "#4B5563", lineHeight: 1.55 }}>
            {selected.attempts.length} append-safe {selected.attempts.length === 1 ? "attempt" : "attempts"}.
            Each five-area profile remains independent and recommendations are historical,
            not executed actions.
          </p>
        </div>

        {selected.attempts.map((attempt, index) => (
          <article key={attempt.id} style={{ display: "grid", gap: 12 }}>
            <div style={{ ...panel, display: "grid", gap: 7 }}>
              <span style={{ color: "#64748B", fontWeight: 800 }}>
                Attempt {index + 1} of {selected.attempts.length}
              </span>
              <h3 style={{ margin: 0, color: "#17204B" }}>
                {attempt.presentation.assessment.attemptLabel} · {attempt.presentation.assessment.assessedDateLabel}
              </h3>
              <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.55 }}>
                Provenance summary: deterministic Number & Operations Starting Point
                interpretation, Learning Evidence Result V1, five continuum records.
              </p>
            </div>
            <MathematicsLearningProfile profile={attempt.presentation} />
          </article>
        ))}
      </section>
    </div>
  );
}
