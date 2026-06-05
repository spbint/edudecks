"use client";

import { carterFamilyDemo } from "@/lib/demo/carterFamilyDemoData";
import { demoButton, demoCard, demoColors } from "@/components/demo/DemoShell";

export default function DemoDay({ onNext }: { onNext: () => void }) {
  return (
    <section id="demo-today" style={{ ...demoCard, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: demoColors.green, fontWeight: 900, fontSize: 12 }}>
            MY DAY DEMO
          </div>
          <h2 style={{ margin: "6px 0", fontSize: 30 }}>{carterFamilyDemo.currentDay.date}</h2>
          <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.7 }}>
            My Day is the short daily view. The full four-week plan stays in My Calendar.
          </p>
        </div>
        <button type="button" onClick={onNext} style={demoButton}>
          Follow pathway
        </button>
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {carterFamilyDemo.currentDay.blocks.map((block) => (
          <div
            key={block}
            style={{
              border: `1px solid ${demoColors.line}`,
              borderRadius: 16,
              padding: 14,
              background: "#fbfdff",
              color: demoColors.slate,
              fontWeight: 700,
            }}
          >
            {block}
          </div>
        ))}
      </div>
    </section>
  );
}
