import { demoEvidenceDataset } from "@/lib/demo/demoEvidenceDataset";
import type { DemoState } from "@/lib/demo/demoTypes";
import { demoButton, demoCard, demoColors, demoSecondaryButton } from "@/components/demo/DemoShell";

export default function DemoPortfolioFlow({
  state,
  onAddToPortfolio,
  onViewReport,
}: {
  state: DemoState;
  onAddToPortfolio: () => void;
  onViewReport: () => void;
}) {
  return (
    <section aria-labelledby="demo-portfolio-title" style={{ ...demoCard, display: "grid", gap: 18 }}>
      <div>
        <div style={{ color: demoColors.green, fontWeight: 900, fontSize: 12, letterSpacing: "0.06em" }}>PORTFOLIO</div>
        <h1 id="demo-portfolio-title" style={{ margin: "6px 0", fontSize: "clamp(26px, 5vw, 34px)" }}>Keep the learning story together</h1>
        <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.6 }}>
          These fictional Carter items show how a parent can choose useful evidence for a portfolio.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {demoEvidenceDataset.evidence.filter((item) => item.includeInPortfolio).map((item) => (
          <article key={item.id} style={{ border: `1px solid ${demoColors.line}`, borderRadius: 16, padding: 16, background: "#ffffff" }}>
            <span style={{ color: demoColors.purple, fontWeight: 900, fontSize: 12 }}>{item.learnerId === "emma" ? "Emma Carter" : "Noah Carter"} · FICTIONAL DEMO ITEM</span>
            <h2 style={{ margin: "7px 0", fontSize: 19 }}>{item.title}</h2>
            <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.55 }}>{item.shortDescription}</p>
            <div role="img" aria-label={item.imageAlt} style={{ marginTop: 12, borderRadius: 10, border: "1px dashed #cbd5e1", padding: 10, color: demoColors.slate, background: "#f8fafc", fontSize: 12 }}>
              {item.imagePlaceholder} · image slot: {item.imageKey}
            </div>
          </article>
        ))}
        {state.capturedEvidence ? (
          <article style={{ border: "2px solid #86efac", borderRadius: 16, padding: 16, background: "#f0fdf4" }}>
            <span style={{ color: demoColors.green, fontWeight: 900, fontSize: 12 }}>YOUR TEMPORARY DEMO ADDITION</span>
            <h2 style={{ margin: "7px 0", fontSize: 19 }}>{state.capturedEvidence.title}</h2>
            <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.55 }}>{state.capturedEvidence.note}</p>
            <div role="img" aria-label={state.capturedEvidence.imageAlt} style={{ marginTop: 12, borderRadius: 10, border: "1px dashed #86efac", padding: 10, color: demoColors.slate, background: "#ffffff", fontSize: 12 }}>
              {state.capturedEvidence.imagePlaceholder} · image slot: {state.capturedEvidence.imageKey}
            </div>
            {!state.captureIncludedInPortfolio ? (
              <button type="button" onClick={onAddToPortfolio} style={{ ...demoButton, marginTop: 14 }}>Add to portfolio</button>
            ) : (
              <p role="status" style={{ margin: "14px 0 0", color: demoColors.green, fontWeight: 800 }}>Included in this demo portfolio.</p>
            )}
          </article>
        ) : null}
      </div>
      {!state.capturedEvidence ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <p style={{ margin: 0, color: demoColors.slate }}>Capture one moment first to see it appear here.</p>
          <button type="button" onClick={onViewReport} style={demoSecondaryButton}>View sample report</button>
        </div>
      ) : state.captureIncludedInPortfolio ? (
        <button type="button" onClick={onViewReport} style={{ ...demoButton, justifySelf: "start" }}>Review the report</button>
      ) : null}
    </section>
  );
}
