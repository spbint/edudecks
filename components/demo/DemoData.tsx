"use client";

import { carterFamilyDemo } from "@/lib/demo/carterFamilyDemoData";
import { demoButton, demoCard, demoColors } from "@/components/demo/DemoShell";

export default function DemoData({ onNext }: { onNext: () => void }) {
  const cards = [
    ["Evidence collected", carterFamilyDemo.data.evidenceCollected],
    ["Learning momentum", carterFamilyDemo.data.learningMomentum],
    ["Pathway activity", carterFamilyDemo.data.pathwayActivity],
    ["Reporting readiness", carterFamilyDemo.data.reportingReadiness],
  ];

  return (
    <section id="demo-data" style={{ ...demoCard, display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: demoColors.blue, fontWeight: 900, fontSize: 12 }}>
            MY DATA DEMO
          </div>
          <h2 style={{ margin: "6px 0", fontSize: 30 }}>A simple March data snapshot</h2>
          <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.7 }}>
            Demo data summarizes momentum, evidence, pathways, strengths, and focus areas.
          </p>
        </div>
        <button type="button" onClick={onNext} style={demoButton}>
          Preview report
        </button>
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {cards.map(([label, value]) => (
          <div key={label} style={{ border: `1px solid ${demoColors.line}`, borderRadius: 18, padding: 16, background: "#fbfdff" }}>
            <div style={{ color: demoColors.slate, fontSize: 12, fontWeight: 900 }}>{label}</div>
            <strong style={{ fontSize: 22 }}>{value}</strong>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {(["Emma", "Noah"] as const).map((name) => (
          <article key={name} style={{ border: `1px solid ${demoColors.line}`, borderRadius: 18, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>{name}</h3>
            <strong>Strengths</strong>
            <ul style={{ color: demoColors.slate }}>
              {carterFamilyDemo.data.strengths[name].map((item) => <li key={item}>{item}</li>)}
            </ul>
            <strong>Focus areas</strong>
            <ul style={{ color: demoColors.slate }}>
              {carterFamilyDemo.data.focusAreas[name].map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
