"use client";

import type { GeneratedSequenceItem } from "@/lib/intelligence/plans/types";
import SequenceEditor from "./SequenceEditor";

export default function UnitSequenceEditor({ values, onChange }: { values: GeneratedSequenceItem[]; onChange: (values: GeneratedSequenceItem[]) => void }) {
  return <SequenceEditor label="Unit sequence" values={values} onChange={onChange} />;
}
