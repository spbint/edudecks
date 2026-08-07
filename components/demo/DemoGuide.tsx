import type { DemoState, DemoViewId } from "@/lib/demo/demoTypes";
import { demoCard, demoColors } from "@/components/demo/DemoShell";

const steps: Array<{ id: DemoViewId; title: string; hint: string }> = [
  { id: "today", title: "Today", hint: "Choose one learning moment." },
  { id: "capture", title: "Capture", hint: "Add a quick fictional learning note." },
  { id: "portfolio", title: "Portfolio", hint: "Keep it in Emma’s learning story." },
  { id: "report", title: "Report", hint: "See useful reporting evidence." },
];

export default function DemoGuide({
  state,
  onNavigate,
}: {
  state: DemoState;
  onNavigate: (view: DemoViewId) => void;
}) {
  return (
    <section aria-labelledby="demo-guide-title" style={{ ...demoCard, padding: "16px 18px", display: "grid", gap: 12 }}>
      <div>
        <div style={{ color: demoColors.blue, fontWeight: 900, fontSize: 12, letterSpacing: "0.06em" }}>
          TRY THE WORKFLOW
        </div>
        <h2 id="demo-guide-title" style={{ margin: "5px 0 0", fontSize: 20 }}>
          One learning moment, four useful steps
        </h2>
      </div>
      <ol style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
        {steps.map((step, index) => {
          const completed =
            (step.id === "today" && Boolean(state.capturedEvidence)) ||
            (step.id === "capture" && Boolean(state.capturedEvidence)) ||
            (step.id === "portfolio" && state.captureIncludedInPortfolio) ||
            (step.id === "report" && state.captureIncludedInPortfolio);
          const active = state.activeView === step.id;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onNavigate(step.id)}
                style={{
                  width: "100%",
                  minHeight: 62,
                  textAlign: "left",
                  border: `1px solid ${active ? "#93c5fd" : demoColors.line}`,
                  borderRadius: 12,
                  background: active ? "#eff6ff" : "#ffffff",
                  padding: "9px 10px",
                  color: demoColors.navy,
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "block", color: completed ? demoColors.green : demoColors.slate, fontSize: 12, fontWeight: 900 }}>
                  {completed ? "Complete" : `Step ${index + 1}`}
                </span>
                <strong style={{ display: "block", marginTop: 3 }}>{step.title}</strong>
                <span style={{ display: "block", marginTop: 2, color: demoColors.slate, fontSize: 12, lineHeight: 1.35 }}>
                  {step.hint}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
