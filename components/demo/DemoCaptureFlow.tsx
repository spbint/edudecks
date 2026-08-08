import type { DemoState } from "@/lib/demo/demoTypes";
import { demoButton, demoCard, demoColors, demoSecondaryButton } from "@/components/demo/DemoShell";

export default function DemoCaptureFlow({
  state,
  onChange,
  onAdd,
  onViewPortfolio,
}: {
  state: DemoState;
  onChange: (value: string) => void;
  onAdd: () => void;
  onViewPortfolio: () => void;
}) {
  const canSave = state.captureText.trim().length > 0;
  return (
    <section aria-labelledby="demo-capture-title" style={{ ...demoCard, display: "grid", gap: 18 }}>
      <div>
        <div style={{ color: demoColors.orange, fontWeight: 900, fontSize: 12, letterSpacing: "0.06em" }}>CAPTURE</div>
        <h1 id="demo-capture-title" style={{ margin: "6px 0", fontSize: "clamp(26px, 5vw, 34px)" }}>Add a learning moment</h1>
        <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.6 }}>
          Keep the note fictional and temporary. This is the same kind of moment a parent might save after learning happens.
        </p>
      </div>
      <div style={{ display: "grid", gap: 14, maxWidth: 760 }}>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
          Learner
          <input readOnly value="Emma Carter" aria-label="Learner" style={{ border: `1px solid ${demoColors.line}`, borderRadius: 10, padding: "11px 12px", font: "inherit", background: "#f8fafc" }} />
        </label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
          Learning area
          <input readOnly value="Mathematics" aria-label="Learning area" style={{ border: `1px solid ${demoColors.line}`, borderRadius: 10, padding: "11px 12px", font: "inherit", background: "#f8fafc" }} />
        </label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
          Title
          <input readOnly value="Step 4 - Scale Simple Tasks Up and Down" aria-label="Title" style={{ border: `1px solid ${demoColors.line}`, borderRadius: 10, padding: "11px 12px", font: "inherit", background: "#f8fafc" }} />
        </label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
          What happened?
          <textarea
            value={state.captureText}
            onChange={(event) => onChange(event.target.value)}
            rows={5}
            aria-describedby="demo-capture-help"
            style={{ border: `1px solid ${demoColors.line}`, borderRadius: 10, padding: "11px 12px", font: "inherit", lineHeight: 1.5, resize: "vertical" }}
          />
        </label>
        <p id="demo-capture-help" style={{ margin: 0, color: demoColors.slate, fontSize: 13 }}>
          This note changes only the temporary fictional demo state in this browser tab.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={onAdd} disabled={!canSave} style={{ ...demoButton, opacity: canSave ? 1 : 0.55 }}>
            {state.capturedEvidence ? "Update learning moment" : "Add learning moment"}
          </button>
          {state.capturedEvidence ? (
            <button type="button" onClick={onViewPortfolio} style={demoSecondaryButton}>View Portfolio</button>
          ) : null}
        </div>
        <div role="status" aria-live="polite" style={{ minHeight: 20, color: demoColors.green, fontWeight: 800 }}>
          {state.statusMessage}
        </div>
      </div>
    </section>
  );
}
