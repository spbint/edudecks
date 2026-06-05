"use client";

import { carterFamilyDemo } from "@/lib/demo/carterFamilyDemoData";
import { demoButton, demoCard, demoColors } from "@/components/demo/DemoShell";

export default function DemoReports({ onNext }: { onNext: () => void }) {
  return (
    <section id="demo-reports" style={{ ...demoCard, display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: demoColors.purple, fontWeight: 900, fontSize: 12 }}>
            MY REPORTS DEMO
          </div>
          <h2 style={{ margin: "6px 0", fontSize: 30 }}>March 2026 monthly report preview</h2>
          <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.7 }}>
            A fictional report preview using Carter Family sample data only.
          </p>
        </div>
        <button type="button" onClick={onNext} style={demoButton}>
          Download sample output
        </button>
      </div>
      {(["Emma", "Noah"] as const).map((name) => (
        <article key={name} style={{ border: `1px solid ${demoColors.line}`, borderRadius: 18, padding: 18, background: "#fbfdff" }}>
          <h3 style={{ marginTop: 0 }}>{name} Carter</h3>
          {carterFamilyDemo.reports[name].split("\n\n").map((paragraph) => (
            <p key={paragraph} style={{ color: demoColors.slate, lineHeight: 1.7 }}>{paragraph}</p>
          ))}
          <strong>Suggested next steps</strong>
          <ul style={{ color: demoColors.slate }}>
            {carterFamilyDemo.reports.nextSteps[name].map((step) => <li key={step}>{step}</li>)}
          </ul>
        </article>
      ))}
    </section>
  );
}
