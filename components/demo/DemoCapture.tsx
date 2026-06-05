"use client";

import { carterFamilyDemo } from "@/lib/demo/carterFamilyDemoData";
import { demoButton, demoCard, demoColors } from "@/components/demo/DemoShell";

export default function DemoCapture({ onNext }: { onNext: () => void }) {
  return (
    <section id="demo-capture" style={{ ...demoCard, display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: demoColors.orange, fontWeight: 900, fontSize: 12 }}>
            MY CAPTURE DEMO
          </div>
          <h2 style={{ margin: "6px 0", fontSize: 30 }}>Evidence captured from learning</h2>
          <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.7 }}>
            Fictional evidence cards show how a parent might keep work samples,
            observations, and notes after learning happens.
          </p>
        </div>
        <button type="button" onClick={onNext} style={demoButton}>
          Build portfolio
        </button>
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
        {carterFamilyDemo.evidence.map((item) => (
          <article key={item.id} style={{ border: `1px solid ${demoColors.line}`, borderRadius: 18, padding: 16, background: "#fbfdff" }}>
            <span style={{ color: demoColors.blue, fontWeight: 900, fontSize: 12 }}>
              {item.learnerId === "emma" ? "Emma Carter" : "Noah Carter"}
            </span>
            <h3 style={{ margin: "7px 0", fontSize: 18 }}>{item.title}</h3>
            <strong style={{ color: demoColors.orange }}>{item.type}</strong>
            <p style={{ color: demoColors.slate, lineHeight: 1.6 }}>{item.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
