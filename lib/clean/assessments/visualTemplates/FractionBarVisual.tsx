import React from "react";
import type { FractionBarStimulus } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { describeFractionBar } from "@/lib/clean/assessments/visualTemplates/visualAccessibility";
import { InvalidStimulus } from "@/lib/clean/assessments/visualTemplates/InvalidStimulus";
import { clampInteger } from "@/lib/clean/assessments/visualTemplates/visualUtils";

function FractionRow({
  numerator,
  denominator,
  label,
  showLabels,
}: {
  numerator: number;
  denominator: number;
  label?: string;
  showLabels?: boolean;
}) {
  return (
    <div style={{ display: "grid", gap: 7 }}>
      {label ? <span style={{ color: "#64748b", fontSize: 12, fontWeight: 850 }}>{label}</span> : null}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${denominator}, 1fr)`, minHeight: 58 }}>
        {Array.from({ length: denominator }, (_, index) => {
          const filled = index < numerator;
          return (
            <div
              key={index}
              data-testid={filled ? "fraction-part-filled" : "fraction-part"}
              style={{
                border: "2px solid #17204B",
                borderLeftWidth: index === 0 ? 2 : 0,
                background: filled
                  ? "repeating-linear-gradient(135deg, #6C4DF6 0 8px, #7C66F7 8px 14px)"
                  : "#F8FAFC",
                display: "grid",
                placeItems: "center",
                color: filled ? "#ffffff" : "#64748b",
                fontWeight: 900,
              }}
            >
              {showLabels ? `${index + 1}` : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FractionBarVisual({
  data,
  altText,
}: {
  data: FractionBarStimulus;
  altText?: string;
}) {
  const denominator = clampInteger(data.denominator, 1, 20, 1);
  const numerator = clampInteger(data.numerator, 0, denominator, 0);
  if (denominator <= 0 || numerator > denominator) {
    return <InvalidStimulus message="fraction numerator must be between 0 and denominator" />;
  }
  const label = altText || describeFractionBar({ ...data, numerator, denominator });

  return (
    <div
      role="img"
      aria-label={label}
      style={{ border: "1px solid #D9D0FF", borderRadius: 22, background: "#ffffff", padding: 18, display: "grid", gap: 14 }}
    >
      <FractionRow numerator={numerator} denominator={denominator} label="Main fraction" showLabels={data.showLabels} />
      {data.comparison?.map((comparison, index) => {
        const comparisonDenominator = clampInteger(comparison.denominator, 1, 20, 1);
        const comparisonNumerator = clampInteger(comparison.numerator, 0, comparisonDenominator, 0);
        return (
          <FractionRow
            key={`${comparison.numerator}-${comparison.denominator}-${index}`}
            numerator={comparisonNumerator}
            denominator={comparisonDenominator}
            label={comparison.label || `Comparison ${index + 1}`}
            showLabels={data.showLabels}
          />
        );
      })}
    </div>
  );
}
