import React from "react";
import type { ArrayStimulus } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { describeArray } from "@/lib/clean/assessments/visualTemplates/visualAccessibility";
import { InvalidStimulus } from "@/lib/clean/assessments/visualTemplates/InvalidStimulus";
import { clampInteger } from "@/lib/clean/assessments/visualTemplates/visualUtils";

export function ArrayVisual({ data, altText }: { data: ArrayStimulus; altText?: string }) {
  const rows = clampInteger(data.rows, 1, 10, 1);
  const columns = clampInteger(data.columns, 1, 10, 1);
  if (rows * columns > 100) return <InvalidStimulus message="array item count must be 100 or less" />;

  const highlightRows = new Set(data.highlightRows || []);
  const highlightColumns = new Set(data.highlightColumns || []);
  const label = altText || describeArray({ ...data, rows, columns });
  const itemShape = data.itemShape || "dot";

  return (
    <div
      role="img"
      aria-label={label}
      style={{ border: "1px solid #D9D0FF", borderRadius: 22, background: "#ffffff", padding: 18 }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(22px, 1fr))`,
          gap: 9,
          maxWidth: Math.min(520, columns * 54),
          margin: "0 auto",
        }}
      >
        {Array.from({ length: rows * columns }, (_, index) => {
          const row = Math.floor(index / columns) + 1;
          const column = (index % columns) + 1;
          const highlighted = highlightRows.has(row) || highlightColumns.has(column);
          const radius = itemShape === "square" ? 8 : itemShape === "circle" ? 999 : 999;
          return (
            <div
              key={index}
              data-testid="array-item"
              data-row={row}
              data-column={column}
              style={{
                aspectRatio: "1 / 1",
                border: highlighted ? "2px solid #2F9D68" : "1px solid #D9D0FF",
                borderRadius: radius,
                background: highlighted ? "#DCFCE7" : "#F8F5FF",
                boxShadow: "inset 0 0 0 4px #ffffff",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
