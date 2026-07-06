import React from "react";
import type { TenFrameStimulus } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { describeTenFrame } from "@/lib/clean/assessments/visualTemplates/visualAccessibility";
import { InvalidStimulus } from "@/lib/clean/assessments/visualTemplates/InvalidStimulus";
import { clampInteger } from "@/lib/clean/assessments/visualTemplates/visualUtils";

export function TenFrameVisual({ data, altText }: { data: TenFrameStimulus; altText?: string }) {
  const total = data.total || 10;
  if (total !== 10) return <InvalidStimulus message="ten-frame total must be 10" />;

  const filled = clampInteger(data.filled, 0, 10, 0);
  const customFilled = data.fillOrder === "custom" ? new Set(data.customFilledCells || []) : null;
  const label = altText || describeTenFrame({ ...data, filled });

  return (
    <div
      role="img"
      aria-label={label}
      style={{
        border: "1px solid #D9D0FF",
        borderRadius: 22,
        background: "#ffffff",
        padding: 18,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(36px, 1fr))",
          gap: 8,
          maxWidth: 420,
          margin: "0 auto",
        }}
      >
        {Array.from({ length: 10 }, (_, index) => {
          const isFilled = customFilled ? customFilled.has(index) : index < filled;
          return (
            <div
              key={index}
              data-testid={isFilled ? "ten-frame-cell-filled" : "ten-frame-cell"}
              style={{
                aspectRatio: "1 / 1",
                border: "2px solid #CBD5E1",
                borderRadius: 12,
                background: isFilled ? "#6C4DF6" : "#F8FAFC",
                boxShadow: isFilled ? "inset 0 0 0 4px #B9A8FF" : "inset 0 0 0 3px #ffffff",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
