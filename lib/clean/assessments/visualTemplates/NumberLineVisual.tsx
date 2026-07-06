import React from "react";
import type { NumberLineStimulus } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { describeNumberLine } from "@/lib/clean/assessments/visualTemplates/visualAccessibility";
import { InvalidStimulus } from "@/lib/clean/assessments/visualTemplates/InvalidStimulus";
import { numberOrFallback } from "@/lib/clean/assessments/visualTemplates/visualUtils";

function positionFor(value: number, min: number, max: number) {
  return 24 + ((value - min) / (max - min)) * 352;
}

export function NumberLineVisual({
  data,
  altText,
}: {
  data: NumberLineStimulus;
  altText?: string;
}) {
  const min = numberOrFallback(data.min, 0);
  const max = numberOrFallback(data.max, 10);
  const step = Math.max(1, numberOrFallback(data.step, 1));
  if (max <= min) return <InvalidStimulus message="number-line max must be greater than min" />;

  const marker = data.marker === undefined ? null : numberOrFallback(data.marker, min);
  if (marker !== null && (marker < min || marker > max)) {
    return <InvalidStimulus message="number-line marker must be between min and max" />;
  }

  const hiddenLabels = new Set(data.hiddenLabels || []);
  const ticks: number[] = [];
  for (let value = min; value <= max; value += step) {
    ticks.push(value);
  }
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  const label = altText || describeNumberLine({ ...data, min, max, step, marker: marker ?? undefined });

  return (
    <div style={{ border: "1px solid #D9D0FF", borderRadius: 22, background: "#ffffff", padding: 18 }}>
      <svg viewBox="0 0 400 150" role="img" aria-label={label} style={{ width: "100%", display: "block" }}>
        <line x1="24" y1="76" x2="376" y2="76" stroke="#17204B" strokeWidth="3" strokeLinecap="round" />
        {data.highlightedSegment ? (
          <line
            data-testid="number-line-highlight"
            x1={positionFor(data.highlightedSegment.from, min, max)}
            y1="76"
            x2={positionFor(data.highlightedSegment.to, min, max)}
            y2="76"
            stroke="#2F9D68"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.35"
          />
        ) : null}
        {data.jumps?.map((jump, index) => {
          const fromX = positionFor(jump.from, min, max);
          const toX = positionFor(jump.to, min, max);
          const mid = (fromX + toX) / 2;
          const arcHeight = 22 + index * 6;
          return (
            <g key={`${jump.from}-${jump.to}-${index}`} data-testid="number-line-jump">
              <path
                d={`M ${fromX} 68 Q ${mid} ${68 - arcHeight} ${toX} 68`}
                fill="none"
                stroke="#6C4DF6"
                strokeWidth="3"
              />
              {jump.label ? (
                <text x={mid} y={44 - index * 5} textAnchor="middle" fill="#5B3BE8" fontSize="13" fontWeight="800">
                  {jump.label}
                </text>
              ) : null}
            </g>
          );
        })}
        {ticks.map((value) => {
          const x = positionFor(value, min, max);
          return (
            <g key={value}>
              <line x1={x} y1="64" x2={x} y2="88" stroke="#17204B" strokeWidth="2" />
              {hiddenLabels.has(value) ? (
                <text x={x} y="116" textAnchor="middle" fill="#94A3B8" fontSize="14" fontWeight="900">
                  ?
                </text>
              ) : (
                <text x={x} y="116" textAnchor="middle" fill="#17204B" fontSize="14" fontWeight="800">
                  {value}
                </text>
              )}
            </g>
          );
        })}
        {marker !== null ? (
          <g data-testid="number-line-marker" data-marker-value={marker}>
            <circle cx={positionFor(marker, min, max)} cy="76" r="11" fill="#6C4DF6" />
            <circle cx={positionFor(marker, min, max)} cy="76" r="17" fill="none" stroke="#B9A8FF" strokeWidth="3" />
          </g>
        ) : null}
      </svg>
    </div>
  );
}
