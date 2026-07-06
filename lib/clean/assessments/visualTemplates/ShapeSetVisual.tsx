import React from "react";
import type { ShapeSetStimulus } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { describeShapeSet } from "@/lib/clean/assessments/visualTemplates/visualAccessibility";
import {
  buildScatteredPoints,
  clampInteger,
  numberOrFallback,
} from "@/lib/clean/assessments/visualTemplates/visualUtils";

type RenderedShape = {
  type: "circle" | "triangle" | "square" | "rectangle" | "hexagon";
  size: "sm" | "md" | "lg";
  rotation: number;
  label?: string;
};

const shapeSize = {
  sm: 18,
  md: 24,
  lg: 32,
};

function renderShape(shape: RenderedShape, x: number, y: number) {
  const size = shapeSize[shape.size];
  const common = {
    fill: "#F8F5FF",
    stroke: "#6C4DF6",
    strokeWidth: 3,
  };

  if (shape.type === "circle") {
    return <circle data-testid="shape-circle" cx={x} cy={y} r={size / 2} {...common} />;
  }

  if (shape.type === "triangle") {
    const points = `${x},${y - size / 2} ${x - size / 2},${y + size / 2} ${x + size / 2},${y + size / 2}`;
    return <polygon data-testid="shape-triangle" points={points} transform={`rotate(${shape.rotation} ${x} ${y})`} {...common} />;
  }

  if (shape.type === "rectangle") {
    return (
      <rect
        data-testid="shape-rectangle"
        x={x - size * 0.7}
        y={y - size * 0.4}
        width={size * 1.4}
        height={size * 0.8}
        rx="5"
        transform={`rotate(${shape.rotation} ${x} ${y})`}
        {...common}
      />
    );
  }

  if (shape.type === "hexagon") {
    const points = Array.from({ length: 6 }, (_, side) => {
      const angle = (Math.PI / 3) * side - Math.PI / 6;
      return `${x + Math.cos(angle) * (size / 2)},${y + Math.sin(angle) * (size / 2)}`;
    }).join(" ");
    return <polygon data-testid="shape-hexagon" points={points} transform={`rotate(${shape.rotation} ${x} ${y})`} {...common} />;
  }

  return (
    <rect
      data-testid="shape-square"
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      rx="6"
      transform={`rotate(${shape.rotation} ${x} ${y})`}
      {...common}
    />
  );
}

export function ShapeSetVisual({ data, altText }: { data: ShapeSetStimulus; altText?: string }) {
  const shapes: RenderedShape[] = data.shapes.flatMap((shape) =>
    Array.from({ length: clampInteger(shape.count || 1, 1, 20, 1) }, () => ({
      type: shape.type,
      size: shape.size || "md",
      rotation: numberOrFallback(shape.rotation, 0),
      label: shape.label,
    })),
  );
  const arrangement = data.arrangement || "grid";
  const seed = numberOrFallback(data.seed, 1);
  const label = altText || describeShapeSet(data);
  const points =
    arrangement === "scattered"
      ? buildScatteredPoints(shapes.length, seed, { minX: 34, maxX: 286, minY: 36, maxY: 132 }, 34)
      : shapes.map((_, index) => ({
          x: 42 + (index % 6) * 48,
          y: arrangement === "row" ? 86 : 48 + Math.floor(index / 6) * 50,
        }));

  return (
    <div style={{ border: "1px solid #D9D0FF", borderRadius: 22, background: "#ffffff", padding: 18 }}>
      <svg viewBox="0 0 320 170" role="img" aria-label={label} style={{ width: "100%", display: "block" }}>
        <rect x="12" y="12" width="296" height="146" rx="22" fill="#F8FAFC" stroke="#E7EAF2" />
        {shapes.map((shape, index) => (
          <g key={`${shape.type}-${index}`}>{renderShape(shape, points[index].x, points[index].y)}</g>
        ))}
      </svg>
    </div>
  );
}
