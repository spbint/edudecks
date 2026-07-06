import React from "react";
import type {
  ArrayStimulus,
  CounterSetStimulus,
  FractionBarStimulus,
  MyLearnaAssessmentStimulus,
  NumberLineStimulus,
  PlaceValueBlocksStimulus,
  ShapeSetStimulus,
  TenFrameStimulus,
} from "@/lib/clean/assessments/mylearnaAssessTypes";
import { ArrayVisual } from "@/lib/clean/assessments/visualTemplates/ArrayVisual";
import { CounterSetVisual } from "@/lib/clean/assessments/visualTemplates/CounterSetVisual";
import { FractionBarVisual } from "@/lib/clean/assessments/visualTemplates/FractionBarVisual";
import { InvalidStimulus } from "@/lib/clean/assessments/visualTemplates/InvalidStimulus";
import { NumberLineVisual } from "@/lib/clean/assessments/visualTemplates/NumberLineVisual";
import { PlaceValueBlocksVisual } from "@/lib/clean/assessments/visualTemplates/PlaceValueBlocksVisual";
import { ShapeSetVisual } from "@/lib/clean/assessments/visualTemplates/ShapeSetVisual";
import { TenFrameVisual } from "@/lib/clean/assessments/visualTemplates/TenFrameVisual";

export function AssessmentStimulus({ stimulus }: { stimulus: MyLearnaAssessmentStimulus }) {
  switch (stimulus.type) {
    case "counter-set":
      return <CounterSetVisual data={stimulus.data as CounterSetStimulus} altText={stimulus.altText} />;
    case "ten-frame":
      return <TenFrameVisual data={stimulus.data as TenFrameStimulus} altText={stimulus.altText} />;
    case "number-line":
      return <NumberLineVisual data={stimulus.data as NumberLineStimulus} altText={stimulus.altText} />;
    case "array":
      return <ArrayVisual data={stimulus.data as ArrayStimulus} altText={stimulus.altText} />;
    case "place-value-blocks":
      return <PlaceValueBlocksVisual data={stimulus.data as PlaceValueBlocksStimulus} altText={stimulus.altText} />;
    case "fraction-bar":
      return <FractionBarVisual data={stimulus.data as FractionBarStimulus} altText={stimulus.altText} />;
    case "shape-set":
      return <ShapeSetVisual data={stimulus.data as ShapeSetStimulus} altText={stimulus.altText} />;
    default:
      return <InvalidStimulus message={`unsupported stimulus type "${stimulus.type}"`} />;
  }
}
