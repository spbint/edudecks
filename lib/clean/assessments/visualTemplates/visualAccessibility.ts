import type {
  ArrayStimulus,
  CounterSetStimulus,
  FractionBarStimulus,
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

export function describeShapeSet(data: ShapeSetStimulus) {
  const parts = data.shapes.map((shape) => pluralise(shape.count || 1, shape.type));
  return `Set of shapes showing ${parts.join(" and ")}.`;
}
