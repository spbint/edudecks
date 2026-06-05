"use client";

import { carterFamilyDemo } from "@/lib/demo/carterFamilyDemoData";
import { demoButton, demoCard, demoColors } from "@/components/demo/DemoShell";

export default function DemoPortfolio({ onNext }: { onNext: () => void }) {
  return (
    <section id="demo-portfolio" style={{ ...demoCard, display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: demoColors.green, fontWeight: 900, fontSize: 12 }}>
            MY PORTFOLIO DEMO
          </div>
          <h2 style={{ margin: "6px 0", fontSize: 30 }}>Selected portfolio items</h2>
          <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.7 }}>
            Portfolio selections include the reason each sample is useful for records.
          </p>
        </div>
        <button type="button" onClick={onNext} style={demoButton}>
          Review data
        </button>
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))" }}>
        {carterFamilyDemo.portfolio.map((item) => (
          <article key={item.id} style={{ border: `1px solid ${demoColors.line}`, borderRadius: 18, padding: 16, background: "#ffffff" }}>
            <span style={{ color: demoColors.purple, fontWeight: 900, fontSize: 12 }}>
              {item.learnerId === "emma" ? "Emma portfolio" : "Noah portfolio"}
            </span>
            <h3 style={{ margin: "7px 0", fontSize: 18 }}>{item.title}</h3>
            <p style={{ color: demoColors.slate, lineHeight: 1.6 }}>{item.reason}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
