"use client";

import { useState } from "react";
import { demoPdfLabels, downloadCarterFamilyDemoPdf } from "@/lib/demo/demoPdf";
import { carterFamilyDemo } from "@/lib/demo/carterFamilyDemoData";
import {
  demoButton,
  demoCard,
  demoColors,
  demoSecondaryButton,
} from "@/components/demo/DemoShell";

export default function DemoOutputs() {
  const [pendingOutput, setPendingOutput] = useState<string | null>(null);

  function download() {
    if (!pendingOutput) return;
    downloadCarterFamilyDemoPdf(pendingOutput);
    setPendingOutput(null);
  }

  return (
    <section id="demo-outputs" style={{ ...demoCard, display: "grid", gap: 18 }}>
      <div>
        <div style={{ color: demoColors.orange, fontWeight: 900, fontSize: 12 }}>
          MY OUTPUTS DEMO
        </div>
        <h2 style={{ margin: "6px 0", fontSize: 30 }}>Demo-only PDF outputs</h2>
        <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.7 }}>
          These outputs are generated only from static fictional Carter Family demo data.
          They do not use the real My Reports, My Outputs, or PDF engine.
        </p>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {carterFamilyDemo.outputs.map((output) => (
          <article key={output} style={{ border: `1px solid ${demoColors.line}`, borderRadius: 18, padding: 16, background: "#ffffff", display: "grid", gap: 12 }}>
            <strong style={{ fontSize: 18 }}>{output}</strong>
            <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.6 }}>
              Preview a sample {output.toLowerCase()} for the fictional Carter Family.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a href="#demo-reports" style={demoSecondaryButton}>Preview demo output</a>
              <button type="button" onClick={() => setPendingOutput(output)} style={demoButton}>
                Download sample demo PDF
              </button>
            </div>
          </article>
        ))}
      </div>

      <div style={{ border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: 16, padding: 14, color: "#1e40af", lineHeight: 1.6 }}>
        <strong>{demoPdfLabels.header}</strong>
        <br />
        {demoPdfLabels.subheader}
        <br />
        Footer label: {demoPdfLabels.footer}
      </div>

      {pendingOutput ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm demo PDF download"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(15,23,42,0.45)",
            display: "grid",
            placeItems: "center",
            padding: 18,
          }}
        >
          <div style={{ ...demoCard, maxWidth: 520, display: "grid", gap: 14 }}>
            <h3 style={{ margin: 0 }}>Download sample demo PDF?</h3>
            <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.7 }}>
              {demoPdfLabels.beforeDownload}
            </p>
            <p style={{ margin: 0, color: demoColors.slate }}>
              Output: <strong>{pendingOutput}</strong>
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setPendingOutput(null)} style={demoSecondaryButton}>
                Cancel
              </button>
              <button type="button" onClick={download} style={demoButton}>
                Download demo PDF
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
