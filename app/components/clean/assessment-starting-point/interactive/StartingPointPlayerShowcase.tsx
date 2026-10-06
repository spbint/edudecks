"use client";

import React, { useState } from "react";
import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";
import StartingPointPlayer from "./StartingPointPlayer";

type ShowcaseItem = {
  label: string;
  item: MyLearnaAssessmentItem;
  variants?: MyLearnaAssessmentItem[];
};

const viewportOptions = [
  { label: "Phone · 390px", width: 390 },
  { label: "Large phone · 430px", width: 430 },
  { label: "Tablet · 768px", width: 768 },
  { label: "Desktop · 1024px", width: 1024 },
] as const;

export default function StartingPointPlayerShowcase({ items }: { items: ShowcaseItem[] }) {
  const [frameWidth, setFrameWidth] = useState<number>(390);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const selected = items[selectedIndex];
  const activeItem = selected?.variants?.[variantIndex] ?? selected?.item;

  return (
    <main style={{ minHeight: "100vh", background: "#F4F2FA", padding: "clamp(16px, 4vw, 42px)" }}>
      <div style={{ width: "min(100%, 1120px)", margin: "0 auto", display: "grid", gap: 24 }}>
        <header style={{ display: "grid", gap: 12 }}>
          <span style={{ color: "#6C4DF6", fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Staff-only interaction review
          </span>
          <h1 style={{ margin: 0, color: "#17204B", fontSize: "clamp(30px, 5vw, 52px)", letterSpacing: "-0.035em" }}>
            Maths Starting Point player
          </h1>
          <p style={{ margin: 0, maxWidth: 760, color: "#5B6478", lineHeight: 1.65 }}>
            Six canonical draft questions rendered through the interactive player. Responses are evaluated only in memory by the existing scorer; this page does not save evidence or change a learner pathway.
          </p>
        </header>

        <nav aria-label="Review viewport" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {viewportOptions.map((option) => (
            <button
              key={option.width}
              type="button"
              aria-pressed={frameWidth === option.width}
              onClick={() => setFrameWidth(option.width)}
              style={{
                minHeight: 44,
                border: frameWidth === option.width ? "2px solid #6C4DF6" : "1px solid #CDD3E1",
                borderRadius: 14,
                padding: "9px 14px",
                background: frameWidth === option.width ? "#EEE9FF" : "#FFFFFF",
                color: "#17204B",
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              {option.label}
            </button>
          ))}
        </nav>

        <nav aria-label="Prototype interaction" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
          {items.map(({ label, item }, index) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={selectedIndex === index}
              onClick={() => {
                setSelectedIndex(index);
                setVariantIndex(0);
              }}
              style={{
                minHeight: 48,
                border: selectedIndex === index ? "2px solid #17204B" : "1px solid #D9DDE8",
                borderRadius: 14,
                padding: "10px 12px",
                background: selectedIndex === index ? "#17204B" : "#FFFFFF",
                color: selectedIndex === index ? "#FFFFFF" : "#17204B",
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {selected ? (
          <section style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: 4 }}>
                <h2 style={{ margin: 0, color: "#17204B", fontSize: 20 }}>{selected.label}</h2>
                <span style={{ color: "#64748B", fontSize: 12, fontWeight: 750 }}>Staff review chrome — learner surface begins inside the frame.</span>
              </div>
              <span style={{ border: "1px solid #D9D0FF", borderRadius: 999, padding: "6px 10px", background: "#F8F6FF", color: "#5535DF", fontSize: 12, fontWeight: 850 }}>Viewport {frameWidth}px</span>
            </div>
            <div aria-label="Visual quality checks" style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {["Touch targets", "Text wrapping", "Stimulus fit", "No horizontal scroll"].map((label) => (
                <span key={label} style={{ borderRadius: 999, padding: "5px 9px", background: "#FFFFFF", border: "1px solid #E1E5EE", color: "#5B6478", fontSize: 11, fontWeight: 800 }}>{label}</span>
              ))}
            </div>
            {selected.variants && selected.variants.length > 1 ? (
              <nav aria-label={`${selected.label} review variants`} style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {selected.variants.map((variant, index) => (
                  <button key={variant.id} type="button" aria-pressed={variantIndex === index} onClick={() => setVariantIndex(index)} style={{ minHeight: 40, border: variantIndex === index ? "2px solid #6C4DF6" : "1px solid #D9DDE8", borderRadius: 12, padding: "7px 10px", background: variantIndex === index ? "#EEE9FF" : "#FFFFFF", color: "#17204B", fontWeight: 800, cursor: "pointer" }}>
                    Currency variant {index + 1}
                  </button>
                ))}
              </nav>
            ) : null}
            <div
              data-review-width={frameWidth}
              style={{
                width: `min(100%, ${frameWidth}px)`,
                margin: "0 auto",
                overflow: "hidden",
                border: "1px dashed #B9A8FF",
                borderRadius: frameWidth <= 430 ? 22 : 30,
                background: "#FFFFFF",
              }}
            >
              <StartingPointPlayer
                key={activeItem.id}
                item={activeItem}
                progress={{ current: selectedIndex + 1, total: items.length }}
              />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
