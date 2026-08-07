import Link from "next/link";
import type { DemoReportViewModel, DemoState } from "@/lib/demo/demoTypes";
import { demoButton, demoCard, demoColors, demoSecondaryButton } from "@/components/demo/DemoShell";

export default function DemoReport({
  model,
  state,
  onKeepExploring,
}: {
  model: DemoReportViewModel;
  state: DemoState;
  onKeepExploring: () => void;
}) {
  return (
    <section aria-labelledby="demo-report-title" style={{ ...demoCard, display: "grid", gap: 18 }}>
      <div>
        <div style={{ color: demoColors.purple, fontWeight: 900, fontSize: 12, letterSpacing: "0.06em" }}>REPORT</div>
        <h1 id="demo-report-title" style={{ margin: "6px 0", fontSize: "clamp(26px, 5vw, 34px)" }}>A useful family report story</h1>
        <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.6 }}>
          {model.familyLabel} · {model.learnerLabel} · {model.reportingPeriod}
        </p>
      </div>
      <div role="note" style={{ border: "1px solid #ddd6fe", borderRadius: 12, background: "#faf5ff", padding: 12, color: "#5b21b6", fontWeight: 800 }}>
        {model.disclaimer}
      </div>
      <article style={{ border: `1px solid ${demoColors.line}`, borderRadius: 16, padding: 16, background: "#ffffff" }}>
        <h2 style={{ marginTop: 0, fontSize: 21 }}>Summary</h2>
        <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.65 }}>{model.summary}</p>
      </article>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        <article style={{ border: `1px solid ${demoColors.line}`, borderRadius: 16, padding: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>Evidence</h2>
          {model.evidenceEntries.map((entry) => (
            <div key={entry.id} style={{ borderTop: `1px solid ${demoColors.line}`, padding: "12px 0" }}>
              <strong>{entry.title}</strong>
              <div style={{ color: demoColors.slate, fontSize: 13, marginTop: 3 }}>{entry.learningArea} · {entry.observedOn}</div>
              <p style={{ margin: "7px 0 0", color: demoColors.slate, lineHeight: 1.5 }}>{entry.description}</p>
              <small style={{ color: demoColors.purple }}>{entry.sourceLabel}</small>
              <div role="img" aria-label={entry.imageAlt} style={{ marginTop: 8, borderRadius: 8, border: "1px dashed #cbd5e1", padding: 8, color: demoColors.slate, background: "#f8fafc", fontSize: 12 }}>
                {entry.imagePlaceholder} · image slot: {entry.imageKey}
              </div>
            </div>
          ))}
        </article>
        <article style={{ border: `1px solid ${demoColors.line}`, borderRadius: 16, padding: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>Portfolio selections</h2>
          {model.portfolioSelections.map((selection) => (
            <div key={selection.id} style={{ borderTop: `1px solid ${demoColors.line}`, padding: "12px 0" }}>
              <strong>{selection.title}</strong>
              <p style={{ margin: "7px 0 0", color: demoColors.slate, lineHeight: 1.5 }}>{selection.reason}</p>
            </div>
          ))}
        </article>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        <article style={{ border: `1px solid ${demoColors.line}`, borderRadius: 16, padding: 16 }}><h2 style={{ marginTop: 0, fontSize: 19 }}>Strengths</h2><ul>{model.strengths.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article style={{ border: `1px solid ${demoColors.line}`, borderRadius: 16, padding: 16 }}><h2 style={{ marginTop: 0, fontSize: 19 }}>Focus areas</h2><ul>{model.focusAreas.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article style={{ border: `1px solid ${demoColors.line}`, borderRadius: 16, padding: 16 }}><h2 style={{ marginTop: 0, fontSize: 19 }}>Suggested next steps</h2><ul>{model.suggestedNextSteps.map((item) => <li key={item}>{item}</li>)}</ul></article>
      </div>
      {state.captureIncludedInPortfolio ? (
        <section aria-label="Demo completion" style={{ border: "1px solid #bfdbfe", borderRadius: 16, padding: 16, background: "#f8fbff", display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>You’ve taken one learning moment from today’s plan into a printable family report.</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/start-free?source=demo-complete" style={demoButton}>Use MyLearna with your family</Link>
            <button type="button" onClick={onKeepExploring} style={demoSecondaryButton}>Keep exploring</button>
          </div>
        </section>
      ) : null}
    </section>
  );
}
