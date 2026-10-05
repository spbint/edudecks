import React from "react";
import type { CounterSetStimulus } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { describeCounterSet } from "@/lib/clean/assessments/visualTemplates/visualAccessibility";
import {
  buildScatteredPoints,
  clampInteger,
  numberOrFallback,
} from "@/lib/clean/assessments/visualTemplates/visualUtils";

function buildCounterPoints(data: CounterSetStimulus) {
  const quantity = clampInteger(data.quantity, 0, data.maxQuantity || 20, 0);
  const arrangement = data.arrangement || "scattered";
  const seed = numberOrFallback(data.seed, 1);

  if (arrangement === "line") {
    return Array.from({ length: quantity }, (_, index) => ({
      x: 32 + (index % 10) * 17,
      y: index < 10 ? 72 : 104,
    }));
  }

  if (arrangement === "array" || arrangement === "ten-frame-like" || arrangement === "five-frame") {
    return Array.from({ length: quantity }, (_, index) => ({
      x: 36 + (index % 5) * 32,
      y: index < 5 ? 62 : 104,
    }));
  }

  if (arrangement === "dice") {
    const positions = [
      [110, 76],
      [76, 48],
      [144, 104],
      [76, 104],
      [144, 48],
      [76, 76],
      [144, 76],
      [110, 48],
      [110, 104],
    ];
    return positions.slice(0, quantity).map(([x, y]) => ({ x, y }));
  }

  if (quantity > 6) {
    const slots = Array.from({ length: 20 }, (_, slotIndex) => {
      const column = slotIndex % 5;
      const row = Math.floor(slotIndex / 5);
      return {
        slotIndex,
        score: seededUnit(seed, slotIndex, 9),
        x: 48 + column * 31 + (seededUnit(seed, slotIndex, 10) - 0.5) * 2,
        y: 40 + row * 23 + (seededUnit(seed, slotIndex, 11) - 0.5) * 2,
      };
    })
      .sort((a, b) => a.score - b.score)
      .slice(0, quantity)
      .sort((a, b) => a.slotIndex - b.slotIndex);

    return slots.map(({ x, y }) => ({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
    }));
  }

  return buildScatteredPoints(
    quantity,
    seed,
    { minX: 44, maxX: 176, minY: 44, maxY: 108 },
    28,
  );
}

export function CounterSetVisual({
  data,
  altText,
}: {
  data: CounterSetStimulus;
  altText?: string;
}) {
  const points = buildCounterPoints(data);
  const label = altText || describeCounterSet(data);
  const counterRadius = points.length > 10 ? 9 : points.length > 6 ? 10 : 14;

  return (
    <div
      style={{
        border: "1px solid #D9D0FF",
        borderRadius: 22,
        background: "linear-gradient(180deg, #FFFFFF 0%, #F8F5FF 100%)",
        padding: 18,
      }}
    >
      <svg
        viewBox="0 0 220 150"
        role="img"
        aria-label={label}
        style={{ width: "100%", maxHeight: 260, display: "block" }}
      >
        <rect x="18" y="18" width="184" height="114" rx="22" fill="#ffffff" stroke="#E7EAF2" />
        {points.map((point, index) => (
          <g key={`${point.x}-${point.y}-${index}`} data-testid="counter">
            <circle cx={point.x} cy={point.y} r={counterRadius} fill="#6C4DF6" />
            <circle
              cx={point.x - counterRadius * 0.3}
              cy={point.y - counterRadius * 0.35}
              r={Math.max(2.5, counterRadius * 0.28)}
              fill="#B9A8FF"
              opacity="0.8"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
