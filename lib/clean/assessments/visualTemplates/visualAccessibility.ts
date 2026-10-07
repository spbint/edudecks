import type {
  ArrayStimulus,
  CounterSetStimulus,
  CurrencyTokenStimulus,
  FractionBarStimulus,
  GraduatedScaleStimulus,
  NumberLineStimulus,
  PlaceValueBlocksStimulus,
  ShapeSetStimulus,
  TenFrameStimulus,
} from "@/lib/clean/assessments/mylearnaAssessTypes";
import { pluralise } from "@/lib/clean/assessments/visualTemplates/visualUtils";

const numberWords: Record<number, string> = {
  0: "Zero",
  1: "One",
  2: "Two",
  3: "Three",
  4: "Four",
  5: "Five",
  6: "Six",
  7: "Seven",
  8: "Eight",
  9: "Nine",
  10: "Ten",
};

export function describeCounterSet(data: CounterSetStimulus) {
  const quantity = Math.max(0, Math.floor(Number(data.quantity) || 0));
  const word = numberWords[quantity] || String(quantity);
  return `${word} counters shown in a ${data.arrangement || "scattered"} arrangement.`;
}

export function describeTenFrame(data: TenFrameStimulus) {
  return `Ten frame showing ${data.filled} filled spaces out of ${data.total || 10}.`;
}

export function describeNumberLine(data: NumberLineStimulus) {
  const marker = Number.isFinite(Number(data.marker)) ? ` with a marker at ${data.marker}` : "";
  return `Number line from ${data.min} to ${data.max}${marker}.`;
}

export function describeArray(data: ArrayStimulus) {
  const rows = Math.max(0, Math.floor(Number(data.rows) || 0));
  const columns = Math.max(0, Math.floor(Number(data.columns) || 0));
  return `Array with ${rows} rows and ${columns} columns, showing ${rows * columns} items.`;
}

export function describePlaceValueBlocks(data: PlaceValueBlocksStimulus) {
  const parts = [
    data.thousands ? pluralise(data.thousands, "thousand") : "",
    data.hundreds ? pluralise(data.hundreds, "hundred") : "",
    data.tens ? pluralise(data.tens, "ten") : "",
    data.ones ? pluralise(data.ones, "one") : "",
  ].filter(Boolean);
  return `Place-value blocks showing ${parts.length ? parts.join(", ") : "zero"}.`;
}

export function describeFractionBar(data: FractionBarStimulus) {
  return `Fraction bar showing ${data.numerator} out of ${data.denominator} equal parts shaded.`;
}

export function describeCurrencyTokens(data: CurrencyTokenStimulus) {
  if (!data.tokens.length) return "No Australian coins or notes are shown.";
  const allCoins = data.tokens.every((token) =>
    ["5c", "10c", "20c", "50c", "$1", "$2"].includes(token.denomination),
  );
  return `${allCoins ? "Australian coins" : "Australian money"} shown in this order: ${data.tokens
    .map((token) => token.denomination)
    .join(", ")}.`;
}

export function describeGraduatedScale(data: GraduatedScaleStimulus) {
  const subdivisions = Math.max(1, Math.floor(Number(data.subdivisions) || 1));
  const minorStep = data.majorStep / subdivisions;
  const markerIndex = Math.round((data.marker - data.min) / minorStep);
  const orientation = data.orientation || "horizontal";
  const firstMajorIndex = Math.round(data.majorStep / minorStep);
  const relative =
    markerIndex === 0
      ? "at the first labelled value"
      : markerIndex === firstMajorIndex
        ? "at the next labelled value"
        : markerIndex < firstMajorIndex
          ? `at interval ${markerIndex} of ${firstMajorIndex} after the first labelled value`
          : `at interval ${markerIndex} from the first labelled value`;

  return `${orientation === "vertical" ? "Vertical" : "Horizontal"} ${data.unit} scale from ${data.min} to ${data.max}, with ${subdivisions} equal intervals per major step and a pointer ${relative}.`;
}

export function describeShapeSet(data: ShapeSetStimulus) {
  const parts = data.shapes.map((shape) => pluralise(shape.count || 1, shape.type));
  return `Set of shapes showing ${parts.join(" and ")}.`;
}
