import type { LearningChangePresentationV1 } from "@/lib/clean/educationalIntelligence/learningChangePresentation";

const card = {
  border: "1px solid #DDE4EE",
  borderRadius: 18,
  background: "#FFFFFF",
  padding: "clamp(16px, 3vw, 22px)",
} as const;

export default function LearningChangeComparison({
  comparison,
}: {
  comparison: LearningChangePresentationV1;
}) {
  return (
    <section aria-label={comparison.title} style={{ display: "grid", gap: 16 }}>
      <header style={{ ...card, display: "grid", gap: 8 }}>
        <span style={{ color: "#166534", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
          Deterministic evidence comparison
        </span>
        <h2 style={{ margin: 0, color: "#17204B" }}>
          {comparison.title}
        </h2>
        <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.6 }}>
          {comparison.attempts.previous.attemptLabel} · {comparison.attempts.previous.assessedDateLabel}
          {" → "}
          {comparison.attempts.current.attemptLabel} · {comparison.attempts.current.assessedDateLabel}
        </p>
        <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.6 }}>
          {comparison.explanation}
        </p>
      </header>

      <div style={{ display: "grid", gap: 14 }}>
        {comparison.areas.map((area) => (
          <article key={area.continuumId} style={{ ...card, display: "grid", gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, color: "#17204B" }}>{area.areaName}</h3>
              <p style={{ margin: "6px 0 0", color: "#334155", lineHeight: 1.55 }}>
                {area.whatChanged}
              </p>
            </div>

            <dl
              style={{
                margin: 0,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                gap: 10,
              }}
            >
              <div style={{ padding: 12, borderRadius: 12, background: "#F8FAFC" }}>
                <dt style={{ color: "#64748B", fontSize: 12, fontWeight: 850 }}>Previous</dt>
                <dd style={{ margin: "4px 0 0", color: "#17204B", fontWeight: 800 }}>
                  {area.previous.statusLabel}
                </dd>
                <dd style={{ margin: "4px 0 0", color: "#4B5563" }}>
                  {area.previous.evidenceLabel}
                </dd>
              </div>
              <div style={{ padding: 12, borderRadius: 12, background: "#F3F0FF" }}>
                <dt style={{ color: "#64748B", fontSize: 12, fontWeight: 850 }}>Current</dt>
                <dd style={{ margin: "4px 0 0", color: "#17204B", fontWeight: 800 }}>
                  {area.current.statusLabel}
                </dd>
                <dd style={{ margin: "4px 0 0", color: "#4B5563" }}>
                  {area.current.evidenceLabel}
                </dd>
              </div>
            </dl>

            <details>
              <summary style={{ cursor: "pointer", color: "#17204B", fontWeight: 850 }}>
                Evidence and recommendation detail
              </summary>
              <div style={{ display: "grid", gap: 8, marginTop: 10, color: "#4B5563", lineHeight: 1.55 }}>
                <p style={{ margin: 0 }}>
                  <strong>{area.evidenceChange.label}.</strong> {area.evidenceChange.explanation}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>{area.interpretationChange.label}.</strong> {area.interpretationChange.explanation}
                </p>
                <p style={{ margin: 0 }}>{area.practicalConfirmation.label}.</p>
                <p style={{ margin: 0 }}>{area.recommendationChange.label}.</p>
              </div>
            </details>

            <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 10 }}>
              <strong style={{ color: "#17204B" }}>Current next learning</strong>
              <p style={{ margin: "5px 0 0", color: "#4B5563", lineHeight: 1.55 }}>
                {area.currentNextLearning.label}. {area.currentNextLearning.reason}
              </p>
              {area.currentNextLearning.href ? (
                <a
                  href={area.currentNextLearning.href}
                  style={{ display: "inline-block", marginTop: 8, color: "#5B3BE8", fontWeight: 850 }}
                >
                  Continue learning
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <p style={{ ...card, margin: 0, color: "#4B5563", lineHeight: 1.6 }}>
        {comparison.evidenceNote} No comparison changes My Pathways or rewrites either historical result.
      </p>
    </section>
  );
}
