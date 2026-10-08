"use client";

import { useMemo, useState } from "react";
import MathematicsLearningProfile from "./MathematicsLearningProfile";
import { getMathematicsLearningProfileFixtures } from "@/lib/clean/educationalIntelligence/mathematicsLearningProfileFixtures";
import { MATHEMATICS_LEARNING_PROFILE_STATUS_COPY } from "@/lib/clean/educationalIntelligence/mathematicsLearningProfilePresentation";

const reviewCard = {
  border: "1px solid #DDE4EE",
  borderRadius: 20,
  background: "#FFFFFF",
  padding: "clamp(18px, 4vw, 26px)",
  display: "grid",
  gap: 12,
} as const;

export default function MathematicsLearningProfilePreview() {
  const fixtures = useMemo(() => getMathematicsLearningProfileFixtures(), []);
  const [selectedId, setSelectedId] = useState(fixtures[0]?.id ?? "mixed");
  const selected =
    fixtures.find((fixture) => fixture.id === selectedId) ?? fixtures[0];

  if (!selected) return null;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section style={reviewCard} aria-labelledby="profile-fixture-heading">
        <span
          style={{
            color: "#166534",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: ".045em",
            textTransform: "uppercase",
          }}
        >
          Staff-only synthetic review
        </span>
        <h2 id="profile-fixture-heading" style={{ margin: 0, color: "#17204B" }}>
          Choose a profile fixture
        </h2>
        <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.6 }}>
          These fixtures contain no real learner data and are not persisted. Use them to review mixed states, focused unknowns, rechecks, print layout and PDF output.
        </p>
        <label style={{ display: "grid", gap: 6, maxWidth: 460 }}>
          <strong style={{ color: "#17204B" }}>Profile state</strong>
          <select
            value={selected.id}
            onChange={(event) => setSelectedId(event.target.value as typeof selected.id)}
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
            {fixtures.map((fixture) => (
              <option key={fixture.id} value={fixture.id}>{fixture.label}</option>
            ))}
          </select>
        </label>
        <span style={{ color: "#64748B", lineHeight: 1.5 }}>{selected.description}</span>
      </section>

      <section style={reviewCard} aria-labelledby="status-language-heading">
        <h2 id="status-language-heading" style={{ margin: 0, color: "#17204B" }}>
          Six-status language review
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 10,
          }}
        >
          {Object.entries(MATHEMATICS_LEARNING_PROFILE_STATUS_COPY).map(
            ([status, copy]) => (
              <article
                key={status}
                style={{
                  border: "1px solid #E1E6F0",
                  borderRadius: 14,
                  background: "#FAFBFD",
                  padding: 13,
                  display: "grid",
                  gap: 6,
                }}
              >
                <strong style={{ color: "#17204B" }}>{copy.label}</strong>
                <span style={{ color: "#4B5563", lineHeight: 1.5, fontSize: 14 }}>
                  {copy.explanation}
                </span>
              </article>
            ),
          )}
        </div>
      </section>

      <MathematicsLearningProfile key={selected.id} profile={selected.presentation} />
    </div>
  );
}
