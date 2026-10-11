import React from "react";
import type { GraduatedScaleStimulus } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { describeGraduatedScale } from "@/lib/clean/assessments/visualTemplates/visualAccessibility";
import { InvalidStimulus } from "@/lib/clean/assessments/visualTemplates/InvalidStimulus";

function formatNumber(value: number) {
  return String(Number(value.toFixed(6)));
}

function scaleModel(data: GraduatedScaleStimulus) {
  const min = Number(data.min);
  const max = Number(data.max);
  const majorStep = Number(data.majorStep);
  const subdivisions = Math.max(
    1,
    Math.min(20, Math.floor(Number(data.subdivisions) || 1)),
  );

  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    !Number.isFinite(majorStep) ||
    !Number.isFinite(Number(data.marker)) ||
    max <= min ||
    majorStep <= 0 ||
    data.marker < min ||
    data.marker > max
  ) {
    return null;
  }

  const minorStep = majorStep / subdivisions;
  const rawIntervals = (max - min) / minorStep;
  const intervalCount = Math.round(rawIntervals);
  if (
    intervalCount < 1 ||
    intervalCount > 100 ||
    Math.abs(rawIntervals - intervalCount) > 1e-6
  ) {
    return null;
  }

  const markerRawIndex = (data.marker - min) / minorStep;
  const markerIndex = Math.round(markerRawIndex);
  if (Math.abs(markerRawIndex - markerIndex) > 1e-6) return null;

  return { min, subdivisions, minorStep, intervalCount, markerIndex };
}

export function GraduatedScaleVisual({
  data,
  altText,
}: {
  data: GraduatedScaleStimulus;
  altText?: string;
}) {
  const model = scaleModel(data);
  if (!model) {
    return <InvalidStimulus message="invalid graduated scale data" />;
  }

  const label = altText || describeGraduatedScale(data);
  const labelMajorTicks = data.labelMajorTicks !== false;
  const ticks = Array.from({ length: model.intervalCount + 1 }, (_, index) => ({
    index,
    value: model.min + index * model.minorStep,
    major: index % model.subdivisions === 0,
  }));
  const left = 36;
  const right = 404;
  const axisY = 92;
  const markerX =
    left + (model.markerIndex / model.intervalCount) * (right - left);

  return (
    <div
      role="img"
      aria-label={label}
      data-orientation={data.orientation || "horizontal"}
      style={{
        border: "1px solid #D9D0FF",
        borderRadius: 22,
        background: "#ffffff",
        padding: 16,
        overflowX: "auto",
      }}
    >
      <svg
        viewBox="0 0 440 150"
        width="440"
        height="150"
        aria-hidden="true"
        style={{ maxWidth: "100%", minWidth: 300 }}
      >
        <line
          x1={left}
          y1={axisY}
          x2={right}
          y2={axisY}
          stroke="#17204B"
          strokeWidth="4"
        />
        {ticks.map((tick) => {
          const x =
            left + (tick.index / model.intervalCount) * (right - left);
          return (
            <g
              key={tick.index}
              data-testid="graduated-scale-tick"
              data-major={tick.major ? "true" : "false"}
            >
              <line
                x1={x}
                y1={axisY - (tick.major ? 18 : 11)}
                x2={x}
                y2={axisY + (tick.major ? 18 : 11)}
                stroke="#17204B"
                strokeWidth={tick.major ? 3 : 2}
              />
              {tick.major && labelMajorTicks ? (
                <text
                  x={x}
                  y={axisY + 42}
                  textAnchor="middle"
                  fill="#17204B"
                  fontSize="16"
                  fontWeight="700"
                >
                  {formatNumber(tick.value)}
                </text>
              ) : null}
            </g>
          );
        })}
        <polygon
          data-testid="graduated-scale-marker"
          points={
            markerX +
            "," +
            (axisY - 28) +
            " " +
            (markerX - 10) +
            "," +
            (axisY - 45) +
            " " +
            (markerX + 10) +
            "," +
            (axisY - 45)
          }
          fill="#6C4DF6"
        />
        <text
          x={right}
          y="28"
          textAnchor="end"
          fill="#5B6478"
          fontSize="15"
          fontWeight="700"
        >
          {data.unit}
        </text>
      </svg>
    </div>
  );
}