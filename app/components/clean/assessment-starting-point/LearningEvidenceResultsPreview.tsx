"use client";

import { useMemo, useState } from "react";
import { getMathematicsLearningProfileFixtures } from "@/lib/clean/educationalIntelligence/mathematicsLearningProfileFixtures";
import type { MathematicsLearningProfilePresentationV1 } from "@/lib/clean/educationalIntelligence/mathematicsLearningProfilePresentation";
import type { StaffLearningEvidenceHistory } from "@/lib/clean/educationalIntelligence/persistence/staffLearningEvidenceSmoke";
import MathematicsLearningProfile from "./MathematicsLearningProfile";

const panel = {
  border: "1px solid #DDE4EE",
  borderRadius: 20,
  background: "#FFFFFF",
  padding: "clamp(18px, 4vw, 28px)",
} as const;

type PreviewAttempt = {
  id: string;
  presentation: MathematicsLearningProfilePresentationV1;
  provenanceSummary: string;
  resultCount: number;
  reviewDefaults: StaffLearningEvidenceHistory["attempts"][number]["reviewDefaults"] | null;
};

type PreviewHistory = {
  id: string;
  learnerLabel: string;
  source: "persisted" | "synthetic";
  attempts: PreviewAttempt[];
};

export default function LearningEvidenceResultsPreview({
  persistedHistory = null,
  persistedHistoryError = "",
}: {
  persistedHistory?: StaffLearningEvidenceHistory | null;
  persistedHistoryError?: string;
}) {
  const histories = useMemo<PreviewHistory[]>(() => {
    const fixtures = getMathematicsLearningProfileFixtures();
    const mixed = fixtures.find((fixture) => fixture.id === "mixed");
    const focused = fixtures.find((fixture) => fixture.id === "focused");
    const recheck = fixtures.find((fixture) => fixture.id === "recheck");
    if (!mixed || !focused || !recheck) return [];

    const persisted: PreviewHistory[] = persistedHistory
      ? [
          {
            id: "persisted-staging-history",
            learnerLabel: `${persistedHistory.learner.displayName} - real intelligence-staging history`,
            source: "persisted",
            attempts: persistedHistory.attempts.map((attempt) => ({
              id: attempt.attemptId,
              presentation: attempt.presentation,
              provenanceSummary: attempt.provenanceSummary,
              resultCount: attempt.resultCount,
              reviewDefaults: attempt.reviewDefaults,
            })),
          },
        ]
      : [];
    const fixtureAttempt = (
      fixture: typeof mixed,
      provenanceSummary: string,
    ): PreviewAttempt => ({
      id: fixture.id,
      presentation: fixture.presentation,
      provenanceSummary,
      resultCount: 5,
      reviewDefaults: null,
    });

    return [
      ...persisted,
      {
        id: "sample-history",
        learnerLabel: "Sample learner - original and recheck",
        source: "synthetic",
        attempts: [
          fixtureAttempt(
            mixed,
            "Synthetic deterministic Number & Operations fixture for design QA.",
          ),
          fixtureAttempt(
            recheck,
            "Synthetic deterministic recheck fixture for design QA.",
          ),
        ],
      },
      {
        id: "focused-history",
        learnerLabel: "Focused sample - unknown areas retained",
        source: "synthetic",
        attempts: [
          fixtureAttempt(
            focused,
            "Synthetic focused-attempt fixture with unknown areas retained.",
          ),
        ],
      },
    ];
  }, [persistedHistory]);
  const [selectedId, setSelectedId] = useState(
    persistedHistory ? "persisted-staging-history" : histories[0]?.id ?? "",
  );
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
          Staff-only · {persistedHistory ? "real staging history available" : "synthetic design fixtures"}
        </span>
        <h1 style={{ margin: 0, color: "#17204B" }}>
          My Results - Educational Intelligence Preview
        </h1>
        <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.6 }}>
          Persisted history is loaded server-side from intelligence-staging only
          when this protected Preview is explicitly configured. Synthetic fixtures
          remain available separately for design QA. Customer persistence, Portfolio
          inclusion and My Pathways mutation remain off.
        </p>
        {persistedHistoryError ? (
          <p role="alert" style={{ margin: 0, color: "#991B1B", fontWeight: 750 }}>
            {persistedHistoryError}
          </p>
        ) : null}
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
            {selected.attempts.length} append-safe {selected.attempts.length === 1 ? "attempt" : "attempts"} from {selected.source === "persisted" ? "intelligence-staging" : "synthetic fixtures"}.
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
                Provenance summary: {attempt.provenanceSummary}
              </p>
              {attempt.reviewDefaults ? (
                <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.55 }}>
                  {attempt.resultCount} results · Review {attempt.reviewDefaults.reviewState} · Confirmation {attempt.reviewDefaults.confirmationState} · Portfolio {attempt.reviewDefaults.portfolioInclusion}
                </p>
              ) : null}
            </div>
            <MathematicsLearningProfile profile={attempt.presentation} />
          </article>
        ))}
      </section>
    </div>
  );
}
