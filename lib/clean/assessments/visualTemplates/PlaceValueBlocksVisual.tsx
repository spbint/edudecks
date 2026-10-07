import React from "react";
import type { PlaceValueBlocksStimulus } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { describePlaceValueBlocks } from "@/lib/clean/assessments/visualTemplates/visualAccessibility";
import { BASE_TEN_MANIPULATIVE_SPEC } from "@/lib/clean/assessments/visualTemplates/trustedMathAssetSpecifications";
import { clampInteger } from "@/lib/clean/assessments/visualTemplates/visualUtils";

type BaseTenKind = "thousand" | "hundred" | "ten" | "one";

const { palette } = BASE_TEN_MANIPULATIVE_SPEC;

const BLOCK_DIMENSIONS: Record<
  BaseTenKind,
  { width: number; height: number; viewBox: string }
> = {
  thousand: { width: 116, height: 116, viewBox: "0 0 224 224" },
  hundred: { width: 104, height: 104, viewBox: "0 0 200 200" },
  ten: { width: 28, height: 142, viewBox: "0 0 40 204" },
  one: { width: 30, height: 30, viewBox: "0 0 40 40" },
};

function gridLines(
  start: number,
  end: number,
  count: number,
  orientation: "horizontal" | "vertical",
) {
  const step = (end - start) / count;
  return Array.from({ length: count - 1 }, (_, index) => {
    const position = start + step * (index + 1);
    return orientation === "vertical" ? (
      <line
        key={`v-${index}`}
        x1={position}
        y1={start}
        x2={position}
        y2={end}
        stroke={palette.grid}
        strokeWidth="1.4"
      />
    ) : (
      <line
        key={`h-${index}`}
        x1={start}
        y1={position}
        x2={end}
        y2={position}
        stroke={palette.grid}
        strokeWidth="1.4"
      />
    );
  });
}

function UnitCube() {
  return (
    <>
      <ellipse cx="20" cy="34" rx="14" ry="3" fill={palette.shadow} opacity="0.16" />
      <polygon points="6,12 13,5 34,5 27,12" fill={palette.light} stroke={palette.edge} strokeWidth="1.5" />
      <polygon points="27,12 34,5 34,26 27,33" fill={palette.side} stroke={palette.edge} strokeWidth="1.5" />
      <rect x="6" y="12" width="21" height="21" fill={palette.face} stroke={palette.edge} strokeWidth="1.8" />
    </>
  );
}

function TenRod() {
  return (
    <>
      <ellipse cx="20" cy="198" rx="15" ry="4" fill={palette.shadow} opacity="0.16" />
      <polygon points="6,12 13,5 34,5 27,12" fill={palette.light} stroke={palette.edge} strokeWidth="1.5" />
      <polygon points="27,12 34,5 34,187 27,194" fill={palette.side} stroke={palette.edge} strokeWidth="1.5" />
      <rect x="6" y="12" width="21" height="182" fill={palette.face} stroke={palette.edge} strokeWidth="1.8" />
      {Array.from({ length: 9 }, (_, index) => {
        const y = 12 + ((index + 1) * 182) / 10;
        return <line key={index} x1="6" y1={y} x2="27" y2={y} stroke={palette.grid} strokeWidth="1.4" />;
      })}
    </>
  );
}

function HundredFlat() {
  return (
    <>
      <ellipse cx="100" cy="193" rx="88" ry="6" fill={palette.shadow} opacity="0.14" />
      <polygon points="8,16 16,8 192,8 184,16" fill={palette.light} stroke={palette.edge} strokeWidth="2" />
      <polygon points="184,16 192,8 192,184 184,192" fill={palette.side} stroke={palette.edge} strokeWidth="2" />
      <rect x="8" y="16" width="176" height="176" fill={palette.face} stroke={palette.edge} strokeWidth="2.2" />
      <g transform="translate(0 8)">
        {gridLines(8, 184, BASE_TEN_MANIPULATIVE_SPEC.hundredColumns, "vertical")}
        {gridLines(8, 184, BASE_TEN_MANIPULATIVE_SPEC.hundredRows, "horizontal")}
      </g>
    </>
  );
}

function ThousandCube() {
  const gridStart = 12;
  const gridEnd = 192;
  return (
    <>
      <ellipse cx="112" cy="215" rx="101" ry="7" fill={palette.shadow} opacity="0.16" />
      <polygon points="12,32 32,12 212,12 192,32" fill={palette.light} stroke={palette.edge} strokeWidth="2.4" />
      <polygon points="192,32 212,12 212,192 192,212" fill={palette.side} stroke={palette.edge} strokeWidth="2.4" />
      <rect x="12" y="32" width="180" height="180" fill={palette.face} stroke={palette.edge} strokeWidth="2.6" />
      <g transform="translate(0 20)">
        {gridLines(gridStart, gridEnd, BASE_TEN_MANIPULATIVE_SPEC.thousandColumns, "vertical")}
        {gridLines(gridStart, gridEnd, BASE_TEN_MANIPULATIVE_SPEC.thousandRows, "horizontal")}
      </g>
      {Array.from({ length: 9 }, (_, index) => {
        const offset = ((index + 1) * 180) / 10;
        const depth = ((index + 1) * 20) / 10;
        return (
          <React.Fragment key={index}>
            <line x1={12 + offset} y1="32" x2={32 + offset} y2="12" stroke={palette.grid} strokeWidth="1.2" />
            <line x1={12 + depth} y1={32 - depth} x2={192 + depth} y2={32 - depth} stroke={palette.grid} strokeWidth="1.2" />
            <line x1="192" y1={32 + offset} x2="212" y2={12 + offset} stroke={palette.grid} strokeWidth="1.2" />
            <line x1={192 + depth} y1={32 - depth} x2={192 + depth} y2={212 - depth} stroke={palette.grid} strokeWidth="1.2" />
          </React.Fragment>
        );
      })}
    </>
  );
}

function BaseTenManipulative({ kind }: { kind: BaseTenKind }) {
  const dimensions = BLOCK_DIMENSIONS[kind];
  return (
    <svg
      aria-hidden="true"
      data-testid={`place-value-${kind}`}
      data-base-ten-kind={kind}
      viewBox={dimensions.viewBox}
      width={dimensions.width}
      height={dimensions.height}
      style={{ display: "block", flex: "0 0 auto", overflow: "visible" }}
    >
      {kind === "one" ? <UnitCube /> : null}
      {kind === "ten" ? <TenRod /> : null}
      {kind === "hundred" ? <HundredFlat /> : null}
      {kind === "thousand" ? <ThousandCube /> : null}
    </svg>
  );
}

function BlockGroup({
  kind,
  label,
  count,
}: {
  kind: BaseTenKind;
  label: string;
  count: number;
}) {
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <span style={{ color: "#475569", fontSize: 13, fontWeight: 850 }}>{label}</span>
      <div
        style={{
          minHeight: kind === "ten" ? 142 : 34,
          display: "flex",
          alignItems: "flex-end",
          gap: kind === "one" ? 8 : 7,
          flexWrap: "wrap",
        }}
      >
        {Array.from({ length: count }, (_, index) => (
          <BaseTenManipulative key={`${kind}-${index}`} kind={kind} />
        ))}
      </div>
    </section>
  );
}

export function PlaceValueBlocksVisual({
  data,
  altText,
}: {
  data: PlaceValueBlocksStimulus;
  altText?: string;
}) {
  const groups = [
    { kind: "thousand" as const, label: "Thousands", count: clampInteger(data.thousands || 0, 0, 9, 0) },
    { kind: "hundred" as const, label: "Hundreds", count: clampInteger(data.hundreds || 0, 0, 9, 0) },
    { kind: "ten" as const, label: "Tens", count: clampInteger(data.tens || 0, 0, 9, 0) },
    { kind: "one" as const, label: "Ones", count: clampInteger(data.ones || 0, 0, 9, 0) },
  ].filter((group) => group.count > 0);
  const label = altText || describePlaceValueBlocks(data);

  return (
    <div
      role="img"
      aria-label={label}
      data-testid="trusted-base-ten-visual"
      style={{
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #B8D9E8",
        borderRadius: 20,
        background: "linear-gradient(180deg, #FFFFFF 0%, #F4FBFE 100%)",
        padding: "clamp(12px, 4vw, 18px)",
        display: "grid",
        gap: 14,
        overflow: "hidden",
      }}
    >
      {groups.length ? groups.map((group) => (
        <BlockGroup key={group.kind} {...group} />
      )) : (
        <span style={{ color: "#64748B", fontWeight: 800 }}>No blocks shown</span>
      )}
    </div>
  );
}
